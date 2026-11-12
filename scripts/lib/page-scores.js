const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VDOCS = 'versioned_docs/version-2.x';
const IMG = 'static/img/2.x';
const SCORES_FILE = 'page-scores.json';
// Floor ruled by the front desk 2026-11-12 (PLAN-B3): page mean >= 8.0 and no category < 7.0.
// Ratchet: when 90% of entries pass, the floor moves to 8.5 (target stays 9.0); change these constants then.
const MEAN_FLOOR = 8.0;
const CATEGORY_FLOOR = 7.0;
const RATCHET_SHARE = 0.9;
// Error-code pages share one templated score (ruling 2026-11-12).
const GROUPS = { 'error-codes': 'error-codes/' };

function docSource(root, doc) {
  for (const ext of ['.mdx', '.md']) {
    const file = path.resolve(root, VDOCS, doc + ext);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

function hashInputs(root, doc) {
  const source = docSource(root, doc);
  const text = fs.readFileSync(source, 'utf8');
  const files = new Set([source]);
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) walk(file);
      else if (item.isFile()) files.add(file);
    }
  }
  for (const match of text.matchAll(/(?:@site\/static|)\/img\/2\.x\/([^\s"'`)\]}]+)/g)) {
    const p = match[1].replace(/[.,;:]+$/, '');
    const dir = /\.[a-z0-9]+$/i.test(path.basename(p)) ? path.dirname(p) : p;
    const full = path.resolve(root, IMG, dir);
    if (dir !== '.' && fs.existsSync(full) && fs.statSync(full).isDirectory()) walk(full);
  }
  for (const match of text.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)) {
    const file = path.resolve(path.dirname(source), match[1]);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) files.add(file);
  }
  return [...files].map((file) => path.relative(root, file).split(path.sep).join('/')).sort();
}

function pageHash(root, doc) {
  const hash = crypto.createHash('sha256');
  for (const file of hashInputs(root, doc)) {
    hash.update(file).update('\0').update(fs.readFileSync(path.join(root, file))).update('\0');
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
  VDOCS, IMG, SCORES_FILE, MEAN_FLOOR, CATEGORY_FLOOR, RATCHET_SHARE, GROUPS,
  docSource, hashInputs, pageHash, groupOf, loadScores, saveScores, meanOf, belowFloor, evaluate,
};
