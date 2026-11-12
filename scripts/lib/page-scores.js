const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

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
// The climb kit's gate.py CATEGORIES (category -> keyword); part S2 parses judge tables with them.
const CATEGORY_KEYWORDS = { 'task clarity': 'task', language: 'language', visuals: 'visual', structure: 'structure', layering: 'layering', consistency: 'consisten', accuracy: 'accura' };
const REQUIRED_CATEGORIES = Object.keys(CATEGORY_KEYWORDS);
// Ruling 2026-11-12: the terminal gateway pages are also judged on Admin setup, bound by the same floor.
const OPTIONAL_CATEGORIES = ['admin setup'];
// Judge transcripts are committed here so the gate can recompute each entry's scores (ruling 2026-11-12).
const RUNS_DIR = 'page-scores/runs';
// The front desk requires two Opus judges for every recorded score.
const JUDGES = ['opus-a', 'opus-b'];

const sha256Of = (buffer) => 'sha256:' + crypto.createHash('sha256').update(buffer).digest('hex');
const runPath = (climb, round, judge) => `${RUNS_DIR}/${climb}/r${round}/${judge}.md`;
const cleanCell = (cell) => cell.replace(/[*`_]/g, '');
// An entry's climb folder: a group's key itself, else the doc key with every / as __.
const climbOf = (key) => (Object.hasOwn(GROUPS, key) ? key : key.replaceAll('/', '__'));
// The first line of a stored transcript: the entry key (doc or group), climb, round and judge it was recorded for.
const runHeader = ({ doc, climb, round, judge }) => `<!-- page-scores run: doc=${doc} climb=${climb} round=${round} judge=${judge} -->`;

// The first Markdown table's rows as trimmed cells, as the climb kit's gate.py reads them.
function tableRows(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trimStart().startsWith('|'));
  let end = start;
  while (start !== -1 && end < lines.length && lines[end].trimStart().startsWith('|')) end++;
  const table = start === -1 ? [] : lines.slice(start, end);
  if (table.length < 3 || !/^[\s|:-]+$/.test(table[1])) throw new Error('no Markdown table');
  return table.map((line) => line.trim().replace(/^\|+|\|+$/g, '').split('|').map((cell) => cell.trim()));
}

// The first table's first score column, where every judge transcript puts the page under review; null if none or Baseline.
function firstScoreColumn(text) {
  let cell;
  try { cell = tableRows(text)[0][1]; } catch { return null; }
  const column = cleanCell(cell ?? '');
  return !column || /baseline/i.test(column) ? null : column;
}

function parseJudgeTable(text, column, categories) {
  const [header, , ...rows] = tableRows(text);
  const indexes = header.map(cleanCell).flatMap((cell, i) => (i > 0 && cell === column ? [i] : []));
  if (!indexes.length) throw new Error(`no column "${column}"`);
  if (indexes.length > 1) throw new Error(`more than one column "${column}"`);
  const scores = {};
  for (const row of rows) {
    const label = cleanCell(row[0]).toLowerCase();
    const key = categories.find((category) =>
      label.includes(Object.hasOwn(CATEGORY_KEYWORDS, category) ? CATEGORY_KEYWORDS[category] : category));
    if (key === undefined || Object.hasOwn(scores, key)) continue;
    const raw = row[indexes[0]] ?? '';
    const match = cleanCell(raw).match(/^\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?\s*$/);
    if (!match || !(Number(match[1]) >= 1 && Number(match[1]) <= 10)) throw new Error(`cannot read the ${key} score "${raw}"`);
    scores[key] = Number(match[1]);
  }
  const missing = categories.filter((key) => !Object.hasOwn(scores, key));
  if (missing.length) throw new Error(`no row for ${missing.join(', ')}`);
  return scores;
}

// The optional categories the first table has a data row for, matched as parseJudgeTable matches them; [] if no table.
function scoredOptional(text) {
  let rows;
  try { [, , ...rows] = tableRows(text); } catch { return []; }
  return OPTIONAL_CATEGORIES.filter((category) => rows.some((row) => cleanCell(row[0]).toLowerCase().includes(category)));
}

// Per-category minimum across the judges' transcripts.
function runScores(texts, columns, categories) {
  const parsed = texts.map((text, i) => parseJudgeTable(text, columns[i], categories));
  return Object.fromEntries(categories.map((key) => [key, Math.min(...parsed.map((scores) => scores[key]))]));
}

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
        { cwd: root, maxBuffer: 256 * 1024 * 1024 }).toString().trim().split('\n').filter(Boolean),
      // Large screenshots exceed execFileSync's default 1 MiB buffer.
      read: (rel) => execFileSync('git', ['show', `${commit}:${rel}`], { cwd: root, maxBuffer: 256 * 1024 * 1024 }),
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

// Two pages have the same content exactly when their pageContent lists are deep-equal.
function pageContent(root, doc, commit = null) {
  const sourceRel = path.relative(root, docSource(root, doc, commit)).split(path.sep).join('/');
  const { imports } = referencedPaths(root, doc, commit);
  const input = reader(root, commit);
  const label = (file) => (file === sourceRel ? 'source'
    : imports.includes(file) ? 'import:./' + path.posix.relative(path.posix.dirname(sourceRel), file) : file);
  return hashInputs(root, doc, commit)
    .map((file) => [label(file), crypto.createHash('sha256').update(input.read(file)).digest('hex')])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
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
  VDOCS, IMG, IMG_ROOTS, SCORES_FILE, MEAN_FLOOR, CATEGORY_FLOOR, RATCHET_SHARE, GROUPS, CATEGORY_KEYWORDS, REQUIRED_CATEGORIES, resolveCommit,
  OPTIONAL_CATEGORIES, docSource, referencedPaths, hashInputs, pageHash, pageContent, groupOf, loadScores, saveScores, meanOf, belowFloor, evaluate,
  RUNS_DIR, JUDGES, sha256Of, runPath, climbOf, runHeader, firstScoreColumn, parseJudgeTable, runScores, scoredOptional,
};
