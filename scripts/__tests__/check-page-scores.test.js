/* global describe, it, expect, beforeEach, afterEach */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const {
  VDOCS, pageHash, saveScores, loadScores, resolveCommit, meanOf, REQUIRED_CATEGORIES,
} = require('../lib/page-scores');
const { recordFromGate, recordGroup, carry } = require('../record-page-score');
const {
  allDocs, affectedDocs, baseScores, checkIntegrity, checkException, staleSince, run, ENFORCE_FROM,
  GATE_FILES, exceptionEventsFromApi,
} = require('../check-page-scores');

const fixtures = path.join(__dirname, 'fixtures/page-scores');
const script = path.join(__dirname, '../check-page-scores.js');
const now = new Date('2026-11-16T00:00:00Z');
const recent = '2026-11-15T22:00:00Z';
const body = 'x\n## Score exception\nFixes a fact. Tracking: #123\n## Other';
let root;
let options;
// Every required category at `value`, with overrides.
const seven = (value, overrides = {}) => ({
  ...Object.fromEntries(REQUIRED_CATEGORIES.map((key) => [key, value])), ...overrides,
});
const PASS = seven(8.5, { 'task clarity': 8 });
const gate = { round: 2, state: 'keep', scores: { a: PASS } };
const recording = { doc: 'a/page', gate, climb: 'a__page', commit: 'HEAD' };
const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
function commitFixture(message, date, add = true) {
  if (add) git('add', '-A');
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t.invalid', 'commit', '-qm', message],
    { cwd: root, stdio: 'pipe', env: date ? { ...process.env, GIT_COMMITTER_DATE: date } : process.env });
  return resolveCommit(root, 'HEAD');
}
function initRepo() {
  git('init', '-q');
  return commitFixture('base');
}
// A base without these sources, which stay on disk: they are new pages (R1).
function baseWithout(...docs) {
  git('init', '-q');
  git('add', '-A');
  git('rm', '-q', '--cached', ...docs.map((doc) => `${VDOCS}/${doc}.mdx`));
  return commitFixture('base without new pages', undefined, false);
}
const newPagesBase = () => { options.base = baseWithout('a/page', 'error-codes/E1', 'error-codes/E2'); };

