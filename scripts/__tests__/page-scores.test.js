/* global describe, it, expect, beforeEach, afterEach, vi */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const {
  VDOCS, SCORES_FILE, docSource, referencedPaths, hashInputs, pageHash, groupOf,
  loadScores, saveScores, meanOf, belowFloor, evaluate, resolveCommit,
} = require('../lib/page-scores');
const { recordFromGate, recordGroup, seed, carry, prune } = require('../record-page-score');

const fixtures = path.join(__dirname, 'fixtures/page-scores');
const fixture = path.join(fixtures, 'repo');
const gate = { state: 'continue', round: 17, scores: { a: { x: 8, y: 7 }, b: { x: 7.5, y: 9 } } };
const judged = '2026-11-12';
let root;

function initRepo() {
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', '-A'], { cwd: root });
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t.invalid', 'commit', '-qm', 'base'], { cwd: root });
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(fixtures, 'tmp-'));
  fs.cpSync(fixture, root, { recursive: true });
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

describe('page-score inputs and hashes', () => {
  it('lists sorted references even when their targets do not exist, skipping the image root', () => {
    fs.writeFileSync(docSource(root, 'a/page'), [
      '/img/2.x/missing/shot.png', '@site/static/img/2.x/a/shot.png', '/img/2.x/root.png',
      "import Missing from './absent.mdx'", "import Part from './_part.mdx'",
    ].join('\n'));
    expect(referencedPaths(root, 'a/page')).toEqual({
      imgDirs: ['static/img/2.x/a', 'static/img/2.x/missing'],
      imports: [`${VDOCS}/a/_part.mdx`, `${VDOCS}/a/absent.mdx`],
    });
  });

  it('lists exactly the source, relative import and all referenced directory files', () => {
    expect(hashInputs(root, 'a/page')).toEqual([
      'static/img/2.x/a/deep/extra.png',
      'static/img/2.x/a/manifest.json',
      'static/img/2.x/a/shot.png',
      `${VDOCS}/a/_part.mdx`,
      `${VDOCS}/a/page.mdx`,
    ]);
  });

  it.each([
    'static/img/2.x/a/shot.png', `${VDOCS}/a/_part.mdx`, `${VDOCS}/a/page.mdx`,
  ])('changes the hash when %s changes', (file) => {
    const before = pageHash(root, 'a/page');
    expect(before).toMatch(/^sha256:[a-f0-9]{64}$/);
    fs.appendFileSync(path.join(root, file), '\nchanged');
    expect(pageHash(root, 'a/page')).not.toBe(before);
  });

  it('ignores unrelated image bytes', () => {
    const before = pageHash(root, 'a/page');
    fs.appendFileSync(path.join(root, 'static/img/2.x/b/other.png'), 'changed');
    expect(pageHash(root, 'a/page')).toBe(before);
  });

  it('discovers directory references and strips punctuation, skipping missing paths and dot', () => {
    fs.writeFileSync(docSource(root, 'a/page'), [
      '/img/2.x/a.,;:', '/img/2.x/missing/shot.png', '/img/2.x/root.png',
      "import Missing from './absent.mdx'", "import Dir from './'",
    ].join('\n'));
    expect(hashInputs(root, 'a/page')).toEqual([
      'static/img/2.x/a/deep/extra.png', 'static/img/2.x/a/manifest.json',
      'static/img/2.x/a/shot.png', `${VDOCS}/a/page.mdx`,
    ]);
  });

  it('prefers mdx, falls back to md and returns null for a missing source', () => {
    const mdx = path.join(root, VDOCS, 'a/page.mdx');
    const md = path.join(root, VDOCS, 'a/page.md');
    fs.writeFileSync(md, '# Markdown');
    expect(docSource(root, 'a/page')).toBe(mdx);
    fs.unlinkSync(mdx);
    expect(docSource(root, 'a/page')).toBe(md);
    expect(docSource(root, 'nope')).toBeNull();
    expect(groupOf('error-codes/E1')).toBe('error-codes');
    expect(groupOf('error-codes-other/E1')).toBeNull();
  });
});

