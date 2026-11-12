const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  VDOCS, referencedPaths, evaluate, loadScores, belowFloor, RATCHET_SHARE, MEAN_FLOOR, docSource, groupOf, pageHash,
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
    file.startsWith(VDOCS + '/') || Object.values(require('./lib/page-scores').IMG_ROOTS).some((dir) => file.startsWith(dir + '/'))));
  return allDocs(root).filter((doc) => {
    const { imgDirs, imports } = referencedPaths(root, doc);
    const source = path.relative(root, docSource(root, doc)).split(path.sep).join('/');
    return changed.has(source) || imports.some((file) => changed.has(file)) ||
      [...changed].some((file) => imgDirs.some((dir) => file.startsWith(dir + '/')));
  });
}

function baseScores(root, base) {
  if (!base) return {};
  try {
    return JSON.parse(execFileSync('git', ['show', `${base}:page-scores.json`], { cwd: root, stdio: 'pipe' }));
  } catch { return {}; }
}

function same(a, b) {
  const sorted = (value) => Array.isArray(value) ? value.map(sorted)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])])) : value;
  return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
}

function checkIntegrity({ root, base, entries }) {
  const baseEntries = baseScores(root, base);
  const errors = [];
  const docs = [];
  for (const [key, entry] of Object.entries(baseEntries)) {
    if (!Object.hasOwn(entries, key) && (entry.group || docSource(root, key)) &&
        !Object.values(entries).some((value) => value.carriedFrom === key)) {
      errors.push(`${key}: entry removed while its page exists`);
    }
  }
  for (const [key, entry] of Object.entries(entries)) {
    const previous = baseEntries[key];
    if (same(entry, previous)) continue;
    if (previous?.group && same(entry, { ...previous, pages: Object.fromEntries(
      Object.entries(previous.pages).filter(([page]) => docSource(root, page)),
    ) })) continue;
    docs.push(...(entry.group ? Object.keys(entry.pages) : [key]));
    if (typeof entry.climb !== 'string' || !entry.climb || !Number.isInteger(entry.round) || entry.round < 1) {
      errors.push(`${key}: no climb round`);
      continue;
    }
    const { commit, carriedFrom: old } = entry;
    if (!/^[0-9a-f]{40}$/.test(commit)) {
      errors.push(`${key}: no judged commit`);
      continue;
    }
    try {
      if (execFileSync('git', ['cat-file', '-t', commit], { cwd: root, stdio: 'pipe' }).toString().trim() !== 'commit') throw new Error();
      execFileSync('git', ['merge-base', '--is-ancestor', commit, 'HEAD'], { cwd: root, stdio: 'pipe' });
    } catch {
      errors.push(`${key}: judged commit ${commit} is not in this branch's history`);
      continue;
    }
    const pages = entry.group ? entry.pages : { [key]: entry.hash };
    const bad = Object.keys(pages).sort().find((page) =>
      !docSource(root, page, commit) || pageHash(root, page, commit) !== pages[page]);
    if (bad !== undefined) {
      errors.push(`${key}: ${entry.group ? bad + ' ' : ''}hash does not match the judged commit`);
      continue;
    }
    if (old) {
      if (!baseEntries[old] || baseEntries[old].group) {
        errors.push(`${key}: carried from ${old} but that entry is not on the base`);
      } else if (Object.hasOwn(entries, old)) {
        errors.push(`${key}: carried from ${old} but the old entry is still present`);
      } else if (['scores', 'mean', 'round', 'climb', 'judged', 'judges'].some((field) => !same(entry[field], baseEntries[old][field]))) {
        errors.push(`${key}: carried from ${old} but its scores differ`);
      } else {
        const source = docSource(root, key, commit);
        const oldSource = docSource(root, old, base);
        if (!source || !oldSource || !execFileSync('git', ['show', `${commit}:${path.relative(root, source)}`], { cwd: root, stdio: 'pipe' })
          .equals(execFileSync('git', ['show', `${base}:${path.relative(root, oldSource)}`], { cwd: root, stdio: 'pipe' }))) {
          errors.push(`${key}: carried from ${old} but the page source changed`);
        }
      }
    }
  }
  return { errors, docs };
}

function checkException({ event, exceptionEvents, now, issueLookup = () => null }) {
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
  const numbers = [...text.matchAll(/(?:wcpos\/docs#|https:\/\/github\.com\/wcpos\/docs\/issues\/|(?<![A-Za-z0-9_/.-])#)(\d+)/g)]
    .map((match) => Number(match[1]));
  if (heading === -1 || !numbers.length) {
    return { granted: false, reason: 'no ## Score exception section with a tracking issue' };
  }
  if (!numbers.some((n) => { const issue = issueLookup(n); return issue?.state === 'open' && issue.pr === false; })) {
    return { granted: false, reason: `tracking issue #${numbers[0]} is not an open wcpos/docs issue` };
  }
  return { granted: true, reason: '' };
}

function run({ root, changedFiles, event, exceptionEvents, now, base, issueLookup }) {
  let entries;
  try { entries = loadScores(root); } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    const lines = [`::warning::page-scores.json is malformed: ${error.message}`];
    const exitCode = changedFiles.includes('page-scores.json') && now.toISOString().slice(0, 10) >= ENFORCE_FROM ? 1 : 0;
    if (exitCode) lines.push('::error::page-scores.json is malformed; fix it in this PR.');
    return { exitCode, lines };
  }
  const integrity = changedFiles.includes('page-scores.json') ? checkIntegrity({ root, base, entries }) : { errors: [], docs: [] };
  const docs = [...new Set([...affectedDocs(root, changedFiles), ...integrity.docs])].sort();
  const results = docs.map((doc) => evaluate(root, doc, entries));
  const failing = results.filter((result) => result.status !== 'ok');
  const lines = results.map(({ doc, status, reasons }) =>
    `${doc}: ${status}` + (reasons.length ? ` (${reasons.join('; ')})` : ''));
  lines.push(...integrity.errors.map((error) => `::error::page-scores.json: ${error}`));
  let exitCode = integrity.errors.length ? 1 : 0;
  if (!docs.length) lines.push('No 2.x docs changed.');
  if (failing.length) {
    const ex = checkException({ event, exceptionEvents, now, issueLookup });
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
  const base = execFileSync('git', ['merge-base', baseRef, 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const changedFiles = execFileSync('git', [
    'diff', '--name-only', '--diff-filter=ACMRD', `${baseRef}...HEAD`,
  ], { cwd: root, encoding: 'utf8' }).split('\n').map((line) => line.trim()).filter(Boolean);
  const eventFile = process.env.GITHUB_EVENT_PATH;
  const event = eventFile && fs.existsSync(eventFile) ? JSON.parse(fs.readFileSync(eventFile, 'utf8')) : null;
  const exceptionFile = process.env.SCORE_EXCEPTION_EVENT;
  const exceptionEvents = exceptionFile && fs.existsSync(exceptionFile)
    ? fs.readFileSync(exceptionFile, 'utf8').split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line))
    : [];
  const issueLookup = (n) => {
    try {
      return JSON.parse(execFileSync('gh', ['api', `repos/wcpos/docs/issues/${n}`, '--jq', '{state: .state, pr: (.pull_request != null)}'],
        { encoding: 'utf8', stdio: 'pipe' }));
    } catch { return null; }
  };
  const result = run({ root, changedFiles, event, exceptionEvents, now, base, issueLookup });
  for (const line of result.lines) console.log(line);
  process.exitCode = result.exitCode;
}

module.exports = { allDocs, affectedDocs, baseScores, checkIntegrity, checkException, run, ENFORCE_FROM };