beforeEach(() => {
  root = fs.mkdtempSync(path.join(fixtures, 'tmp-'));
  fs.cpSync(path.join(fixtures, 'repo'), root, { recursive: true });
  options = { root, changedFiles: [`${VDOCS}/a/page.mdx`], event: null, exceptionEvents: [], now };
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe('affected docs', () => {
  it('selects a doc referencing a printer wizard image', () => {
    fs.appendFileSync(path.join(root, VDOCS, 'a/page.mdx'), '\n![printer](/img/printer-wizard/x.png)');
    expect(affectedDocs(root, ['static/img/printer-wizard/x.png'])).toEqual(['a/page']);
  });

  it.each(['static/img/2.x/a/shot.png', `${VDOCS}/a/_part.mdx`])(
    'selects dependent docs when %s is deleted', (file) => {
      fs.unlinkSync(path.join(root, file));
      expect(affectedDocs(root, [file])).toEqual(['a/page']);
    }
  );

  it.each([
    [`${VDOCS}/a/page.mdx`, ['a/page']],
    ['static/img/2.x/a/shot.png', ['a/page']],
    [`${VDOCS}/a/_part.mdx`, ['a/page']],
    ['static/img/2.x/b/other.png', []],
    ['i18n/de/x.mdx', []],
    ['versioned_docs/version-1.x/a/page.mdx', []],
    ['docs/a/page.mdx', []],
  ])('maps %s to its dependent docs', (file, docs) => {
    expect(affectedDocs(root, [file])).toEqual(docs);
  });

  it('sorts doc keys, includes md, and skips partial files and directories', () => {
    fs.mkdirSync(path.join(root, VDOCS, '_hidden'));
    fs.writeFileSync(path.join(root, VDOCS, '_hidden/page.mdx'), '# Hidden');
    fs.writeFileSync(path.join(root, VDOCS, 'z.md'), '# Markdown');
    fs.writeFileSync(path.join(root, VDOCS, 'a/page.md'), '# Duplicate');
    expect(allDocs(root)).toEqual(['a/page', 'error-codes/E1', 'error-codes/E2', 'z']);
    expect(affectedDocs(root, [`${VDOCS}/error-codes/E2.mdx`, `${VDOCS}/a/page.mdx`,
      'static/img/2.x/a/shot.png'])).toEqual(['a/page', 'error-codes/E2']);
  });

  it('ignores inputs outside the allowed trees even when imported by a doc', () => {
    fs.writeFileSync(path.join(root, 'outside.mdx'), '# Outside');
    fs.appendFileSync(path.join(root, VDOCS, 'a/page.mdx'), "\nimport Outside from './../../../outside.mdx'");
    expect(affectedDocs(root, ['outside.mdx'])).toEqual([]);
  });
});

describe('score check', () => {
  beforeEach(newPagesBase);
  it('reports no affected docs', () => {
    expect(run({ ...options, changedFiles: [] })).toEqual({ exitCode: 0, lines: ['No 2.x docs changed.'] });
  });

  it('enforces missing scores at the UTC cutoff and warns before it', () => {
    expect(ENFORCE_FROM).toBe('2026-11-16');
    const enforced = run(options);
    expect(enforced.exitCode).toBe(1);
    expect(enforced.lines).toEqual([
      'a/page: missing', '::error::1 page(s) need a score.',
      'Climb each page with the docs climb kit, then: node scripts/record-page-score.js --doc <doc> --gate <gate.json> --climb <folder>',
    ]);
    const warning = run({ ...options, now: new Date('2026-11-15T23:59:00Z') });
    expect(warning.exitCode).toBe(0);
    expect(warning.lines).toContain('::warning::1 page(s) need a score (warn mode until 2026-11-16).');
    expect(warning.lines.at(-1)).toBe(enforced.lines.at(-1));
  });

  it.each([
    ['ok', { x: 8 }, 0, 'a/page: ok'],
    ['below', { x: 6 }, 1, 'a/page: below (mean 6 < 8.0; x 6 < 7.0)'],
    ['below', {}, 1, 'a/page: below (no scores)'],
    ['stale', { x: 8 }, 1, 'a/page: stale'],
  ])('reports %s scores', (status, scores, exitCode, line) => {
    saveScores(root, { 'a/page': { hash: pageHash(root, 'a/page'), scores } });
    if (status === 'stale') fs.appendFileSync(path.join(root, 'static/img/2.x/a/shot.png'), 'changed');
    const result = run(options);
    expect(result.exitCode).toBe(exitCode);
    expect(result.lines[0]).toBe(line);
  });

  it('gives only the template hint for a failing grouped page', () => {
    const result = run({ ...options, changedFiles: [`${VDOCS}/error-codes/E1.mdx`] });
    expect(result.exitCode).toBe(1);
    expect(result.lines).toEqual([
      'error-codes/E1: missing', '::error::1 page(s) need a score.',
      'For error-codes pages, record the template score: node scripts/record-page-score.js --group error-codes --gate <gate.json> --climb <folder> --sample <10 judged pages, comma-separated>',
    ]);
  });

  it('gives both hints once for mixed failing docs', () => {
    const result = run({ ...options, changedFiles: [
      `${VDOCS}/a/page.mdx`, `${VDOCS}/error-codes/E1.mdx`, `${VDOCS}/error-codes/E2.mdx`,
    ] });
    expect(result.lines.filter((line) => line.includes(' --doc '))).toHaveLength(1);
    expect(result.lines.filter((line) => line.includes(' --group error-codes '))).toHaveLength(1);
  });
});

describe('score exceptions', () => {
  beforeEach(newPagesBase);
  beforeEach(() => {
    options.event = { pull_request: { labels: [{ name: 'score-exception' }], body } };
    options.exceptionEvents = [{ actor: 'kilbot', at: recent }];
    options.issueLookup = () => ({ state: 'open', pr: false });
  });

  it('waives failing docs for a recent front-desk exception', () => {
    const result = run(options);
    expect(result.exitCode).toBe(0);
    expect(result.lines).toEqual([
      'a/page: missing', '::warning::score-exception granted; waived: a/page. Re-score them within 24 h.',
    ]);
    expect(checkException(options).granted).toBe(true);
  });

  it('requires the label before checking any other rule', () => {
    options.event = null;
    options.exceptionEvents = [];
    expect(checkException(options)).toEqual({ granted: false, reason: 'label absent' });
    expect(run(options).exitCode).toBe(1);
    expect(run(options).lines.some((line) => line.startsWith('::notice::'))).toBe(false);
  });

  it.each([
    [[{ actor: 'someone', at: recent }], body, 'label not applied by kilbot'],
    [[], body, 'label not applied by kilbot'],
    [[{ actor: 'kilbot', at: '2026-11-14T23:00:00Z' }], body,
      'exception expired (applied 2026-11-14T23:00:00Z)'],
    [[{ actor: 'kilbot', at: recent }], 'Tracking: #123',
      'no ## Score exception section with a tracking issue'],
    [[{ actor: 'kilbot', at: recent }], '## Score exception\nFix needed\n## Other\n#123',
      'no ## Score exception section with a tracking issue'],
    [[{ actor: 'kilbot', at: recent }, { actor: 'someone', at: '2026-11-15T23:00:00Z' }], body,
      'label not applied by kilbot'],
  ])('refuses events %j and body %s', (exceptionEvents, text, reason) => {
    options.exceptionEvents = exceptionEvents;
    options.event.pull_request.body = text;
    expect(checkException(options)).toEqual({ granted: false, reason });
    const result = run(options);
    expect(result.exitCode).toBe(1);
    expect(result.lines).toContain('::notice::' + reason);
  });

  it.each(['#123', 'wcpos/docs#123', 'https://github.com/wcpos/docs/issues/123'])(
    'accepts %s at the end of the body and exactly 24 hours', (issue) => {
      options.event.pull_request.body = '## Score exception\r\nTracking: ' + issue;
      options.exceptionEvents = [{ actor: 'kilbot', at: '2026-11-15T00:00:00Z' }];
      expect(checkException(options).granted).toBe(true);
    });
});

describe('exception tracking issues', () => {
  beforeEach(newPagesBase);
  beforeEach(() => {
    options.event = { pull_request: { labels: [{ name: 'score-exception' }], body } };
    options.exceptionEvents = [{ actor: 'kilbot', at: recent }];
  });
  it.each(['wcpos/monorepo#5', 'foo#5', 'https://github.com/wcpos/docs/pull/5',
    '_#5', '/#5', '.#5', '-#5'])('rejects %s as a tracking issue', (issue) => {
    options.event.pull_request.body = '## Score exception\nSee ' + issue;
    options.issueLookup = () => ({ state: 'open', pr: false });
    expect(checkException(options)).toEqual({
      granted: false, reason: 'no ## Score exception section with a tracking issue',
    });
  });
  it.each([{ state: 'closed', pr: false }, { state: 'open', pr: true }, null, undefined])(
    'refuses a non-open issue or absent lookup: %j', (issue) => {
      if (issue !== undefined) options.issueLookup = () => issue;
      expect(checkException(options)).toEqual({
        granted: false, reason: 'tracking issue #123 is not an open wcpos/docs issue',
      });
      expect(run(options).exitCode).toBe(1);
    });
  it('looks up references in order and grants when a later issue is open', () => {
    const lookedUp = [];
    options.event.pull_request.body = '## Score exception\n#7 and #123';
    options.issueLookup = (n) => { lookedUp.push(n); return { state: n === 123 ? 'open' : 'closed', pr: false }; };
    expect(checkException(options).granted).toBe(true);
    expect(lookedUp).toEqual([7, 123]);
  });
});

describe('malformed scores', () => {
  it.each([
    ['2026-11-15T12:00:00Z', [`${VDOCS}/a/page.mdx`], 0],
    ['2026-11-15T12:00:00Z', ['page-scores.json'], 0],
    [now, [`${VDOCS}/a/page.mdx`], 0],
    [now, ['page-scores.json'], 1],
  ])('handles malformed scores at %s with changed %j', (date, changedFiles, exitCode) => {
    fs.writeFileSync(path.join(root, 'page-scores.json'), '{');
    const result = run({ ...options, now: new Date(date), changedFiles });
    expect(result.exitCode).toBe(exitCode);
    expect(result.lines[0]).toMatch(/^::warning::page-scores.json is malformed: .+/);
    expect(result.lines.slice(1)).toEqual(exitCode ? ['::error::page-scores.json is malformed; fix it in this PR.'] : []);
  });
  it.each(['missing', 'undefined'])('returns empty base scores for %s', (kind) => {
    const base = initRepo();
    expect(baseScores(root, kind === 'undefined' ? undefined : base)).toEqual({});
  });
  it.each([['{', /^::error::page-scores.json on the base is unreadable: .+/], ['[]', 'not an object']])(
    'fails on any date when the base file is %s', (text, message) => {
      fs.writeFileSync(path.join(root, 'page-scores.json'), text);
      options.base = initRepo();
      saveScores(root, {});
      for (const date of [now, new Date('2026-11-01T00:00:00Z')]) {
        const result = run({ ...options, now: date });
        expect(result.exitCode).toBe(1);
        expect(result.lines).toHaveLength(1);
        expect(result.lines[0]).toMatch(typeof message === 'string'
          ? `::error::page-scores.json on the base is unreadable: ${message}` : message);
      }
    });
  it.each(['null', '[]', '5'])('treats a top-level %s like a syntax error', (text) => {
    fs.writeFileSync(path.join(root, 'page-scores.json'), text);
    const result = run({ ...options, changedFiles: ['page-scores.json'] });
    expect(result).toEqual({ exitCode: 1, lines: [
      '::warning::page-scores.json is malformed: not an object', '::error::page-scores.json is malformed; fix it in this PR.',
    ] });
  });
});

describe('malformed entries', () => {
  beforeEach(() => {
    options.base = initRepo();
    options.changedFiles = ['page-scores.json', `${VDOCS}/a/page.mdx`];
  });
  // Each case keeps the stored mean consistent wherever meanOf is finite, so only the named check can fire.
  const withMean = (entry) => (Number.isFinite(meanOf(entry.scores)) ? { ...entry, mean: meanOf(entry.scores) } : entry);
  it.each([
    ['a string score', (entry) => withMean({ ...entry, scores: { ...entry.scores, 'task clarity': 'x' } }),
      'score task clarity is not a number from 0 to 10'],
    ['a null entry', () => null, 'not an object'],
    ['a missing category', (entry) => { delete entry.scores.accuracy; return withMean(entry); }, 'no accuracy score'],
    ['a score of 11', (entry) => withMean({ ...entry, scores: { ...entry.scores, language: 11 } }),
      'score language is not a number from 0 to 10'],
    ['an array entry', () => [], 'not an object'],
  ])('fails cleanly on %s', (name, mutate, problem) => {
    const entry = recordFromGate({ root, ...recording });
    saveScores(root, { 'a/page': mutate(entry) });
    let result;
    expect(() => { result = run(options); }).not.toThrow();
    expect(result.exitCode).toBe(1);
    expect(result.lines).toContain(`::error::page-scores.json: a/page: malformed entry (${problem})`);
    expect(result.lines[0]).toBe('a/page: missing');
  });
  it('rejects a stored mean that differs from the scores', () => {
    const entry = recordFromGate({ root, ...recording, gate: { ...gate, scores: { a: seven(8) } } });
    saveScores(root, { 'a/page': { ...entry, mean: 8.36 } });
    const result = run(options);
    expect(result.exitCode).toBe(1);
    expect(result.lines).toContain('::error::page-scores.json: a/page: malformed entry (stored mean 8.36 differs from its category scores (8))');
  });
  it('survives null entries on the base and in the current file', () => {
    saveScores(root, { 'a/page': null });
    options.base = commitFixture('null base entry');
    saveScores(root, { z: null });
    let result;
    expect(() => { result = run(options); }).not.toThrow();
    expect(result.lines.filter((line) => line.startsWith('::error::page-scores.json'))).toEqual([
      '::error::page-scores.json: a/page: entry removed while its page exists',
      '::error::page-scores.json: z: malformed entry (not an object)',
    ]);
  });
});

describe('score integrity', () => {
  beforeEach(() => {
    options.base = initRepo();
    options.changedFiles = ['page-scores.json'];
  });
  it.each([true, false])('evaluates a recorded change, with changed doc listed: %s', (withDoc) => {
    fs.appendFileSync(path.join(root, VDOCS, 'a/page.mdx'), '\nEdited');
    commitFixture('edit page');
    recordFromGate({ root, ...recording });
    if (withDoc) options.changedFiles.push(`${VDOCS}/a/page.mdx`);
    const result = run(options);
    expect(result.exitCode).toBe(0);
    expect(result.lines.filter((line) => line === 'a/page: ok')).toHaveLength(1);
    expect(result.lines).not.toContain('No 2.x docs changed.');
    expect(result.lines.some((line) => line.startsWith('::error::page-scores.json'))).toBe(false);
  });
  it.each(['no commit', 'no climb', 'unknown commit', 'side branch', 'disk hash'])(
    'rejects forgery: %s', (kind) => {
      const entry = { climb: 'a__page', round: 2, commit: options.base, hash: pageHash(root, 'a/page'), scores: seven(8), mean: 8 };
      let reason;
      if (kind === 'no commit') { delete entry.commit; reason = 'no judged commit'; }
      if (kind === 'no climb') { delete entry.climb; reason = 'no climb round'; }
      if (kind === 'unknown commit') entry.commit = '0'.repeat(40);
      if (kind === 'side branch') {
        git('checkout', '-qb', 'side');
        fs.appendFileSync(path.join(root, VDOCS, 'a/page.mdx'), '\nSide branch');
        entry.commit = commitFixture('side');
        git('checkout', '--detach', options.base);
      }
      if (kind === 'unknown commit' || kind === 'side branch') reason = `judged commit ${entry.commit} is not in this branch's history`;
      if (kind === 'disk hash') {
        fs.appendFileSync(path.join(root, VDOCS, 'a/page.mdx'), '\nUncommitted');
        entry.hash = pageHash(root, 'a/page');
        reason = 'hash does not match the judged commit';
      }
      saveScores(root, { 'a/page': entry });
      const result = run(options);
      expect(result.exitCode).toBe(1);
      expect(result.lines.filter((line) => line.startsWith('::error::page-scores.json')))
        .toEqual([`::error::page-scores.json: a/page: ${reason}`]);
    });
  it.each(['warn', 'exception'])('integrity obeys the enforcement date but no exception (%s)', (mode) => {
    saveScores(root, { 'a/page': { climb: 'a__page', round: 2, hash: pageHash(root, 'a/page'), scores: seven(6), mean: 6 } });
    if (mode === 'warn') options.now = new Date('2026-11-15T12:00:00Z');
    else {
      options.event = { pull_request: { labels: [{ name: 'score-exception' }], body } };
      options.exceptionEvents = [{ actor: 'kilbot', at: recent }];
      options.issueLookup = () => ({ state: 'open', pr: false });
    }
    const result = run(options);
    expect(result.exitCode).toBe(mode === 'warn' ? 0 : 1);
    expect(result.lines).toContain(`::${mode === 'warn' ? 'warning' : 'error'}::page-scores.json: a/page: no judged commit`);
    expect(result.lines.some((line) => line.startsWith(mode === 'warn'
      ? '::warning::1 page(s)' : '::warning::score-exception granted'))).toBe(true);
  });
  it('grandfathers unchanged seeded entries and ignores nested object key order', () => {
    const entry = { seeded: true, hash: pageHash(root, 'a/page'), scores: { x: 8, y: 9 } };
    saveScores(root, { 'a/page': entry });
    options.base = commitFixture('seed');
    expect(baseScores(root, options.base)).toEqual({ 'a/page': entry });
    expect(checkIntegrity({ ...options, entries: loadScores(root) })).toEqual({ errors: [], docs: [], invalid: [] });
    saveScores(root, { 'a/page': { scores: { y: 9, x: 8 }, hash: entry.hash, seeded: true } });
    expect(checkIntegrity({ ...options, entries: loadScores(root) })).toEqual({ errors: [], docs: [], invalid: [] });
    expect(run(options).exitCode).toBe(0);
  });
  it.each([false, true])('allows entry removal only when the source is deleted: %s', (deleted) => {
    recordFromGate({ root, ...recording });
    options.base = commitFixture('score');
    if (deleted) fs.unlinkSync(path.join(root, VDOCS, 'a/page.mdx'));
    saveScores(root, {});
    expect(checkIntegrity({ ...options, entries: {} })).toEqual({
      errors: deleted ? [] : ['a/page: entry removed while its page exists'], docs: [], invalid: [],
    });
    expect(run(options).exitCode).toBe(deleted ? 0 : 1);
  });
  it('allows only the group prune shape without rechecking provenance', () => {
    const entry = recordGroup({ root, ...recording, group: 'error-codes', sample: ['error-codes/E1'] });
    delete entry.commit;
    saveScores(root, { 'error-codes': entry });
    options.base = commitFixture('seed group');
    fs.unlinkSync(path.join(root, VDOCS, 'error-codes/E2.mdx'));
    delete entry.pages['error-codes/E2'];
    expect(checkIntegrity({ ...options, entries: { 'error-codes': entry } })).toEqual({ errors: [], docs: [], invalid: [] });
    entry.round = 3;
    expect(checkIntegrity({ ...options, entries: { 'error-codes': entry } }).errors)
      .toEqual(['error-codes: no judged commit']);
  });
  it('rejects removing a still-existing page from a group entry', () => {
    const entry = recordGroup({ root, ...recording, group: 'error-codes', sample: ['error-codes/E1'] });
    options.base = commitFixture('score group');
    delete entry.pages['error-codes/E2'];
    saveScores(root, { 'error-codes': entry });
    expect(checkIntegrity({ ...options, entries: loadScores(root) }).errors)
      .toEqual(['error-codes: error-codes/E2 removed from the group while its page exists']);
    expect(run(options).exitCode).toBe(1);
  });
  it('checks group hashes in sorted order and evaluates every changed group page', () => {
    const entry = recordGroup({ root, ...recording, group: 'error-codes', sample: ['error-codes/E1'] });
    expect(run(options).lines.slice(0, 2)).toEqual(['error-codes/E1: ok', 'error-codes/E2: ok']);
    const bad = 'sha256:' + '0'.repeat(64);
    entry.pages = { 'error-codes/E2': bad, 'error-codes/E1': bad };
    expect(checkIntegrity({ ...options, entries: { 'error-codes': entry } })).toEqual({
      errors: ['error-codes: error-codes/E1 hash does not match the judged commit'],
      docs: ['error-codes/E2', 'error-codes/E1'], invalid: [],
    });
    entry.pages['error-codes/E1'] = 'bad';
    expect(checkIntegrity({ ...options, entries: { 'error-codes': entry } }))
      .toEqual({ errors: ['error-codes: malformed entry (bad group pages)'], docs: [], invalid: ['error-codes'] });
  });
  it('rejects a carry from an entry already stale on the base', () => {
    recordFromGate({ root, ...recording });
    fs.appendFileSync(path.join(root, VDOCS, 'a/page.mdx'), '\nEdited after scoring');
    options.base = commitFixture('stale on base');
    git('mv', `${VDOCS}/a/page.mdx`, `${VDOCS}/a/renamed.mdx`);
    commitFixture('rename');
    carry({ root, carry: 'a/page', doc: 'a/renamed', commit: 'HEAD' });
    const result = run(options);
    expect(result.exitCode).toBe(1);
    expect(result.lines.filter((line) => line.startsWith('::error::page-scores.json')))
      .toEqual(['::error::page-scores.json: a/renamed: carried from a/page but that entry was already stale on the base']);
  });
  it.each(['valid', 'scores', 'source', 'missing base', 'old present'])(
    'checks carried entries: %s', (kind) => {
      const old = recordFromGate({ root, ...recording });
      options.base = commitFixture('score before rename');
      git('mv', `${VDOCS}/a/page.mdx`, `${VDOCS}/a/renamed.mdx`);
      if (kind === 'source') fs.appendFileSync(path.join(root, VDOCS, 'a/renamed.mdx'), '\nEdited');
      commitFixture('rename');
      const entry = carry({ root, carry: 'a/page', doc: 'a/renamed', commit: 'HEAD' });
      const entries = loadScores(root);
      if (kind === 'scores') { entry.scores.accuracy = 9; entry.mean = meanOf(entry.scores); }
      if (kind === 'missing base') entry.carriedFrom = 'nope';
      if (kind === 'old present') entries['a/page'] = old;
      entries['a/renamed'] = entry;
      saveScores(root, entries);
      const reasons = { scores: 'its scores differ', source: 'the page source changed',
        'missing base': 'that entry is not on the base', 'old present': 'the old entry is still present' };
      const result = run(options);
      expect(result.exitCode).toBe(kind === 'valid' ? 0 : 1);
      expect(result.lines).toContain('a/renamed: ok');
      expect(result.lines.filter((line) => line.startsWith('::error::page-scores.json'))).toEqual(kind === 'valid'
        ? [] : [`::error::page-scores.json: a/renamed: carried from ${entry.carriedFrom} but ${reasons[kind]}`]);
    });
});

describe('ratchet rules', () => {
  const day = 24 * 60 * 60 * 1000;
  const ago = (days) => new Date(now - days * day).toISOString();
  const pageFile = () => path.join(root, VDOCS, 'a/page.mdx');
  const scored = (scores) => ({ ...recording, gate: { round: 2, state: 'keep', scores: { a: scores } } });
  const granted = () => {
    options.event = { pull_request: { labels: [{ name: 'score-exception' }], body } };
    options.exceptionEvents = [{ actor: 'kilbot', at: recent }];
    options.issueLookup = () => ({ state: 'open', pr: false });
  };
  const notBlocking = (docs) => `::warning::${docs.length} page(s) not blocking yet (unscored, below the floor, or stale under 7 days): ${docs.join(', ')}. Climb them when you can.`;
  // Base: a/page recorded with these scores at the base commit, page-scores.json committed.
  function recordedBase(scores) {
    initRepo();
    recordFromGate({ root, ...scored(scores) });
    options.base = commitFixture('score');
  }

  it.each(['missing', 'ok', 'below', 'waived'])('R1: a new page must clear the floor (%s)', (kind) => {
    options.base = baseWithout('a/page');
    options.changedFiles = [`${VDOCS}/a/page.mdx`];
    if (kind !== 'missing') {
      commitFixture('add page');
      recordFromGate({ root, ...scored(kind === 'ok' ? PASS : seven(6)) });
      options.changedFiles.push('page-scores.json');
    }
    if (kind === 'waived') granted();
    const result = run(options);
    expect(result.exitCode).toBe(kind === 'ok' || kind === 'waived' ? 0 : 1);
    if (kind === 'ok') expect(result.lines).toContain('a/page: ok');
    if (kind === 'waived') expect(result.lines).toContain('::warning::score-exception granted; waived: a/page. Re-score them within 24 h.');
  });

  it('R1: a page carried from an entry on the base is not new', () => {
    recordedBase(PASS);
    git('mv', `${VDOCS}/a/page.mdx`, `${VDOCS}/a/renamed.mdx`);
    commitFixture('rename');
    carry({ root, carry: 'a/page', doc: 'a/renamed', commit: 'HEAD' });
    options.changedFiles = ['page-scores.json', `${VDOCS}/a/page.mdx`, `${VDOCS}/a/renamed.mdx`];
    const result = run(options);
    expect(result.exitCode).toBe(0);
    expect(result.lines).toContain('a/renamed: ok');
  });

  it.each([
    ['mean 8.4', seven(8.4), 0, 'a/page: ok'],
    ['mean exactly 8.3', seven(8.3), 0, 'a/page: ok'],
    ['mean 8.29', seven(8.29), 1, 'a/page: drop (mean 8.29 is more than 0.3 below the previous 8.6)'],
    ['a category at 7', seven(8.6, { 'task clarity': 7 }), 0, 'a/page: ok'],
    ['a category at 6.5', seven(10, { 'task clarity': 6.5 }), 1, 'a/page: below (task clarity 6.5 < 7.0)'],
    ['mean 8.0 with an exception', seven(8), 0, 'a/page: drop (mean 8 is more than 0.3 below the previous 8.6)'],
  ])('R2: a changed entry may not drop far (%s)', (name, scores, exitCode, line) => {
    recordedBase(seven(8.6));
    recordFromGate({ root, ...scored(scores) });
    options.changedFiles = ['page-scores.json'];
    if (name.includes('exception')) granted();
    const result = run(options);
    expect(result.exitCode).toBe(exitCode);
    expect(result.lines[0]).toBe(line);
  });

  it.each(['missing', 'below'])('R3: an unchanged %s page warns', (kind) => {
    if (kind === 'below') recordedBase({ x: 6 });
    else {
      options.base = initRepo();
      fs.appendFileSync(pageFile(), '\nEdited');
      commitFixture('edit');
    }
    const result = run(options);
    expect(result.exitCode).toBe(0);
    expect(result.lines[0]).toBe(kind === 'below' ? 'a/page: below (mean 6 < 8.0; x 6 < 7.0)' : 'a/page: missing');
    expect(result.lines).toContain(notBlocking(['a/page']));
  });

  it.each([[3, 0], [8, 1], [7, 1]])('R3: a passing page edited %i days ago exits %i', (days, exitCode) => {
    recordedBase(PASS);
    fs.appendFileSync(pageFile(), '\nEdited');
    commitFixture('edit', ago(days));
    const result = run(options);
    expect(result.exitCode).toBe(exitCode);
    expect(result.lines[0]).toBe(`a/page: stale (stale since ${ago(days).slice(0, 10)}, fails from ${ago(days - 7).slice(0, 10)})`);
    expect(result.lines.includes(notBlocking(['a/page']))).toBe(exitCode === 0);
  });

  it('dates stale-since from the newest run of edits', () => {
    recordedBase(PASS);
    const recorded = fs.readFileSync(pageFile());
    fs.appendFileSync(pageFile(), '\nFirst edit');
    commitFixture('edit', ago(10));
    fs.writeFileSync(pageFile(), recorded);
    commitFixture('revert', ago(9));
    fs.appendFileSync(pageFile(), '\nSecond edit');
    commitFixture('edit again', ago(2));
    expect(staleSince(root, 'a/page', loadScores(root)['a/page'].hash, now)).toEqual(new Date(ago(2)));
    expect(run(options).exitCode).toBe(0);
  });

  it('dates an uncommitted edit from now', () => {
    recordedBase(PASS);
    fs.appendFileSync(pageFile(), '\nUncommitted');
    expect(staleSince(root, 'a/page', loadScores(root)['a/page'].hash, now)).toBe(now);
  });

  it('R2: measures the drop from scores, never the stored means', () => {
    initRepo();
    recordFromGate({ root, ...scored(seven(8.5)) });
    saveScores(root, { 'a/page': { ...loadScores(root)['a/page'], mean: 8 } });
    options.base = commitFixture('score with a hand-set mean');
    recordFromGate({ root, ...scored(seven(8.1)) });
    options.changedFiles = ['page-scores.json'];
    const result = run(options);
    expect(result.exitCode).toBe(1);
    expect(result.lines[0]).toBe('a/page: drop (mean 8.1 is more than 0.3 below the previous 8.5)');
  });

  it('walks past 50 edits to the matching commit', () => {
    recordedBase(PASS);
    const first = new Date(now - 60 * day);
    for (let i = 0; i < 52; i++) {
      fs.appendFileSync(pageFile(), `\nEdit ${i}`);
      commitFixture(`edit ${i}`, new Date(first.getTime() + i * 60 * 1000).toISOString());
    }
    expect(staleSince(root, 'a/page', loadScores(root)['a/page'].hash, now)).toEqual(first);
  }, 120000);

  it.each([true, false])('dates a hash no commit matches from the hash definition change (committed: %s)', (committed) => {
    options.base = initRepo();
    if (committed) {
      fs.mkdirSync(path.join(root, 'scripts/lib'), { recursive: true });
      fs.writeFileSync(path.join(root, 'scripts/lib/page-scores.js'), '// hash definition\n');
      commitFixture('hash definition', ago(20));
    }
    fs.appendFileSync(pageFile(), '\nEdited');
    commitFixture('edit', ago(3));
    const since = staleSince(root, 'a/page', 'sha256:' + '0'.repeat(64), now);
    expect(since).toEqual(committed ? new Date(ago(20)) : now);
  });

  it('R3: a below-floor page made stale warns however old the edit', () => {
    recordedBase({ x: 6 });
    fs.appendFileSync(pageFile(), '\nEdited');
    commitFixture('edit', ago(30));
    const result = run(options);
    expect(result.exitCode).toBe(0);
    expect(result.lines).toEqual(['a/page: stale', notBlocking(['a/page'])]);
  });
});

describe('ratchet and workflow', () => {
  it('provides the GitHub token to the Check page scores step', () => {
    const workflow = fs.readFileSync(path.join(__dirname, '../../.github/workflows/page-scores.yml'), 'utf8');
    const step = workflow.split('- name: Check page scores\n')[1].split(/\n\s*- name:/)[0];
    expect(step).toMatch(/env:\n(?:[^\n]*\n)*?\s+GH_TOKEN: \$\{\{ github.token \}\}/);
  });
  it.each([9, 8])('checks the ratchet with %i of ten entries passing, even with no changed docs', (passing) => {
    const hash = pageHash(root, 'a/page');
    saveScores(root, Object.fromEntries(Array.from({ length: 10 }, (_, i) =>
      [`page-${i}`, { hash, scores: { x: i < passing ? 8 : 6 } }])));
    const result = run({ ...options, changedFiles: [] });
    expect(result.exitCode).toBe(0);
    expect(result.lines.includes('::notice::90% of scored pages pass the floor: raise it to 8.5 (ruling 2026-11-12).'))
      .toBe(passing === 9);
    if (passing === 8) expect(result.lines).toEqual(['No 2.x docs changed.']);
  });

  it('reads no label events file, has no paths filter and keeps PR text out of run and env', () => {
    const workflow = fs.readFileSync(path.join(__dirname, '../../.github/workflows/page-scores.yml'), 'utf8');
    expect(workflow).not.toContain('SCORE_EXCEPTION_EVENT');
    expect(workflow).not.toContain('Read score-exception label events');
    expect(workflow).not.toMatch(/^\s*paths:/m);
    for (const line of workflow.split('\n').filter((line) => /run:|env:/.test(line))) {
      expect(line).not.toMatch(/pull_request\.(body|title)/);
    }
    expect(workflow).not.toMatch(/pull_request\.(body|title)/);
  });
});

describe('gate edits', () => {
  const grant = { event: { pull_request: { labels: [{ name: 'score-exception' }], body } },
    exceptionEvents: [{ actor: 'kilbot', at: recent }], issueLookup: () => ({ state: 'open', pr: false }) };
  it.each(GATE_FILES)('needs the kilbot exception to edit %s', (file) => {
    options.changedFiles = [file];
    const text = `this PR edits the score gate (${file}); it needs the score-exception label from kilbot.`;
    const enforced = run(options);
    expect(enforced.exitCode).toBe(1);
    expect(enforced.lines).toContain(`::error::${text}`);
    const before = run({ ...options, now: new Date('2026-11-15T00:00:00Z') });
    expect(before.exitCode).toBe(0);
    expect(before.lines).toContain(`::warning::${text}`);
    const granted = run({ ...options, ...grant });
    expect(granted.exitCode).toBe(0);
    expect(granted.lines).toContain(`::warning::score-exception granted; gate edits waived: ${file}.`);
  });
  it('gives the refusal notice once for failing docs and gate edits together', () => {
    options.base = baseWithout('a/page');
    options.changedFiles = [`${VDOCS}/a/page.mdx`, ...GATE_FILES];
    const result = run({ ...options, ...grant, exceptionEvents: [{ actor: 'someone', at: recent }] });
    expect(result.exitCode).toBe(1);
    expect(result.lines.filter((line) => line.startsWith('::notice::'))).toEqual(['::notice::label not applied by kilbot']);
    expect(result.lines).toContain(`::error::this PR edits the score gate (${GATE_FILES.join(', ')}); it needs the score-exception label from kilbot.`);
  });
  it('reads label events from the API, paginated, and returns [] on any failure', () => {
    const calls = [];
    const exec = (...args) => { calls.push(args); return '{"actor":"kilbot","at":"a"}\n{"actor":"x","at":"b"}\n'; };
    expect(exceptionEventsFromApi('wcpos/docs', 7, exec)).toEqual([{ actor: 'kilbot', at: 'a' }, { actor: 'x', at: 'b' }]);
    expect(calls).toEqual([['gh', ['api', 'repos/wcpos/docs/issues/7/events', '--paginate', '--jq',
      '.[] | select(.event == "labeled" and .label.name == "score-exception") | {actor: .actor.login, at: .created_at}'],
    { encoding: 'utf8', stdio: 'pipe' }]]);
    expect(exceptionEventsFromApi('wcpos/docs', 7, () => { throw new Error('gh failed'); })).toEqual([]);
    expect(exceptionEventsFromApi('wcpos/docs', 7, () => 'not json')).toEqual([]);
  });
});

describe('command line', () => {
  const temps = [];
  const tempDir = (prefix) => { const dir = fs.mkdtempSync(path.join(fixtures, prefix)); temps.push(dir); return dir; };
  afterEach(() => { for (const dir of temps.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });
  const cli = (cwd, env) => spawnSync(process.execPath, [script, '--now', '2026-11-16T00:00:00Z'],
    { cwd, encoding: 'utf8', env: { ...process.env, GITHUB_EVENT_PATH: '', SCORE_EXCEPTION_EVENT: '', ...env } });

  it('ignores a SCORE_EXCEPTION_EVENT file: label events come from the API only', () => {
    const base = baseWithout('a/page');
    commitFixture('add page');
    const bin = tempDir('bin-');
    fs.writeFileSync(path.join(bin, 'gh'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    const eventPath = path.join(bin, 'event.json');
    fs.writeFileSync(eventPath, JSON.stringify({ pull_request: { number: 1, labels: [{ name: 'score-exception' }], body } }));
    const eventsPath = path.join(bin, 'events.jsonl');
    fs.writeFileSync(eventsPath, JSON.stringify({ actor: 'kilbot', at: recent }) + '\n');
    const result = cli(root, {
      BASE_REF: base, GITHUB_EVENT_PATH: eventPath, SCORE_EXCEPTION_EVENT: eventsPath, PATH: `${bin}:${process.env.PATH}`,
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('a/page: missing\n');
    expect(result.stdout).toContain('::notice::label not applied by kilbot\n');
  });
  it('fails clearly in a shallow clone', () => {
    initRepo();
    fs.appendFileSync(path.join(root, VDOCS, 'a/page.mdx'), '\nEdited');
    commitFixture('edit');
    const clone = tempDir('tmp-shallow-');
    execFileSync('git', ['clone', '-q', '--depth', '1', `file://${root}`, clone], { stdio: 'pipe' });
    const result = cli(clone, { BASE_REF: 'HEAD' });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('::error::page-scores needs the full git history; this clone is shallow (check out with fetch-depth: 0).\n');
  });
});