describe('commit hashes and provenance', () => {
  beforeEach(initRepo);

  it('hashes committed screenshots larger than the default exec buffer', () => {
    fs.writeFileSync(path.join(root, 'static/img/2.x/a/shot.png'), Buffer.alloc(2 * 1024 * 1024, 42));
    execFileSync('git', ['add', '-A'], { cwd: root });
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t.invalid', 'commit', '-qm', 'large screenshot'], { cwd: root });
    expect(pageHash(root, 'a/page', resolveCommit(root, 'HEAD'))).toBe(pageHash(root, 'a/page'));
  });

  it.each([`${VDOCS}/a/page.mdx`, `${VDOCS}/a/_part.mdx`, 'static/img/2.x/a/shot.png'])(
    'keeps the commit hash when %s changes on disk', (file) => {
      const sha = resolveCommit(root, 'HEAD');
      const hash = pageHash(root, 'a/page');
      expect(sha).toMatch(/^[a-f0-9]{40}$/);
      expect(pageHash(root, 'a/page', sha)).toBe(hash);
      fs.appendFileSync(path.join(root, file), '\nchanged');
      expect(pageHash(root, 'a/page')).not.toBe(hash);
      expect(pageHash(root, 'a/page', sha)).toBe(hash);
    });

  it('reads deleted sources, imports and image directories from the commit', () => {
    const sha = resolveCommit(root, 'HEAD');
    const inputs = hashInputs(root, 'a/page');
    const hash = pageHash(root, 'a/page');
    fs.rmSync(path.join(root, 'static/img/2.x/a'), { recursive: true });
    fs.rmSync(path.join(root, VDOCS, 'a'), { recursive: true });
    expect(docSource(root, 'a/page')).toBeNull();
    expect(docSource(root, 'a/page', sha)).toBe(path.join(root, VDOCS, 'a/page.mdx'));
    expect(hashInputs(root, 'a/page', sha)).toEqual(inputs);
    expect(pageHash(root, 'a/page', sha)).toBe(hash);
  });

  it('requires a commit and records its hash despite uncommitted edits', () => {
    const options = { root, doc: 'a/page', gate, climb: 'x' };
    expect(() => recordFromGate(options)).toThrow('--commit <judged commit> is required');
    const sha = resolveCommit(root, 'HEAD');
    fs.appendFileSync(docSource(root, 'a/page'), '\nchanged');
    const entry = recordFromGate({ ...options, commit: 'HEAD' });
    expect(entry.commit).toBe(sha);
    expect(entry.hash).toBe(pageHash(root, 'a/page', sha));
    expect(entry.hash).not.toBe(pageHash(root, 'a/page'));
    fs.writeFileSync(path.join(root, VDOCS, 'new.mdx'), '# New');
    expect(() => recordFromGate({ ...options, doc: 'new', commit: sha }))
      .toThrow(`No source for doc at ${sha}: new`);
  });

  it('takes group membership, sample checks and page hashes from the commit', () => {
    const options = { root, group: 'error-codes', gate, climb: 'x', sample: ['error-codes/E1'] };
    expect(() => recordGroup(options)).toThrow('--commit <judged commit> is required');
    const sha = resolveCommit(root, 'HEAD');
    fs.unlinkSync(docSource(root, 'error-codes/E1'));
    fs.appendFileSync(docSource(root, 'error-codes/E2'), '\nchanged');
    fs.writeFileSync(path.join(root, VDOCS, 'error-codes/new.mdx'), '# New');
    const entry = recordGroup({ ...options, commit: 'HEAD' });
    expect(entry.commit).toBe(sha);
    expect(entry.pages).toEqual({
      'error-codes/E1': pageHash(root, 'error-codes/E1', sha),
      'error-codes/E2': pageHash(root, 'error-codes/E2', sha),
    });
    expect(() => recordGroup({ ...options, commit: sha, sample: ['error-codes/new'] }))
      .toThrow('Sample doc is not in group error-codes: error-codes/new');
  });

  it.each([undefined, '', 42])('requires a non-empty climb string: %j', (climb) => {
    expect(() => recordFromGate({ root, doc: 'a/page', gate, climb, commit: 'HEAD' }))
      .toThrow('--climb <climb folder> is required');
    expect(() => recordGroup({ root, group: 'error-codes', gate, climb, commit: 'HEAD', sample: ['error-codes/E1'] }))
      .toThrow('--climb <climb folder> is required');
    expect(loadScores(root)).toEqual({});
  });

  it('rejects an unknown commit', () => {
    expect(() => resolveCommit(root, 'nope')).toThrow('Unknown commit: nope');
  });
});

