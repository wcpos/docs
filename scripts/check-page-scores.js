const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
  VDOCS, referencedPaths, evaluate, loadScores, belowFloor, RATCHET_SHARE, MEAN_FLOOR, docSource, groupOf, pageHash,
  meanOf, REQUIRED_CATEGORIES, OPTIONAL_CATEGORIES, RUNS_DIR, JUDGES, sha256Of, runPath, climbOf, runHeader, firstScoreColumn, parseJudgeTable, runScores,
} = require('./lib/page-scores.js');

// Warn-only before this UTC date, then failures exit 1 (front desk ruling 2026-11-12: required from 2026-11-16).
const ENFORCE_FROM = '2026-11-16';
// Ratchet ruled by the front desk 2026-11-12: a changed entry's mean may drop at most this far below its previous record.
const MEAN_DROP = 0.3;
// A passing page made stale by an edit warns this many days from its stale-since date, then fails until re-scored (ruling 2026-11-12).
const STALE_DAYS = 7;
const EXCEPTION_LABEL = 'score-exception';
// Only the front desk applies the label, as kilbot; each use expires 24 h after it was applied (ruling 2026-11-12).
const EXCEPTION_ACTOR = 'kilbot';
const EXCEPTION_HOURS = 24;
// The hash definition changed, so when no commit matches a stored hash the 7 days start at the change's merge (ruling 2026-11-12).
const HASH_DEFINITION = 'scripts/lib/page-scores.js';
// FIX-FIRST ruling 2026-11-12: a PR editing the gate (any of scripts/, which can change what it runs) needs the score-exception
// label from kilbot. The front desk allowed the translation tooling on 2026-11-12 because the translation pipeline edits it weekly.
const TRANSLATION_TOOLING = ['scripts/build-locales.js', 'scripts/build-ui-glossary.js', 'scripts/check-translation-completeness.js',
  'scripts/check-translation-safety.js', 'scripts/sync-translations.js', 'scripts/translate-docs-local.sh', 'scripts/translation-context.md',
  'scripts/__tests__/build-locales.test.js', 'scripts/__tests__/check-translation-completeness.test.js',
  'scripts/__tests__/check-translation-safety.test.js', 'scripts/__tests__/translate-docs-local.test.js'];
// Translation tooling by prefix: a path starting with `prefix` and ending with `suffix`.
const TRANSLATION_PREFIXES = [{ prefix: 'scripts/docs-translation/', suffix: '' }, { prefix: 'scripts/__tests__/docs-translation-', suffix: '.test.js' }];
const isGateFile = (file) => (file.startsWith('scripts/') || file === '.github/workflows/page-scores.yml') &&
  !TRANSLATION_TOOLING.includes(file) &&
  !TRANSLATION_PREFIXES.some(({ prefix, suffix }) => file.startsWith(prefix) && file.endsWith(suffix));
const isHash = (hash) => typeof hash === 'string' && /^sha256:[0-9a-f]{64}$/.test(hash);
const isPlain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

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
    file.startsWith(VDOCS + '/') || Object.values(require('./lib/page-scores.js').IMG_ROOTS).some((dir) => file.startsWith(dir + '/'))));
  return allDocs(root).filter((doc) => {
    const { imgDirs, imports } = referencedPaths(root, doc);
    const source = path.relative(root, docSource(root, doc)).split(path.sep).join('/');
    return changed.has(source) || imports.some((file) => changed.has(file)) ||
      [...changed].some((file) => imgDirs.some((dir) => file.startsWith(dir + '/')));
  });
}

// The base's entries; when the base file is malformed, those of the newest first-parent commit whose file parses, with a note.
function baseScores(root, base) {
  if (!base) return { entries: {} };
  try {
    execFileSync('git', ['cat-file', '-e', `${base}:page-scores.json`], { cwd: root, stdio: 'pipe' });
  } catch { return { entries: {} }; }
  const parsed = (commit) => {
    const text = execFileSync('git', ['show', `${commit}:page-scores.json`], { cwd: root, stdio: 'pipe' });
    try { const value = JSON.parse(text); return isPlain(value) ? value : null; } catch { return null; }
  };
  if (parsed(base)) return { entries: parsed(base) };
  const log = execFileSync('git', ['log', '--first-parent', '--format=%H', base, '--', 'page-scores.json'], { cwd: root, encoding: 'utf8' });
  // A commit that deleted the file cannot be shown; skip it.
  const good = log.split('\n').filter(Boolean).find((commit) => { try { return parsed(commit); } catch { return false; } });
  return { entries: good ? parsed(good) : {}, note: `page-scores.json on the base is malformed; comparing with ${good ? good.slice(0, 12) : 'no entries'}` };
}

