const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const VDOCS = 'versioned_docs/version-2.x';
const IMG = 'static/img/2.x';
// Image trees a page's hash covers: its 2.x screenshots and the printer wizard's shared images.
const IMG_ROOTS = { '2.x': 'static/img/2.x', 'printer-wizard': 'static/img/printer-wizard' };
const SCORES_FILE = 'page-scores.json';
// Floor ruled by the front desk 2026-11-12 (PLAN-B3): page mean >= 8.0 and no category < 7.0.
// Ratchet: when 90% of entries pass, the floor moves to 8.5 (target stays 9.0); change these constants then.
const MEAN_FLOOR = 8.0;
const CATEGORY_FLOOR = 7.0;
const RATCHET_SHARE = 0.9;
// Error-code pages share one templated score (ruling 2026-11-12).
const GROUPS = { 'error-codes': 'error-codes/' };

function reader(root, commit) {
  if (commit !== null) {
    const type = (rel) => {
      try {
        return execFileSync('git', ['cat-file', '-t', `${commit}:${rel}`], { cwd: root, stdio: 'pipe' }).toString().trim();
      } catch { return null; }
    };
    return {
      isFile: (rel) => type(rel) === 'blob',
      isDir: (rel) => type(rel) === 'tree',
      listFiles: (relDir) => execFileSync('git', ['ls-tree', '-r', '--name-only', commit, '--', relDir + '/'],
        { cwd: root }).toString().trim().split('\n').filter(Boolean),
      read: (rel) => execFileSync('git', ['show', `${commit}:${rel}`], { cwd: root }),
    };
  }
  function listFiles(relDir) {
    return fs.readdirSync(path.resolve(root, relDir), { withFileTypes: true }).flatMap((item) => {
      const rel = path.posix.join(relDir, item.name);
      return item.isDirectory() ? listFiles(rel) : item.isFile() ? [rel] : [];
    });
  }
  return {
    isFile: (rel) => fs.existsSync(path.resolve(root, rel)) && fs.statSync(path.resolve(root, rel)).isFile(),
    isDir: (rel) => fs.existsSync(path.resolve(root, rel)) && fs.statSync(path.resolve(root, rel)).isDirectory(),
    listFiles,
    read: (rel) => fs.readFileSync(path.resolve(root, rel)),
  };
}

function resolveCommit(root, ref) {
  try {
    return execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], { cwd: root, stdio: 'pipe' }).toString().trim();
  } catch { throw new Error(`Unknown commit: ${ref}`); }
}

function docSource(root, doc, commit = null) {
  const source = reader(root, commit);
  for (const ext of ['.mdx', '.md']) {
    const rel = path.posix.join(VDOCS, doc + ext);
    if (source.isFile(rel)) return path.resolve(root, rel);
  }
  return null;
}

function referencedPaths(root, doc, commit = null) {
  const source = docSource(root, doc, commit);
  const text = reader(root, commit).read(path.relative(root, source).split(path.sep).join('/')).toString('utf8');
  const imgDirs = new Set();
  const imports = new Set();
  for (const match of text.matchAll(/(?:@site\/static|)\/img\/(2\.x|printer-wizard)\/([^\s"'`)\]}]+)/g)) {
    const p = match[2].replace(/[.,;:]+$/, '');
    const dir = /\.[a-z0-9]+$/i.test(path.basename(p)) ? path.dirname(p) : p;
    if (dir !== '.' || match[1] === 'printer-wizard') imgDirs.add(path.relative(root, path.resolve(root, IMG_ROOTS[match[1]], dir)).split(path.sep).join('/'));
  }
  for (const match of text.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)) {
    imports.add(path.relative(root, path.resolve(path.dirname(source), match[1])).split(path.sep).join('/'));
  }
  return { imgDirs: [...imgDirs].sort(), imports: [...imports].sort() };
}

function hashInputs(root, doc, commit = null) {
  const source = docSource(root, doc, commit);
  const { imgDirs, imports } = referencedPaths(root, doc, commit);
  const input = reader(root, commit);
  const files = new Set([path.relative(root, source).split(path.sep).join('/')]);
  for (const dir of imgDirs) {
    if (input.isDir(dir)) for (const file of input.listFiles(dir)) files.add(file);
  }
  for (const imported of imports) {
    if (input.isFile(imported)) files.add(imported);
  }
  return [...files].sort();
}

function pageHash(root, doc, commit = null) {
  const hash = crypto.createHash('sha256');
  const input = reader(root, commit);
  for (const file of hashInputs(root, doc, commit)) {
    hash.update(file).update('\0').update(input.read(file)).update('\0');
  }
  return 'sha256:' + hash.digest('hex');
}

function groupOf(doc) {
  return Object.keys(GROUPS).find((group) => doc.startsWith(GROUPS[group])) || null;
}

function loadScores(root) {
  const file = path.join(root, SCORES_FILE);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

function saveScores(root, obj) {
  const sorted = Object.fromEntries(Object.keys(obj).sort().map((key) => [key, obj[key]]));
  fs.writeFileSync(path.join(root, SCORES_FILE), JSON.stringify(sorted, null, 2) + '\n');
}

function meanOf(scores) {
  const values = Object.values(scores);
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function belowFloor(scores) {
  if (!scores || !Object.keys(scores).length) return ['no scores'];
  const reasons = [];
  const mean = meanOf(scores);
  if (mean < MEAN_FLOOR) reasons.push(`mean ${mean} < ${MEAN_FLOOR.toFixed(1)}`);
  for (const [key, value] of Object.entries(scores)) {
    if (value < CATEGORY_FLOOR) reasons.push(`${key} ${value} < ${CATEGORY_FLOOR.toFixed(1)}`);
  }
  return reasons;
}

function evaluate(root, doc, entries) {
  const group = groupOf(doc);
  const entry = entries[group || doc];
  if (!entry || (group && !Object.hasOwn(entry.pages || {}, doc))) {
    return { doc, status: 'missing', reasons: [] };
  }
  if ((group ? entry.pages[doc] : entry.hash) !== pageHash(root, doc)) {
    return { doc, status: 'stale', reasons: [] };
  }
  const reasons = belowFloor(entry.scores);
  return { doc, status: reasons.length ? 'below' : 'ok', reasons };
}

module.exports = {
  VDOCS, IMG, IMG_ROOTS, SCORES_FILE, MEAN_FLOOR, CATEGORY_FLOOR, RATCHET_SHARE, GROUPS, resolveCommit,
  docSource, referencedPaths, hashInputs, pageHash, groupOf, loadScores, saveScores, meanOf, belowFloor, evaluate,
};