describe('printer wizard images', () => {
  it.each(['/img/printer-wizard/x.png', '@site/static/img/printer-wizard/x.png'])(
    'includes the shared image tree for %s on disk and at a commit', (ref) => {
      fs.appendFileSync(docSource(root, 'a/page'), `\n![printer](${ref})`);
      initRepo();
      const sha = resolveCommit(root, 'HEAD');
      for (const commit of [null, sha]) {
        expect(referencedPaths(root, 'a/page', commit).imgDirs)
          .toEqual(['static/img/2.x/a', 'static/img/printer-wizard']);
        expect(hashInputs(root, 'a/page', commit)).toContain('static/img/printer-wizard/x.png');
      }
      const hash = pageHash(root, 'a/page', sha);
      fs.appendFileSync(path.join(root, 'static/img/printer-wizard/x.png'), 'changed');
      expect(pageHash(root, 'a/page')).not.toBe(hash);
      expect(pageHash(root, 'a/page', sha)).toBe(hash);
    });
});

describe('score maintenance', () => {
  beforeEach(initRepo);

  it('carries a renamed page and preserves its judgment without a gate', () => {
    const original = recordFromGate({ root, doc: 'a/page', gate, climb: 'x', judged, commit: 'HEAD' });
    execFileSync('git', ['mv', `${VDOCS}/a/page.mdx`, `${VDOCS}/a/renamed.mdx`], { cwd: root });
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t.invalid', 'commit', '-qm', 'rename'], { cwd: root });
    const sha = resolveCommit(root, 'HEAD');
    fs.unlinkSync(docSource(root, 'a/renamed'));
    execFileSync(process.execPath, [path.resolve(__dirname, '../record-page-score.js'), '--root', root,
      '--carry', 'a/page', '--doc', 'a/renamed', '--commit', 'HEAD']);
    expect(loadScores(root)).toEqual({ 'a/renamed': {
      ...original, hash: pageHash(root, 'a/renamed', sha), commit: sha, carriedFrom: 'a/page',
    } });
    expect(() => carry({ root, carry: 'missing', doc: 'a/renamed', commit: sha }))
      .toThrow('No entry to carry: missing');
    expect(() => carry({ root, carry: 'a/renamed', doc: 'missing', commit: sha }))
      .toThrow(`No source for doc at ${sha}: missing`);
  });

  it('prunes missing entries and group pages using the disk', () => {
    const page = recordFromGate({ root, doc: 'a/page', gate, climb: 'x', commit: 'HEAD' });
    const group = recordGroup({ root, group: 'error-codes', gate, climb: 'x', commit: 'HEAD', sample: ['error-codes/E1'] });
    saveScores(root, { 'a/page': page, 'a/_part': page, 'error-codes': group });
    fs.unlinkSync(docSource(root, 'a/page'));
    fs.unlinkSync(docSource(root, 'error-codes/E1'));
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    prune({ root });
    expect(stdout).toHaveBeenCalledWith('pruned 1 entries, 1 group pages');
    expect(loadScores(root)).toEqual({ 'a/_part': page, 'error-codes': {
      ...group, pages: { 'error-codes/E2': group.pages['error-codes/E2'] },
    } });
    fs.unlinkSync(docSource(root, 'a/_part'));
    expect(execFileSync(process.execPath, [path.resolve(__dirname, '../record-page-score.js'), '--prune'],
      { cwd: root, encoding: 'utf8' })).toBe('pruned 1 entries, 0 group pages\n');
    expect(Object.keys(loadScores(root))).toEqual(['error-codes']);
  });
});