// Start of the newest run of first-parent commits that left the stored hash; now when only uncommitted edits did.
function staleSince(root, doc, expected, now) {
  const { imgDirs, imports } = referencedPaths(root, doc);
  const source = path.relative(root, docSource(root, doc)).split(path.sep).join('/');
  let log;
  try {
    log = execFileSync('git', ['log', '--first-parent', '--format=%H %cI', 'HEAD', '--', source, ...imgDirs, ...imports],
      { cwd: root, stdio: 'pipe' }).toString().trim();
  } catch { return now; }
  if (!log) return now;
  let since = null;
  for (const [commit, date] of log.split('\n').map((line) => line.split(' '))) {
    if (docSource(root, doc, commit) && pageHash(root, doc, commit) === expected) return since || now;
    since = new Date(date);
  }
  try {
    return new Date(execFileSync('git', ['log', '--first-parent', '-1', '--format=%cI', 'HEAD', '--', HASH_DEFINITION],
      { cwd: root, stdio: 'pipe' }).toString().trim() || now);
  } catch { return now; }
}

function same(a, b) {
  const sorted = (value) => Array.isArray(value) ? value.map(sorted)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])])) : value;
  return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
}

// The first shape problem of a changed entry, or null.
function entryProblem(entry) {
  if (!isPlain(entry)) return 'not an object';
  if (!isPlain(entry.scores)) return 'no scores';
  const bad = Object.keys(entry.scores).find((key) => !(Number.isFinite(entry.scores[key]) && entry.scores[key] >= 0 && entry.scores[key] <= 10));
  if (bad !== undefined) return `score ${bad} is not a number from 0 to 10`;
  const missing = REQUIRED_CATEGORIES.find((key) => !Object.hasOwn(entry.scores, key));
  if (missing !== undefined) return `no ${missing} score`;
  const unknown = Object.keys(entry.scores).find((key) => !REQUIRED_CATEGORIES.includes(key) && !OPTIONAL_CATEGORIES.includes(key));
  if (unknown !== undefined) return `unknown score ${unknown}`;
  const mean = meanOf(entry.scores);
  if (entry.mean !== mean) return `stored mean ${entry.mean} differs from its category scores (${mean})`;
  if (entry.group === true) return isPlain(entry.pages) && Object.values(entry.pages).every(isHash) ? null : 'bad group pages';
  return isHash(entry.hash) ? null : 'bad hash';
}

// The committed transcript bytes at HEAD when they match the recorded sha256, else the problem.
function committedRun(root, file, sha256) {
  let bytes;
  try {
    bytes = execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });
  } catch { return { problem: `judge run file ${file} is not committed` }; }
  return sha256Of(bytes) === sha256 ? { text: bytes.toString('utf8') } : { problem: `judge run file ${file} does not match its sha256` };
}

// The first problem binding entry `doc` (a doc or group key) to its committed Opus judge transcripts, or null.
function judgeRunProblem(root, doc, entry) {
  const run = entry.judgeRun;
  if (!Array.isArray(run) || run.length !== JUDGES.length || !run.every((item, i) => isPlain(item) && item.judge === JUDGES[i])) {
    return 'no judge run';
  }
  if (!same(entry.judges, JUDGES)) return 'judges differ from the judge run';
  if (entry.climb !== climbOf(doc)) return `climb ${entry.climb} is not this page's (${climbOf(doc)})`;
  const texts = [];
  for (const { judge, path: file, sha256, column } of run) {
    if (file !== runPath(entry.climb, entry.round, judge)) return `judge run ${file} is not for climb ${entry.climb} round ${entry.round}`;
    const { text, problem } = committedRun(root, file, sha256);
    if (problem) return problem;
    const [header, ...rest] = text.split('\n');
    if (header.replace(/\r$/, '') !== runHeader({ doc, climb: entry.climb, round: entry.round, judge })) return `judge run file ${file} does not name this page`;
    const body = rest.join('\n');
    if (typeof column !== 'string' || column !== firstScoreColumn(body)) return `judge run ${file} column "${column}" is not the page's own column`;
    texts.push(body);
  }
  const categories = Object.keys(entry.scores);
  for (const [i, { path: file, column }] of run.entries()) {
    try { parseJudgeTable(texts[i], column, categories); } catch (error) { return `judge run file ${file}: ${error.message}`; }
  }
  const recomputed = runScores(texts, run.map(({ column }) => column), categories);
  const key = categories.find((category) => entry.scores[category] !== recomputed[category]);
  return key === undefined ? null : `scores differ from the judge run (${key}: ${entry.scores[key]} vs ${recomputed[key]})`;
}

