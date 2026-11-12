/* global describe, it, expect, beforeEach, afterEach, vi */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const {
  VDOCS, SCORES_FILE, docSource, hashInputs, pageHash, groupOf,
  loadScores, saveScores, meanOf, belowFloor, evaluate,
} = require('../lib/page-scores');
const { recordFromGate, recordGroup, seed } = require('../record-page-score');

const fixtures = path.join(__dirname, 'fixtures/page-scores');
const fixture = path.join(fixtures, 'repo');
const gate = { state: 'continue', round: 17, scores: { a: { x: 8, y: 7 }, b: { x: 7.5, y: 9 } } };
const judged = '2026-11-12';
let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(fixtures, 'tmp-'));
  fs.cpSync(fixture, root, { recursive: true });
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

describe('page-score inputs and hashes', () => {
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

describe('score floors and evaluation', () => {
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
  it('min-merges judges and preserves existing entries', () => {
    saveScores(root, { existing: { scores: { x: 9 } } });
    const entry = recordFromGate({ root, doc: 'a/page', gate, climb: 'a__page', judged });
    expect(entry).toEqual({
      hash: pageHash(root, 'a/page'), judged, round: 17,
      judges: ['opus-a', 'opus-b'], scores: { x: 7.5, y: 7 }, mean: 7.25, climb: 'a__page',
    });
    expect(loadScores(root)).toEqual({ existing: { scores: { x: 9 } }, 'a/page': entry });
  });

  it.each(['revert', 'error', 'frozen'])('refuses gate state %s without writing', (state) => {
    expect(() => recordFromGate({ root, doc: 'a/page', gate: { ...gate, state }, climb: 'x' }))
      .toThrow(state);
    expect(loadScores(root)).toEqual({});
  });

  it.each([{}, { a: { x: 8 }, b: { y: 9 } }, { a: { x: 8 }, b: { x: 9, y: 9 } }])(
    'refuses empty or incomplete judge scores: %j', (scores) => {
      expect(() => recordFromGate({ root, doc: 'a/page', gate: { ...gate, scores }, climb: 'x' }))
        .toThrow(/empty|missing/);
      expect(loadScores(root)).toEqual({});
    }
  );

  it('refuses a missing source and defaults judged to the UTC date', () => {
    expect(() => recordFromGate({ root, doc: 'nope', gate, climb: 'x' })).toThrow('nope');
    const dates = [new Date().toISOString().slice(0, 10)];
    const entry = recordFromGate({ root, doc: 'a/page', gate, climb: 'x' });
    dates.push(new Date().toISOString().slice(0, 10));
    expect(dates).toContain(entry.judged);
  });

  it('writes every group page and keeps the sample and existing entries', () => {
    saveScores(root, { existing: {} });
    const entry = recordGroup({ root, group: 'error-codes', gate, climb: 'errors', sample: ['error-codes/E1'], judged });
    expect(entry).toEqual({
      group: true, pages: {
        'error-codes/E1': pageHash(root, 'error-codes/E1'),
        'error-codes/E2': pageHash(root, 'error-codes/E2'),
      }, sample: ['error-codes/E1'], judged, round: 17, judges: ['opus-a', 'opus-b'],
      scores: { x: 7.5, y: 7 }, mean: 7.25, climb: 'errors',
    });
    expect(loadScores(root)).toEqual({ existing: {}, 'error-codes': entry });
  });

  it.each([[], ['a/page'], ['error-codes/missing']])('refuses an invalid group sample: %j', (sample) => {
    expect(() => recordGroup({ root, group: 'error-codes', gate, climb: 'x', sample }))
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
    const script = path.resolve(__dirname, '../record-page-score.js');
    const gateFile = path.join(root, 'gate.json');
    const seedFile = path.join(root, 'seed.json');
    fs.writeFileSync(gateFile, JSON.stringify(gate));
    execFileSync(process.execPath, [script, '--root', root, '--doc', 'a/page', '--gate', gateFile,
      '--climb', 'a__page', '--judged', judged]);
    expect(loadScores(root)['a/page'].judged).toBe(judged);
    execFileSync(process.execPath, [script, '--root', root, '--group', 'error-codes', '--gate', gateFile,
      '--climb', 'errors', '--sample', 'error-codes/E1,error-codes/E2', '--judged', judged]);
    expect(loadScores(root)['error-codes'].sample).toEqual(['error-codes/E1', 'error-codes/E2']);
    fs.writeFileSync(seedFile, JSON.stringify({ 'a/page': {
      round: 1, judged, judges: ['opus-a'], scores: { x: 9 }, climb: 'seed',
    } }));
    expect(execFileSync(process.execPath, [script, '--root', root, '--seed', seedFile], { encoding: 'utf8' }))
      .toBe('seeded 1, skipped 0\n');
    expect(loadScores(root)['a/page'].seeded).toBe(true);
    expect(loadScores(root)['error-codes'].group).toBe(true);
    fs.writeFileSync(gateFile, JSON.stringify({ ...gate, state: 'revert' }));
    const result = spawnSync(process.execPath, [script, '--root', root, '--doc', 'a/page',
      '--gate', gateFile, '--climb', 'x'], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toBe('Cannot record gate state: revert\n');
    expect(result.stdout).toBe('');
  });
});