describe('score floors and evaluation', () => {
  it.each([{}, undefined])('rejects empty or missing scores: %j', (scores) => {
    expect(belowFloor(scores)).toEqual(['no scores']);
  });

  it('checks the mean first, then categories in key order, with inclusive floors', () => {
    expect(belowFloor({ x: 8, y: 8 })).toEqual([]);
    expect(belowFloor({ x: 9, y: 6.5 })).toEqual(['mean 7.75 < 8.0', 'y 6.5 < 7.0']);
    expect(belowFloor({ x: 7, y: 9 })).toEqual([]);
    expect(belowFloor({ z: 6, a: 5 })).toEqual(['mean 5.5 < 8.0', 'z 6 < 7.0', 'a 5 < 7.0']);
    expect(meanOf({ x: 8, y: 8, z: 9 })).toBe(8.33);
  });

  it.each(['a/page', 'error-codes/E1'])('evaluates missing, stale, below and ok in order for %s', (doc) => {
    expect(evaluate(root, doc, {})).toEqual({ doc, status: 'missing', reasons: [] });
    const group = groupOf(doc);
    const entry = group
      ? { group: true, pages: { [doc]: pageHash(root, doc) }, scores: { x: 8 } }
      : { hash: pageHash(root, doc), scores: { x: 8 } };
    const entries = { [group || doc]: entry };
    expect(evaluate(root, doc, entries)).toEqual({ doc, status: 'ok', reasons: [] });
    entry.scores.x = 6;
    expect(evaluate(root, doc, entries)).toEqual({
      doc, status: 'below', reasons: ['mean 6 < 8.0', 'x 6 < 7.0'],
    });
    fs.appendFileSync(docSource(root, doc), '\nchanged');
    expect(evaluate(root, doc, entries)).toEqual({ doc, status: 'stale', reasons: [] });
    if (group) {
      delete entry.pages[doc];
      entries[doc] = { hash: pageHash(root, doc), scores: { x: 9 } };
      expect(evaluate(root, doc, entries)).toEqual({ doc, status: 'missing', reasons: [] });
    }
  });
});

describe('recording scores', () => {
  beforeEach(initRepo);

  it('refuses judges with no categories without saving an entry', () => {
    expect(() => recordFromGate({
      root, commit: 'HEAD', doc: 'a/page', gate: { ...gate, scores: { a: {}, b: {} } }, climb: 'x',
    })).toThrow('Gate scores have no categories');
    expect(loadScores(root)).toEqual({});
  });

  it.each([{}, undefined])('skips seed values with empty or missing scores: %j', (scores) => {
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    saveScores(root, { 'a/page': { scores: { x: 8 } } });
    expect(seed({ root, seed: { 'a/page': { scores } } })).toEqual({ seeded: 0, skipped: 1 });
    expect(loadScores(root)).toEqual({ 'a/page': { scores: { x: 8 } } });
    expect(stderr).toHaveBeenCalledWith('No scores for doc: a/page');
    expect(stdout).toHaveBeenCalledWith('seeded 0, skipped 1');
  });

  it('min-merges judges and preserves existing entries', () => {
    saveScores(root, { existing: { scores: { x: 9 } } });
    const entry = recordFromGate({ root, commit: 'HEAD', doc: 'a/page', gate, climb: 'a__page', judged });
    expect(entry).toEqual({
      hash: pageHash(root, 'a/page'), judged, round: 17,
      judges: ['opus-a', 'opus-b'], scores: { x: 7.5, y: 7 }, mean: 7.25, climb: 'a__page', commit: resolveCommit(root, 'HEAD'),
    });
    expect(loadScores(root)).toEqual({ existing: { scores: { x: 9 } }, 'a/page': entry });
  });

  it.each(['revert', 'error', 'frozen'])('refuses gate state %s without writing', (state) => {
    expect(() => recordFromGate({ root, commit: 'HEAD', doc: 'a/page', gate: { ...gate, state }, climb: 'x' }))
      .toThrow(state);
    expect(loadScores(root)).toEqual({});
  });

  it.each([{}, { a: { x: 8 }, b: { y: 9 } }, { a: { x: 8 }, b: { x: 9, y: 9 } }])(
    'refuses empty or incomplete judge scores: %j', (scores) => {
      expect(() => recordFromGate({ root, commit: 'HEAD', doc: 'a/page', gate: { ...gate, scores }, climb: 'x' }))
        .toThrow(/empty|missing/);
      expect(loadScores(root)).toEqual({});
    }
  );

  it('refuses a missing source and defaults judged to the UTC date', () => {
    expect(() => recordFromGate({ root, commit: 'HEAD', doc: 'nope', gate, climb: 'x' })).toThrow('nope');
    const dates = [new Date().toISOString().slice(0, 10)];
    const entry = recordFromGate({ root, commit: 'HEAD', doc: 'a/page', gate, climb: 'x' });
    dates.push(new Date().toISOString().slice(0, 10));
    expect(dates).toContain(entry.judged);
    expect(entry.commit).toBe(resolveCommit(root, 'HEAD'));
  });

  it('writes every group page and keeps the sample and existing entries', () => {
    saveScores(root, { existing: {} });
    const entry = recordGroup({ root, commit: 'HEAD', group: 'error-codes', gate, climb: 'errors', sample: ['error-codes/E1'], judged });
    expect(entry).toEqual({
      group: true, pages: {
        'error-codes/E1': pageHash(root, 'error-codes/E1'),
        'error-codes/E2': pageHash(root, 'error-codes/E2'),
      }, sample: ['error-codes/E1'], judged, round: 17, judges: ['opus-a', 'opus-b'],
      scores: { x: 7.5, y: 7 }, mean: 7.25, climb: 'errors', commit: resolveCommit(root, 'HEAD'),
    });
    expect(loadScores(root)).toEqual({ existing: {}, 'error-codes': entry });
  });

  it.each([[], ['a/page'], ['error-codes/missing']])('refuses an invalid group sample: %j', (sample) => {
    expect(() => recordGroup({ root, commit: 'HEAD', group: 'error-codes', gate, climb: 'x', sample }))
      .toThrow(/sample|Sample/);
    expect(loadScores(root)).toEqual({});
  });

  it('seeds existing docs, reports skipped docs and preserves other entries', () => {
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    const value = { round: 17, judged, judges: ['opus-a'], scores: { x: 8, y: 9 }, climb: 'a__page' };
    saveScores(root, { existing: {} });
    expect(seed({ root, seed: { 'a/page': value, nope: value } })).toEqual({ seeded: 1, skipped: 1 });
    expect(loadScores(root)).toEqual({
      existing: {}, 'a/page': { ...value, hash: pageHash(root, 'a/page'), mean: 8.5, seeded: true },
    });
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining('nope'));
    expect(stdout).toHaveBeenCalledWith('seeded 1, skipped 1');
  });
});