function checkIntegrity({ root, base, entries, baseEntries = baseScores(root, base).entries, changedFiles = [] }) {
  const errors = [];
  const docs = [];
  const invalid = [];
  for (const [key, entry] of Object.entries(baseEntries)) {
    if (!Object.hasOwn(entries, key) && (entry?.group || docSource(root, key)) &&
        !Object.values(entries).some((value) => value?.carriedFrom === key)) {
      errors.push(`${key}: entry removed while its page exists`);
    }
  }
  for (const [key, entry] of Object.entries(entries)) {
    const previous = baseEntries[key];
    if (same(entry, previous)) continue;
    if (previous?.group && same(entry, { ...previous, pages: Object.fromEntries(
      Object.entries(previous.pages || {}).filter(([page]) => docSource(root, page)),
    ) })) continue;
    const problem = entryProblem(entry);
    if (problem) { errors.push(`${key}: malformed entry (${problem})`); invalid.push(key); continue; }
    const group = entry.group === true;
    docs.push(...(group ? Object.keys(entry.pages) : [key]));
    for (const page of Object.keys(group && previous?.group && isPlain(previous.pages) ? previous.pages : {})) {
      if (!Object.hasOwn(entry.pages, page) && docSource(root, page)) errors.push(`${key}: ${page} removed from the group while its page exists`);
    }
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
    const pages = group ? entry.pages : { [key]: entry.hash };
    const bad = Object.keys(pages).sort().find((page) =>
      !docSource(root, page, commit) || pageHash(root, page, commit) !== pages[page]);
    if (bad !== undefined) {
      errors.push(`${key}: ${group ? bad + ' ' : ''}hash does not match the judged commit`);
      continue;
    }
    if (!old) {
      const problem = judgeRunProblem(root, key, entry);
      if (problem) errors.push(`${key}: ${problem}`);
    } else {
      if (!baseEntries[old] || baseEntries[old].group) {
        errors.push(`${key}: carried from ${old} but that entry is not on the base`);
      } else if (Object.hasOwn(entries, old)) {
        errors.push(`${key}: carried from ${old} but the old entry is still present`);
      } else if (['scores', 'mean', 'round', 'climb', 'judged', 'judges', 'judgeRun'].some((field) => !same(entry[field], baseEntries[old][field]))) {
        errors.push(`${key}: carried from ${old} but its scores differ`);
      } else if (docSource(root, old, base) && pageHash(root, old, base) !== baseEntries[old].hash) {
        errors.push(`${key}: carried from ${old} but that entry was already stale on the base`);
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
  // A committed transcript edited or deleted after recording fails its entry, even when page-scores.json is unchanged.
  for (const [key, entry] of Object.entries(entries)) {
    if (!isPlain(entry) || !Array.isArray(entry.judgeRun) || invalid.includes(key)) continue;
    for (const item of entry.judgeRun) {
      if (!isPlain(item) || !changedFiles.includes(item.path)) continue;
      const { problem } = committedRun(root, item.path, item.sha256);
      if (problem && !errors.includes(`${key}: ${problem}`)) errors.push(`${key}: ${problem}`);
    }
  }
  return { errors, docs, invalid };
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

// Label events from the API only, never a file in the PR; [] when gh or a line fails.
function exceptionEventsFromApi(repo, pr, exec = execFileSync) {
  try {
    return exec('gh', ['api', `repos/${repo}/issues/${pr}/events`, '--paginate', '--jq',
      '.[] | select(.event == "labeled" and .label.name == "score-exception") | {actor: .actor.login, at: .created_at}'],
    { encoding: 'utf8', stdio: 'pipe' }).split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line));
  } catch { return []; }
}

function run({ root, changedFiles, event, exceptionEvents, now, base, issueLookup }) {
  let baseEntries;
  let baseNote;
  try { ({ entries: baseEntries, note: baseNote } = baseScores(root, base)); } catch (error) {
    return { exitCode: 1, lines: [`::error::page-scores.json on the base is unreadable: ${error.message}`] };
  }
  const enforced = now.toISOString().slice(0, 10) >= ENFORCE_FROM;
  let entries;
  // A malformed head file or entry fails on any date, changed by this PR or not, so it cannot merge and brick later PRs.
  try { entries = loadScores(root); if (!isPlain(entries)) throw new SyntaxError('not an object'); } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { exitCode: 1, lines: [`::error::page-scores.json is malformed: ${error.message}; fix it in this PR.`] };
  }
  const shape = Object.entries(entries).flatMap(([key, entry]) => (entryProblem(entry) ? [{ key, error: `${key}: malformed entry (${entryProblem(entry)})` }] : []));
  const integrity = changedFiles.some((file) => file === 'page-scores.json' || file.startsWith(RUNS_DIR + '/'))
    ? checkIntegrity({ root, base, entries, baseEntries, changedFiles }) : { errors: [], docs: [], invalid: [] };
  entries = Object.fromEntries(Object.entries(entries).filter(([key]) => !integrity.invalid.includes(key) && !shape.some((bad) => bad.key === key)));
  const docs = [...new Set([...affectedDocs(root, changedFiles), ...integrity.docs])].sort();
  const results = docs.map((doc) => evaluate(root, doc, entries));
  const changed = new Set(integrity.docs);
  const failing = [];
  const warning = [];
  for (const result of results) {
    const { doc } = result;
    const entry = entries[groupOf(doc) || doc];
    let fails = result.status !== 'ok';
    if (base && !docSource(root, doc, base) && !(entry?.carriedFrom && docSource(root, entry.carriedFrom, base))) {
      // R1: a new page must clear the floor.
    } else if (changed.has(doc)) {
      // R2: a changed entry must clear the floor and keep its mean within MEAN_DROP of the previous record.
      const previous = baseEntries[entry.carriedFrom || groupOf(doc) || doc];
      const mean = meanOf(entry.scores);
      const before = isPlain(previous?.scores) && Object.values(previous.scores).some(Number.isFinite) ? meanOf(previous.scores) : NaN;
      if (Math.round((before - mean) * 100) > Math.round(MEAN_DROP * 100)) {
        fails = true;
        result.status = 'drop';
        result.reasons = [`mean ${mean} is more than ${MEAN_DROP} below the previous ${before}`];
      }
    } else if (result.status === 'stale' && !belowFloor(entry.scores).length) {
      // R3: a passing page made stale warns for STALE_DAYS, then fails until re-scored.
      const since = staleSince(root, doc, groupOf(doc) ? entry.pages[doc] : entry.hash, now);
      const until = new Date(since.getTime() + STALE_DAYS * 24 * 60 * 60 * 1000);
      result.reasons.push(`stale since ${since.toISOString().slice(0, 10)}, fails from ${until.toISOString().slice(0, 10)}`);
      fails = now >= until;
    } else {
      fails = false;
    }
    if (fails) failing.push(result);
    else if (result.status !== 'ok') warning.push(result);
  }
  const lines = results.map(({ doc, status, reasons }) =>
    `${doc}: ${status}` + (reasons.length ? ` (${reasons.join('; ')})` : ''));
  if (baseNote) lines.push(`::warning::${baseNote}`);
  // Shape errors fail on any date; integrity repeats a changed entry's shape error, so that one prints once, as a shape error.
  lines.push(...integrity.errors.filter((error) => !shape.some((bad) => bad.error === error)).map((error) => `::${enforced ? 'error' : 'warning'}::page-scores.json: ${error}`));
  lines.push(...shape.map(({ error }) => `::error::page-scores.json: ${error}`));
  if (warning.length) {
    lines.push(`::warning::${warning.length} page(s) not blocking yet (unscored, below the floor, or stale under ${STALE_DAYS} days): ${warning.map(({ doc }) => doc).join(', ')}. Climb them when you can.`);
  }
  let exitCode = shape.length || (integrity.errors.length && enforced) ? 1 : 0;
  if (!docs.length) lines.push('No 2.x docs changed.');
  const gateEdits = changedFiles.filter(isGateFile);
  const ex = failing.length || gateEdits.length ? checkException({ event, exceptionEvents, now, issueLookup }) : null;
  if (ex && !ex.granted && event?.pull_request?.labels?.some((label) => label.name === EXCEPTION_LABEL)) lines.push('::notice::' + ex.reason);
  if (failing.length) {
    if (ex.granted) {
      lines.push(`::warning::score-exception granted; waived: ${failing.map(({ doc }) => doc).join(', ')}. Re-score them within 24 h.`);
    } else {
      if (now.toISOString().slice(0, 10) < ENFORCE_FROM) {
        lines.push(`::warning::${failing.length} page(s) need a score (warn mode until ${ENFORCE_FROM}).`);
      } else {
        lines.push(`::error::${failing.length} page(s) need a score.`);
        exitCode = 1;
      }
      if (failing.some(({ doc }) => !groupOf(doc))) {
        lines.push('Climb each page with the docs climb kit, then: node scripts/record-page-score.js --doc <doc> --gate <gate.json> --climb <folder> --run <judge run dir>');
      }
      for (const group of new Set(failing.map(({ doc }) => groupOf(doc)).filter(Boolean))) {
        lines.push(`For ${group} pages, record the template score: node scripts/record-page-score.js --group ${group} --gate <gate.json> --climb <folder> --run <judge run dir> --sample <10 judged pages, comma-separated>`);
      }
    }
  }
  if (gateEdits.length) {
    lines.push(ex.granted ? `::warning::score-exception granted; gate edits waived: ${gateEdits.join(', ')}.`
      : `::${enforced ? 'error' : 'warning'}::this PR edits the score gate (${gateEdits.join(', ')}); it needs the score-exception label from kilbot.`);
    if (!ex.granted && enforced) exitCode = 1;
  }
  const values = Object.values(entries);
  if (values.length) {
    const share = values.filter((value) => belowFloor(value?.scores).length === 0).length / values.length;
    if (share >= RATCHET_SHARE && MEAN_FLOOR < 8.5) {
      lines.push(`::notice::${Math.round(share * 100)}% of scored pages pass the floor: raise it to 8.5 (ruling 2026-11-12).`);
    }
  }
  return { exitCode, lines };
}

// Without rename detection a moved file lists its old path too, so a renamed-away transcript or gate file is seen.
function changedFilesOf(root, baseRef) {
  return execFileSync('git', ['diff', '--name-only', '--no-renames', '--diff-filter=ACMRD', `${baseRef}...HEAD`],
    { cwd: root, encoding: 'utf8' }).split('\n').map((line) => line.trim()).filter(Boolean);
}

// A shallow clone or a missing merge base fails on any date.
function mergeBase(root, baseRef) {
  if (execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: root, encoding: 'utf8' }).trim() === 'true') {
    return { failure: '::error::page-scores needs the full git history; this clone is shallow (check out with fetch-depth: 0).' };
  }
  try { return { base: execFileSync('git', ['merge-base', baseRef, 'HEAD'], { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim() }; } catch {
    return { failure: `::error::cannot find a merge base for ${baseRef} and HEAD.` };
  }
}

if (require.main === module) {
  const root = process.cwd();
  const args = process.argv.slice(2);
  const nowIndex = args.indexOf('--now');
  const now = nowIndex === -1 ? new Date() : new Date(args[nowIndex + 1]);
  const baseRef = process.env.BASE_REF || 'origin/main';
  const { base, failure } = mergeBase(root, baseRef);
  const changedFiles = failure ? [] : changedFilesOf(root, baseRef);
  const eventFile = process.env.GITHUB_EVENT_PATH;
  const event = eventFile && fs.existsSync(eventFile) ? JSON.parse(fs.readFileSync(eventFile, 'utf8')) : null;
  const exceptionEvents = event?.pull_request?.labels?.some((label) => label.name === EXCEPTION_LABEL)
    ? exceptionEventsFromApi(process.env.GITHUB_REPOSITORY || 'wcpos/docs', event.pull_request.number) : [];
  const issueLookup = (n) => {
    try {
      return JSON.parse(execFileSync('gh', ['api', `repos/wcpos/docs/issues/${n}`, '--jq', '{state: .state, pr: (.pull_request != null)}'],
        { encoding: 'utf8', stdio: 'pipe' }));
    } catch { return null; }
  };
  const result = failure ? { exitCode: 1, lines: [failure] } : run({ root, changedFiles, event, exceptionEvents, now, base, issueLookup });
  for (const line of result.lines) console.log(line);
  process.exitCode = result.exitCode;
}

module.exports = {
  allDocs, affectedDocs, baseScores, checkIntegrity, checkException, staleSince, run, entryProblem, exceptionEventsFromApi, judgeRunProblem,
  changedFilesOf, isGateFile, ENFORCE_FROM, MEAN_DROP, STALE_DAYS, TRANSLATION_TOOLING, TRANSLATION_PREFIXES, HASH_DEFINITION,
};
