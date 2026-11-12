/* global describe, it, expect, beforeEach, afterEach */
const fs = require('fs');
const path = require('path');
const { VDOCS, pageHash, saveScores } = require('../lib/page-scores');
const { allDocs, affectedDocs, checkException, run, ENFORCE_FROM } = require('../check-page-scores');

const fixtures = path.join(__dirname, 'fixtures/page-scores');
const now = new Date('2026-11-16T00:00:00Z');
const recent = '2026-11-15T22:00:00Z';
const body = 'x\n## Score exception\nFixes a fact. Tracking: #123\n## Other';
let root;
let options;

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
  beforeEach(() => {
    options.event = { pull_request: { labels: [{ name: 'score-exception' }], body } };
    options.exceptionEvents = [{ actor: 'kilbot', at: recent }];
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

describe('ratchet and workflow', () => {
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

  it('paginates label events, has no paths filter and keeps PR text out of run and env', () => {
    const workflow = fs.readFileSync(path.join(__dirname, '../../.github/workflows/page-scores.yml'), 'utf8');
    expect(workflow).toContain('--paginate');
    expect(workflow).not.toMatch(/^\s*paths:/m);
    for (const line of workflow.split('\n').filter((line) => /run:|env:/.test(line))) {
      expect(line).not.toMatch(/pull_request\.(body|title)/);
    }
    expect(workflow).not.toMatch(/pull_request\.(body|title)/);
  });
});