describe('score persistence and CLI', () => {
  it('sorts only top-level keys, indents with two spaces and ends with a newline', () => {
    expect(loadScores(root)).toEqual({});
    saveScores(root, { z: { z: 1, a: 2 }, a: {} });
    expect(fs.readFileSync(path.join(root, SCORES_FILE), 'utf8'))
      .toBe('{\n  "a": {},\n  "z": {\n    "z": 1,\n    "a": 2\n  }\n}\n');
    fs.writeFileSync(path.join(root, SCORES_FILE), '{bad json');
    expect(() => loadScores(root)).toThrow();
  });

  it('runs all three CLI modes with --root and reports refusal on one stderr line', () => {
    initRepo();
    const script = path.resolve(__dirname, '../record-page-score.js');
    const gateFile = path.join(root, 'gate.json');
    const seedFile = path.join(root, 'seed.json');
    fs.writeFileSync(gateFile, JSON.stringify(gate));
    execFileSync(process.execPath, [script, '--root', root, '--commit', 'HEAD', '--doc', 'a/page', '--gate', gateFile,
      '--climb', 'a__page', '--judged', judged]);
    expect(loadScores(root)['a/page'].judged).toBe(judged);
    expect(loadScores(root)['a/page'].commit).toBe(resolveCommit(root, 'HEAD'));
    execFileSync(process.execPath, [script, '--root', root, '--commit', 'HEAD', '--group', 'error-codes', '--gate', gateFile,
      '--climb', 'errors', '--sample', 'error-codes/E1,error-codes/E2', '--judged', judged]);
    expect(loadScores(root)['error-codes'].sample).toEqual(['error-codes/E1', 'error-codes/E2']);
    expect(loadScores(root)['error-codes'].commit).toBe(resolveCommit(root, 'HEAD'));
    fs.writeFileSync(seedFile, JSON.stringify({ 'a/page': {
      round: 1, judged, judges: ['opus-a'], scores: { x: 9 }, climb: 'seed',
    } }));
    expect(execFileSync(process.execPath, [script, '--root', root, '--seed', seedFile], { encoding: 'utf8' }))
      .toBe('seeded 1, skipped 0\n');
    expect(loadScores(root)['a/page'].seeded).toBe(true);
    expect(loadScores(root)['error-codes'].group).toBe(true);
    fs.writeFileSync(gateFile, JSON.stringify({ ...gate, state: 'revert' }));
    const result = spawnSync(process.execPath, [script, '--root', root, '--commit', 'HEAD', '--doc', 'a/page',
      '--gate', gateFile, '--climb', 'x'], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toBe('Cannot record gate state: revert\n');
    expect(result.stdout).toBe('');
  });
});
