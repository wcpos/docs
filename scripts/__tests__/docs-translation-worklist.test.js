const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { buildWorklist, runCli, PACKET_MAX_CHARS } = require('../docs-translation/worklist');
const { parseJsonUnits, applyJsonTranslations } = require('../docs-translation/json-units');
const { STATE_PATH, readState, serializeState, writeState, unitHash } = require('../docs-translation/state');
const { LOCALES, sourceToTranslatedPath, jsonSourceToTranslatedPath } = require('../check-translation-completeness');

const DOC = 'versioned_docs/version-1.x/guide.mdx';
const TARGET = sourceToTranslatedPath(DOC, 'de');
const JSON_SOURCE = 'i18n/en/theme/strings.json';
const JSON_TARGET = jsonSourceToTranslatedPath(JSON_SOURCE, 'de');
const PARAGRAPH = 'Open the settings page to configure your store.';
const EDITED = 'Open the settings page to configure your receipts.';
const ENGLISH = `---\ntitle: "Store guide"\ndescription: "Read the store guide"\n---\n\n# Manage your store\n\n${PARAGRAPH}\n\nPrint a receipt for your customers.\n\n<Image alt="Receipt preview" />\n`;
const GERMAN = '---\ntitle: "Shop-Anleitung"\ndescription: "Lesen Sie die Shop-Anleitung"\n---\n\n# Verwalten Sie Ihren Shop\n\nÖffnen Sie die Einstellungen, um Ihren Shop einzurichten.\n\nDrucken Sie einen Beleg für Ihre Kunden.\n\n<Image alt="Belegvorschau" />\n';
const REUSED = {
  0: 'Shop-Anleitung', 1: 'Lesen Sie die Shop-Anleitung', 2: 'Verwalten Sie Ihren Shop',
  3: 'Öffnen Sie die Einstellungen, um Ihren Shop einzurichten.',
  4: 'Drucken Sie einen Beleg für Ihre Kunden.', 5: 'Belegvorschau',
};
let rootDir;

