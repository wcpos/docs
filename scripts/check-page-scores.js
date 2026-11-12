const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  VDOCS, referencedPaths, evaluate, loadScores, belowFloor, RATCHET_SHARE, MEAN_FLOOR, docSource, groupOf,
} = require('./lib/page-scores');

// Warn-only before this UTC date, then failures exit 1 (front desk ruling 2026-11-12: required from 2026-11-16).
const ENFORCE_FROM = '2026-11-16';
const EXCEPTION_LABEL = 'score-exception';
// Only the front desk applies the label, as kilbot; each use expires 24 h after it was applied (ruling 2026-11-12).
const EXCEPTION_ACTOR = 'kilbot';
const EXCEPTION_HOURS = 24;

function allDocs(root) {
  const docs = [];
  const base = path.resolve(root, VDOCS);
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.name.startsWith('_')) continue;
      const file = path.join(dir, item.name);
      if (item.isDirectory()) walk(file);
      else if (item.isFile() && /\.mdx?$/.test(item.name)) {
        const doc = path.relative(base, file).split(path.sep).join('/').replace(/\.mdx?$/, '');
        if (docSource(root, doc) === file) docs.push(doc);
      }
    }
  }
  walk(base);
  return docs.sort();
}

// Within the allowed trees, match the doc source, an exact import, or any path under a referenced image dir.
function affectedDocs(root, changedFiles) {
  const changed = new Set(changedFiles.filter((file) =>
    file.startsWith(VDOCS + '/') || file.startsWith('static/img/2.x/')));
  return allDocs(root).filter((doc) => {
    const { imgDirs, imports } = referencedPaths(root, doc);
    const source = path.relative(root, docSource(root, doc)).split(path.sep).join('/');
    return changed.has(source) || imports.some((file) => changed.has(file)) ||
      [...changed].some((file) => imgDirs.some((dir) => file.startsWith(dir + '/')));
  });
}

function checkException({ event, exceptionEvents, now }) {
  if (!event?.pull_request?.labels?.some((label) => label.name === EXCEPTION_LABEL)) {
    return { granted: false, reason: 'label absent' };
  }
  const last = exceptionEvents.at(-1);
  if (last?.actor !== EXCEPTION_ACTOR) {
    return { granted: false, reason: 'label not applied by kilbot' };
  }
  if (!(now - new Date(last.at) <= EXCEPTION_HOURS * 60 * 60 * 1000)) {
    return { granted: false, reason: `exception expired (applied ${last.at})` };
  }
  const lines = (event.pull_request.body || '').split(/\r?\n/);
  const heading = lines.indexOf('## Score exception');
  const section = lines.slice(heading + 1);
  const next = section.findIndex((line) => line.startsWith('## '));
  const text = section.slice(0, next === -1 ? section.length : next).join('\n');
  if (heading === -1 || !/(?:wcpos\/docs)?#\d+|https:\/\/github\.com\/wcpos\/docs\/issues\/\d+/.test(text)) {
    return { granted: false, reason: 'no ## Score exception section with a tracking issue' };
  }
  return { granted: true, reason: '' };
}

function run({ root, changedFiles, event, exceptionEvents, now }) {
  const docs = affectedDocs(root, changedFiles);
  const entries = loadScores(root);
  const results = docs.map((doc) => evaluate(root, doc, entries));
  const failing = results.filter((result) => result.status !== 'ok');
  const lines = results.map(({ doc, status, reasons }) =>
    `${doc}: ${status}` + (reasons.length ? ` (${reasons.join('; ')})` : ''));
  let exitCode = 0;
  if (!docs.length) lines.push('No 2.x docs changed.');
  if (failing.length) {
    const ex = checkException({ event, exceptionEvents, now });
    if (ex.granted) {
      lines.push(`::warning::score-exception granted; waived: ${failing.map(({ doc }) => doc).join(', ')}. Re-score them within 24 h.`);
    } else {
      if (event?.pull_request?.labels?.some((label) => label.name === EXCEPTION_LABEL)) {
        lines.push('::notice::' + ex.reason);
      }
      if (now.toISOString().slice(0, 10) < ENFORCE_FROM) {
        lines.push(`::warning::${failing.length} page(s) need a score (warn mode until ${ENFORCE_FROM}).`);
      } else {
        lines.push(`::error::${failing.length} page(s) need a score.`);
        exitCode = 1;
      }
      if (failing.some(({ doc }) => !groupOf(doc))) {
        lines.push('Climb each page with the docs climb kit, then: node scripts/record-page-score.js --doc <doc> --gate <gate.json> --climb <folder>');
      }
      for (const group of new Set(failing.map(({ doc }) => groupOf(doc)).filter(Boolean))) {
        lines.push(`For ${group} pages, record the template score: node scripts/record-page-score.js --group ${group} --gate <gate.json> --climb <folder> --sample <10 judged pages, comma-separated>`);
      }
    }
  }
  const values = Object.values(entries);
  if (values.length) {
    const share = values.filter(({ scores }) => belowFloor(scores).length === 0).length / values.length;
    if (share >= RATCHET_SHARE && MEAN_FLOOR < 8.5) {
      lines.push(`::notice::${Math.round(share * 100)}% of scored pages pass the floor: raise it to 8.5 (ruling 2026-11-12).`);
    }
  }
  return { exitCode, lines };
}

if (require.main === module) {
  const root = process.cwd();
  const args = process.argv.slice(2);
  const nowIndex = args.indexOf('--now');
  const now = nowIndex === -1 ? new Date() : new Date(args[nowIndex + 1]);
  const baseRef = process.env.BASE_REF || 'origin/main';
  const changedFiles = execFileSync('git', [
    'diff', '--name-only', '--diff-filter=ACMRD', `${baseRef}...HEAD`,
  ], { cwd: root, encoding: 'utf8' }).split('\n').map((line) => line.trim()).filter(Boolean);
  const eventFile = process.env.GITHUB_EVENT_PATH;
  const event = eventFile && fs.existsSync(eventFile) ? JSON.parse(fs.readFileSync(eventFile, 'utf8')) : null;
  const exceptionFile = process.env.SCORE_EXCEPTION_EVENT;
  const exceptionEvents = exceptionFile && fs.existsSync(exceptionFile)
    ? fs.readFileSync(exceptionFile, 'utf8').split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line))
    : [];
  const result = run({ root, changedFiles, event, exceptionEvents, now });
  for (const line of result.lines) console.log(line);
  process.exitCode = result.exitCode;
}

module.exports = { allDocs, affectedDocs, checkException, run, ENFORCE_FROM };