function git(...args) {
  return execFileSync('git', ['-C', rootDir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function write(file, content) {
  fs.mkdirSync(path.dirname(path.join(rootDir, file)), { recursive: true });
  fs.writeFileSync(path.join(rootDir, file), typeof content === 'string' ? content : JSON.stringify(content));
}
function commitFixtures() {
  git('add', '.');
  git('commit', '-qm', 'Fixtures');
}
function addDoc(file = DOC, english = ENGLISH, translation = GERMAN, locales = ['de']) {
  write(file, english);
  if (translation !== null) {
    for (const locale of locales) write(sourceToTranslatedPath(file, locale), translation);
  }
}
function schedule(options = {}) {
  return buildWorklist({ rootDir, locales: ['de'], ...options });
}
function jsonHash(key, source) {
  return unitHash(['json', key, '', source].join('\0'));
}

beforeEach(() => {
  rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-worklist-'));
  git('init', '-q');
  git('config', 'user.name', 'Worklist Test');
  git('config', 'user.email', 'worklist@example.test');
  write('scripts/docs-translation/glossary.json', { _comment: 'Fixture', de: { Receipt: 'Beleg' } });
  write('scripts/docs-translation/locale-context/de.md', 'German translation notes.\n');
  vi.stubEnv('AUDIT_EXCLUDE', undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  fs.rmSync(rootDir, { recursive: true, force: true });
});

describe('translation state and JSON units', () => {
  it('reads missing state, serializes canonically, and writes without mutating input', () => {
    expect(STATE_PATH).toBe('i18n/translation-state.json');
    expect(readState(rootDir)).toEqual({});
    const state = { z: { partial: { z: 'Z', a: 'A' }, same: ['z', 'a'], source: 'sha' }, a: { same: [], partial: {} } };
    const expected = '{\n  "_comment": "Written by scripts/docs-translation; do not edit by hand.",\n  "a": {},\n  "z": {"source":"sha","same":["a","z"],"partial":{"a":"A","z":"Z"}}\n}\n';
    expect(serializeState({ _comment: 'Old comment', ...state })).toBe(expected);
    writeState(rootDir, state);
    expect(fs.readFileSync(path.join(rootDir, STATE_PATH), 'utf8')).toBe(expected);
    expect(readState(rootDir)).toEqual({ a: {}, z: { source: 'sha', same: ['a', 'z'], partial: { a: 'A', z: 'Z' } } });
    expect(state.z.same).toEqual(['z', 'a']);
    expect(unitHash('abc')).toBe('ba7816bf8f01cfea');
  });

  it('indexes only non-empty messages and preserves descriptions and other values on apply', () => {
    const original = { empty: '', ignored: { description: 'Only context' }, null: null, count: 7,
      save: { message: 'Save', description: 'Button', extra: true }, open: 'Open', blank: { message: '' } };
    const text = JSON.stringify(original);
    expect(parseJsonUnits(text)).toEqual([
      { index: 0, key: 'save', source: 'Save', description: 'Button', valueType: 'message' },
      { index: 1, key: 'open', source: 'Open', valueType: 'string' },
    ]);
    expect(applyJsonTranslations(text, new Map([[0, 'Speichern'], [1, 'Öffnen']]))).toBe(JSON.stringify({
      ...original, save: { ...original.save, message: 'Speichern' }, open: 'Öffnen',
    }, null, 2) + '\n');
    expect(applyJsonTranslations(text, new Map([[1, 'Öffnen']]))).toBe(JSON.stringify({ ...original, open: 'Öffnen' }, null, 2) + '\n');
    expect(JSON.parse(text)).toEqual(original);
  });
});

describe('MDX worklist', () => {
  it('returns zero work and no plan for aligned translations with matching state', () => {
    addDoc();
    commitFixtures();
    writeState(rootDir, { [TARGET]: { source: git('hash-object', DOC) } });
    const before = git('status', '--porcelain');
    expect(schedule()).toEqual({ packets: [], plan: { targets: [] }, summary: {
      total: 0, packets: 0, targets: { translate: 0, refresh: 0, record: 0, unchanged: 1, deferred: 0 },
      deferred_units: 0, locales: {},
    } });
    expect(git('status', '--porcelain')).toBe(before);
  });

  it('records a matching git baseline without a state entry', () => {
    addDoc();
    commitFixtures();
    const { plan, summary, packets } = schedule();
    expect(summary.total).toBe(0);
    expect(summary.targets.record).toBe(1);
    expect(packets).toEqual([]);
    expect(plan.targets).toEqual([{ target: TARGET, source: DOC, locale: 'de', kind: 'mdx', status: 'record',
      source_blob: git('hash-object', DOC), pending: [], reasons: { missing: 0, changed: 0, english: 0 } }]);
  });

  it('schedules only the edited paragraph using positions across mixed MDX unit types', () => {
    addDoc();
    commitFixtures();
    write(DOC, ENGLISH.replace(PARAGRAPH, EDITED));
    const { plan, packets, summary } = schedule();
    const { 3: edited, ...others } = REUSED;
    expect(plan.targets[0]).toMatchObject({ pending: [3], reused: others, reasons: { missing: 0, changed: 1, english: 0 } });
    expect(packets[0].files[TARGET].units).toEqual({ u3: { type: 'paragraph', source: EDITED } });
    expect(summary.total).toBe(1);
  });

  it('schedules every missing-target unit with unique IDs and packet metadata', () => {
    addDoc(DOC, ENGLISH, null);
    commitFixtures();
    const { plan, packets, summary } = schedule();
    expect(plan.targets[0]).toMatchObject({ pending: [0, 1, 2, 3, 4, 5], reused: {}, reasons: { missing: 6, changed: 0, english: 0 } });
    const units = { u0: { type: 'frontmatter', source: 'Store guide', key: 'title' },
      u1: { type: 'frontmatter', source: 'Read the store guide', key: 'description' },
      u2: { type: 'heading', source: 'Manage your store' }, u3: { type: 'paragraph', source: PARAGRAPH },
      u4: { type: 'paragraph', source: 'Print a receipt for your customers.' },
      u5: { type: 'jsx_attr', source: 'Receipt preview', attr: 'alt' } };
    expect(packets).toEqual([{ locale: 'de', locale_name: 'German', locale_notes: 'scripts/docs-translation/locale-context/de.md',
      glossary: { Receipt: 'Beleg' }, counts: { units: 6, files: 1, chars: Object.values(units).reduce((sum, u) => sum + u.source.length, 0) },
      files: { [TARGET]: { source_path: DOC, existing_translation: null, kind: 'mdx', units } } }]);
    expect(summary.locales).toEqual({ de: { units: 6, files: 1 } });
  });

  it('prefers the state blob over a commit that changed English and translation together', () => {
    addDoc();
    commitFixtures();
    const oldBlob = git('hash-object', DOC);
    write(DOC, ENGLISH.replace(PARAGRAPH, EDITED));
    write(TARGET, GERMAN + '\n');
    commitFixtures();
    writeState(rootDir, { [TARGET]: { source: oldBlob } });
    expect(schedule().plan.targets[0]).toMatchObject({ status: 'translate', pending: [3], reasons: { changed: 1 } });
    writeState(rootDir, { [TARGET]: { source: '0'.repeat(40) } });
    expect(schedule().plan.targets[0].status).toBe('record');
  });

  it('flags significant English and accepts hashes explicitly marked same', () => {
    addDoc(DOC, PARAGRAPH + '\n', PARAGRAPH + '\n');
    commitFixtures();
    expect(schedule().plan.targets[0]).toMatchObject({ pending: [0], reasons: { english: 1 } });
    writeState(rootDir, { [TARGET]: { source: git('hash-object', DOC), same: [unitHash(['paragraph', '', '', PARAGRAPH].join('\0'))] } });
    expect(schedule().summary).toMatchObject({ total: 0, targets: { unchanged: 1 } });
  });

  it('reuses short prose and allowlisted terms even when identical to English', () => {
    const text = 'Yes\n\nStripe Terminal\n';
    addDoc(DOC, text, text);
    commitFixtures();
    expect(schedule().summary).toMatchObject({ total: 0, targets: { record: 1 } });
  });

  it('uses an accepted partial for a changed paragraph and refreshes without a model', () => {
    addDoc();
    commitFixtures();
    write(DOC, ENGLISH.replace(PARAGRAPH, EDITED));
    const partial = { [unitHash(['paragraph', '', '', EDITED].join('\0'))]: 'Öffnen Sie die Einstellungen für Ihre Belege.' };
    writeState(rootDir, { [TARGET]: { partial } });
    const { plan, summary } = schedule();
    expect(summary.total).toBe(0);
    expect(plan.targets[0]).toMatchObject({ status: 'refresh', pending: [], reused: { ...REUSED, 3: Object.values(partial)[0] } });
  });

  it('requires changed units without a baseline but still accepts partials', () => {
    addDoc(DOC, ENGLISH, null);
    commitFixtures();
    write(TARGET, GERMAN);
    expect(schedule().plan.targets[0]).toMatchObject({ pending: [0, 1, 2, 3, 4, 5], reasons: { changed: 6 } });
    writeState(rootDir, { [TARGET]: { partial: { [unitHash(['paragraph', '', '', PARAGRAPH].join('\0'))]: REUSED[3] } } });
    expect(schedule().plan.targets[0]).toMatchObject({ pending: [0, 1, 2, 4, 5], reused: { 3: REUSED[3] } });
  });

  it('refreshes for code-only changes while reusing every prose unit', () => {
    const code = '\n```js\nconst enabled = false;\n```\n';
    addDoc(DOC, ENGLISH + code, GERMAN + code);
    commitFixtures();
    write(DOC, ENGLISH + code.replace('false', 'true'));
    const result = schedule();
    expect(result.packets).toEqual([]);
    expect(result.plan.targets[0]).toMatchObject({ status: 'refresh', pending: [], reused: REUSED });
    expect(result.summary).toMatchObject({ total: 0, targets: { refresh: 1 } });
  });
});

describe('JSON worklist', () => {
  it('schedules new keys, changed messages, and identical short messages independently', () => {
    const english = { save: { message: 'Save', description: 'Button' }, open: 'Open', ok: 'OK', number: '123' };
    write(JSON_SOURCE, english);
    write(JSON_TARGET, { save: { message: 'Speichern' }, open: 'Öffnen', ok: 'OK', number: '123' });
    commitFixtures();
    write(JSON_SOURCE, { ...english, save: { message: 'Save now', description: 'Button' }, next: 'Continue' });
    const { plan, packets, summary } = schedule();
    expect(summary.total).toBe(3);
    expect(plan.targets[0]).toMatchObject({ kind: 'json', pending: [0, 2, 4], reused: { 1: 'Öffnen', 3: '123' },
      reasons: { missing: 0, changed: 2, english: 1 } });
    expect(packets[0].files[JSON_TARGET]).toEqual({ source_path: JSON_SOURCE, existing_translation: JSON_TARGET,
      kind: 'json', units: { u0: { type: 'json', key: 'save', source: 'Save now', description: 'Button' },
        u2: { type: 'json', key: 'ok', source: 'OK' }, u4: { type: 'json', key: 'next', source: 'Continue' } } });
    writeState(rootDir, { [JSON_TARGET]: { same: [jsonHash('ok', 'OK')],
      partial: { [jsonHash('save', 'Save now')]: 'Jetzt speichern' } } });
    expect(schedule().plan.targets[0]).toMatchObject({ pending: [4], reused: { 0: 'Jetzt speichern', 1: 'Öffnen', 2: 'OK', 3: '123' },
      reasons: { missing: 0, changed: 1, english: 0 } });
  });

  it.each([null, '{invalid'])('treats a missing or invalid JSON target as missing (%s)', target => {
    write(JSON_SOURCE, { save: 'Save', open: { message: 'Open' } });
    if (target !== null) write(JSON_TARGET, target);
    commitFixtures();
    writeState(rootDir, { [JSON_TARGET]: { partial: { [jsonHash('save', 'Save')]: 'Speichern' } } });
    expect(schedule().plan.targets[0]).toMatchObject({ pending: [0, 1], reused: {}, reasons: { missing: 2, changed: 0, english: 0 } });
  });

  it('walks untracked English JSON and reuses target messages without a baseline', () => {
    commitFixtures();
    write(JSON_SOURCE, { save: 'Save', open: 'Open', next: 'Continue' });
    write(JSON_TARGET, { save: { message: 'Speichern' }, open: '', next: { message: 7 } });
    expect(git('ls-files', 'i18n/en')).toBe('');
    expect(schedule().plan.targets[0]).toMatchObject({ pending: [1, 2], reused: { 0: 'Speichern' }, reasons: { changed: 2 } });
  });

  it('refreshes for description-only changes and then reports zero work with matching state', () => {
    write(JSON_SOURCE, { save: { message: 'Save', description: 'Old context' } });
    write(JSON_TARGET, { save: { message: 'Speichern', description: 'Old context' } });
    commitFixtures();
    expect(schedule().plan.targets[0].status).toBe('record');
    write(JSON_SOURCE, { save: { message: 'Save', description: 'New context' } });
    expect(schedule().plan.targets[0]).toMatchObject({ status: 'refresh', pending: [], reused: { 0: 'Speichern' } });
    git('hash-object', '-w', JSON_SOURCE);
    writeState(rootDir, { [JSON_TARGET]: { source: git('hash-object', JSON_SOURCE) } });
    expect(schedule().summary).toMatchObject({ total: 0, targets: { unchanged: 1 } });
  });
});

describe('ordering, limits, and packets', () => {
  it('excludes retired versions, respects AUDIT_EXCLUDE, and ignores untracked MDX', () => {
    for (const version of ['version-0.4.x', 'version-2.x', 'version-1.x']) {
      addDoc(`versioned_docs/${version}/guide.mdx`, PARAGRAPH, null);
      write(`i18n/en/docs/${version}.json`, { title: 'Guide' });
    }
    commitFixtures();
    write('versioned_docs/version-1.x/untracked.md', PARAGRAPH);
    const paths = schedule().plan.targets.map(entry => entry.source).sort();
    expect(paths).toEqual(['i18n/en/docs/version-1.x.json', DOC]);
    vi.stubEnv('AUDIT_EXCLUDE', 'version-1\\.x');
    expect(schedule().plan.targets).toHaveLength(4);
  });

  it('prioritizes JSON, changed MDX, English MDX, then missing MDX; never caps refresh or record', () => {
    const changed = 'versioned_docs/version-1.x/z-changed.mdx';
    const english = 'versioned_docs/version-1.x/y-english.mdx';
    const missing = 'versioned_docs/version-1.x/a-missing.mdx';
    const refresh = 'versioned_docs/version-1.x/refresh.mdx';
    addDoc(changed, PARAGRAPH, REUSED[3]);
    addDoc(english, PARAGRAPH, PARAGRAPH);
    addDoc(missing, PARAGRAPH, null);
    addDoc(refresh, PARAGRAPH, REUSED[3]);
    addDoc();
    write(JSON_SOURCE, { save: 'Save' });
    commitFixtures();
    write(changed, EDITED);
    write(refresh, PARAGRAPH + '\n\n```js\nconst x = 1;\n```\n');
    const unlimited = schedule();
    expect(Object.values(unlimited.packets[0].files).map(file => file.source_path)).toEqual([JSON_SOURCE, changed, english, missing]);
    const capped = schedule({ maxUnits: 1 });
    expect(capped.summary).toMatchObject({ total: 1, deferred_units: 3,
      targets: { translate: 1, refresh: 1, record: 1, unchanged: 0, deferred: 3 } });
    expect(capped.plan.targets.map(entry => entry.status).sort()).toEqual(['record', 'refresh', 'translate']);
    expect(capped.plan.targets.map(entry => entry.target)).toEqual(capped.plan.targets.map(entry => entry.target).sort());
  });

  it('takes or defers every locale of each source together, even when the first group exceeds the cap', () => {
    addDoc('versioned_docs/version-1.x/b.md', PARAGRAPH, null);
    addDoc('versioned_docs/version-1.x/a.md', PARAGRAPH, null);
    commitFixtures();
    const result = schedule({ locales: ['de', 'es', 'fr'], maxUnits: 1 });
    expect(result.summary).toMatchObject({ total: 3, deferred_units: 3, targets: { translate: 3, deferred: 3 } });
    expect(result.plan.targets.map(entry => entry.source)).toEqual(Array(3).fill('versioned_docs/version-1.x/a.md'));
    expect(result.packets.map(packet => packet.locale)).toEqual(['es', 'fr', 'de']);
    expect(result.packets[0]).toMatchObject({ locale_name: 'Spanish', glossary: {}, locale_notes: null });
    expect(schedule({ maxUnits: 2 }).summary).toMatchObject({ total: 2, deferred_units: 0 });
  });

  it('uses all 11 locales by default', () => {
    addDoc(DOC, PARAGRAPH, null);
    commitFixtures();
    const { packets, summary } = buildWorklist({ rootDir });
    expect(packets.map(packet => packet.locale)).toEqual(LOCALES);
    expect(packets.map(packet => packet.locale_name)).toEqual(['Spanish', 'French', 'German', 'Dutch', 'Japanese',
      'Portuguese (Brazil)', 'Korean', 'Italian', 'Arabic', 'Hindi (India)', 'Chinese (Simplified)']);
    expect(summary.total).toBe(11);
  });

  it('splits packets at target boundaries using decoded characters and includes oversized targets', () => {
    const text = '---\ntitle: "Say \\"hello\\""\n---\n';
    for (const name of ['c', 'a', 'b']) addDoc(`versioned_docs/version-1.x/${name}.mdx`, text, null);
    commitFixtures();
    expect(PACKET_MAX_CHARS).toBe(30000);
    const result = schedule({ packetMaxChars: 22 });
    expect(result.packets.map(packet => packet.counts)).toEqual([{ units: 2, files: 2, chars: 22 }, { units: 1, files: 1, chars: 11 }]);
    expect(Object.values(result.packets[0].files).map(file => file.source_path)).toEqual([
      'versioned_docs/version-1.x/a.mdx', 'versioned_docs/version-1.x/b.mdx',
    ]);
    expect(schedule({ packetMaxChars: 1 }).packets.map(packet => packet.counts.chars)).toEqual([11, 11, 11]);
  });
});

describe('worklist CLI', () => {
  it('writes named packets and plan, prints one summary line, and removes stale packets on a zero-work run', () => {
    addDoc(DOC, PARAGRAPH, null);
    commitFixtures();
    write('out/stale.json', '{}');
    write('out/keep.txt', 'Keep');
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const out = path.join(rootDir, 'out');
    const planFile = path.join(rootDir, 'plans/plan.json');
    const args = ['--root', rootDir, '--out', out, '--plan', planFile, '--locale', 'de', '--locale', 'es', '--max-units', '1'];
    const expected = schedule({ locales: ['de', 'es'], maxUnits: 1 });
    runCli(args);
    expect(fs.readdirSync(out).sort()).toEqual(['de-01.json', 'es-01.json', 'keep.txt']);
    expect(fs.readFileSync(path.join(out, 'es-01.json'), 'utf8')).toBe(JSON.stringify(expected.packets[0], null, 2) + '\n');
    expect(fs.readFileSync(planFile, 'utf8')).toBe(JSON.stringify(expected.plan, null, 2) + '\n');
    expect(stdout).toHaveBeenCalledTimes(1);
    expect(stdout).toHaveBeenLastCalledWith(JSON.stringify(expected.summary) + '\n');
    expect(fs.existsSync(path.join(rootDir, STATE_PATH))).toBe(false);
    for (const locale of ['de', 'es']) write(sourceToTranslatedPath(DOC, locale), REUSED[3]);
    commitFixtures();
    writeState(rootDir, Object.fromEntries(['de', 'es'].map(locale => [sourceToTranslatedPath(DOC, locale), { source: git('hash-object', DOC) }])));
    runCli(args);
    expect(JSON.parse(stdout.mock.calls[1][0]).total).toBe(0);
    expect(fs.readdirSync(out)).toEqual(['keep.txt']);
    expect(JSON.parse(fs.readFileSync(planFile, 'utf8'))).toEqual({ targets: [] });
  });

  it.each([
    [[], '--out is required'], [['--out', 'out'], '--plan is required'],
    [['--locale', 'xx'], 'Unknown locale: xx'], [['--out'], 'Missing value for --out'],
    [['--wat'], 'Unknown argument: --wat'],
    ...['0', '1.5', 'NaN', '9007199254740992'].map(value => [['--max-units', value], '--max-units must be a positive integer']),
  ])('rejects invalid arguments %j', (args, message) => {
    expect(() => runCli(args)).toThrow(message);
  });

  it('reports errors on stderr with exit code 2', () => {
    const result = spawnSync(process.execPath, [path.resolve(__dirname, '../docs-translation/worklist.js'), '--locale', 'xx'], { encoding: 'utf8' });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Unknown locale: xx');
    expect(result.stdout).toBe('');
  });
});
