const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { applyResults, runCli } = require('../docs-translation/apply');
const { parseDocsMdxUnits } = require('../docs-translation/mdx-units');
const { decodeDocsUnitSource, unitKey } = require('../docs-translation/recover');
const { readState, writeState, unitHash, STATE_PATH } = require('../docs-translation/state');
const {
  LOCALES, sourceToTranslatedPath, findUntranslatedProps, findLeftoverProse,
  findMissingSections, isStub,
} = require('../check-translation-completeness');
const { validateFrontmatter } = require('../validate-frontmatter');

const SOURCE = 'versioned_docs/version-1.x/guide.mdx';
const TARGET = sourceToTranslatedPath(SOURCE, 'de');
const ENGLISH = '---\ntitle: "Store guide"\ndescription: "Read the store guide"\n---\n\n# Manage your store\n\nOpen the settings page to configure your store.\n\nRun `wcpos sync` to update your store.\n\nVisit [support](https://example.test/help) for more information.\n';
const TEXTS = [
  'Shop-Anleitung', 'Anleitung: den "Shop" einrichten', 'Verwalten Sie Ihren Shop',
  'Öffnen Sie die Einstellungen, um Ihren Shop einzurichten.',
  'Führen Sie `wcpos sync` aus, um Ihren Shop zu aktualisieren.',
  'Besuchen Sie den [Support](https://example.test/help) für weitere Informationen.',
];
const GERMAN = `---\ntitle: "${TEXTS[0]}"\ndescription: "Anleitung: den \\"Shop\\" einrichten"\n---\n\n# ${TEXTS[2]} {#manage-your-store}\n\n${TEXTS.slice(3).join('\n\n')}\n`;
const ENTRY = { target: TARGET, source: SOURCE, locale: 'de', kind: 'mdx', status: 'translate',
  source_blob: 'new-blob', pending: [0, 1, 2, 3, 4, 5], reused: {}, reasons: { missing: 6 } };
let rootDir;

function write(file, content) {
  const absolute = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, typeof content === 'string' ? content : JSON.stringify(content));
}
function read(file) {
  return fs.readFileSync(path.join(rootDir, file), 'utf8');
}
function siblings(content = GERMAN) {
  for (const locale of LOCALES.filter(locale => locale !== 'de')) write(sourceToTranslatedPath(SOURCE, locale), content);
}
function result(texts = TEXTS, target = TARGET, locale = 'de') {
  return { locale, files: { [target]: Object.fromEntries(texts.map((text, i) => [`u${i}`, text])) } };
}
function apply(entry = ENTRY, results = [result()]) {
  return applyResults({ rootDir, plan: { targets: [entry] }, results });
}
function mdxHash(index, source = ENGLISH) {
  const parsed = parseDocsMdxUnits(SOURCE, source);
  return unitHash(unitKey(parsed.units[index], decodeDocsUnitSource(parsed, parsed.units[index])));
}

beforeEach(() => {
  rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-apply-'));
  write(SOURCE, ENGLISH);
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(rootDir, { recursive: true, force: true });
});

describe('applyResults MDX', () => {
  it('rebuilds by unit position with English anchors and a quoted description, without writing', () => {
    siblings();
    const plan = { targets: [ENTRY] };
    const results = [result()];
    const inputs = JSON.stringify({ plan, results });
    const output = applyResults({ rootDir, plan, results });
    expect(output.writes).toEqual([{ path: TARGET, content: GERMAN }]);
    expect(output.state[TARGET]).toEqual({ source: 'new-blob' });
    expect(output.report).toEqual({ applied: 6, rejected: 0, warnings: 0, missing: 0,
      files_written: [TARGET], files_incomplete: [], sources_held_back: [], rejected_details: [], warning_details: [] });
    expect(validateFrontmatter(output.writes[0].content).valid).toBe(true);
    expect(findUntranslatedProps(ENGLISH, GERMAN)).toEqual([]);
    expect(findLeftoverProse(ENGLISH, GERMAN)).toEqual([]);
    expect(findMissingSections(ENGLISH, GERMAN)).toEqual([]);
    expect(isStub(ENGLISH, GERMAN, 'de')).toBe(false);
    expect(fs.existsSync(path.join(rootDir, TARGET))).toBe(false);
    expect(fs.existsSync(path.join(rootDir, STATE_PATH))).toBe(false);
    expect(JSON.stringify({ plan, results })).toBe(inputs);
  });

  it('restores a changed non-breadcrumb inline code span and accepts the unit', () => {
    siblings();
    const texts = [...TEXTS];
    texts[4] = texts[4].replace('wcpos sync', 'wcpos synchronisieren');
    expect(apply(ENTRY, [result(texts)]).writes).toEqual([{ path: TARGET, content: GERMAN }]);
  });

  it.each([['30 days', '3 日'], ['Port 8080', 'Port 80']])('rejects changed MDX numbers: %s', (english, translated) => {
    write(SOURCE, ENGLISH.replace('Open the settings page to configure your store.', english));
    const texts = [...TEXTS];
    texts[3] = translated;
    const output = apply(ENTRY, [result(texts)]);
    expect(output.writes).toEqual([]);
    expect(output.report.rejected_details).toEqual([{ target: TARGET, unit: 'u3', reason: 'numbers' }]);
    expect(output.report).toMatchObject({ applied: 5, rejected: 1 });
  });

  it.each([
    ['You can apply more than one coupon to an order.', '1つの注文に複数のクーポンを適用できます。'],
    ['Two 10% coupons stack to 19% off (not 20%).', '10%のクーポンを2つ重ねると19%割引になります（20%ではありません）。'],
    ['Single-use promo', '1回限りのプロモーション'],
  ])('accepts added Japanese digit runs: %s', (english, translated) => {
    write(SOURCE, english + '\n');
    for (const locale of LOCALES) write(sourceToTranslatedPath(SOURCE, locale), GERMAN);
    const target = sourceToTranslatedPath(SOURCE, 'ja');
    const output = apply({ ...ENTRY, target, locale: 'ja', pending: [0] }, [result([translated], target, 'ja')]);
    expect(output.report).toMatchObject({ applied: 1, rejected: 0 });
    expect(output.writes).toEqual([{ path: target, content: translated + '\n' }]);
  });

  it.each(LOCALES)('normalizes full-width parentheses around inline code for %s', locale => {
    write(SOURCE, 'Your exact domain (`yourstore.com`)\n');
    for (const sibling of LOCALES) write(sourceToTranslatedPath(SOURCE, sibling), GERMAN);
    const target = sourceToTranslatedPath(SOURCE, locale);
    const output = apply({ ...ENTRY, target, locale, pending: [0] }, [result(['正確なドメイン（`yourstore.com`）'], target, locale)]);
    expect(output.report).toMatchObject({ applied: 1, rejected: 0 });
    expect(output.writes).toEqual([{ path: target, content: '正確なドメイン(`yourstore.com`)\n' }]);
  });

  it.each([
    [4, 'Aktualisieren Sie Ihren Shop.', 'inline_code_changed'],
    [5, 'Besuchen Sie den [Support](https://example.test/wrong).', 'link_url_changed'],
    [3, 'Öffnen Sie die Einstellungen.\nRichten Sie den Shop ein.', 'line_count'],
    [3, '  ', 'empty'],
    [3, 'WooCommerce POS einrichten.', 'WooCommerce POS'],
  ])('rejects invalid unit u%i (%s) and saves other accepted units as partials', (index, text, reason) => {
    const texts = [...TEXTS];
    texts[index] = text;
    writeState(rootDir, { [TARGET]: { source: 'old-blob', partial: { previous: 'Früher' } } });
    const output = apply(ENTRY, [result(texts)]);
    expect(output.writes).toEqual([]);
    expect(output.report).toMatchObject({ applied: 5, rejected: 1, files_incomplete: [TARGET] });
    expect(output.report.rejected_details).toEqual([{ target: TARGET, unit: `u${index}`, reason: expect.stringContaining(reason) }]);
    expect(output.state[TARGET].source).toBe('old-blob');
    expect(output.state[TARGET].partial.previous).toBe('Früher');
    for (let i = 0; i < TEXTS.length; i += 1) {
      expect(output.state[TARGET].partial[mdxHash(i)]).toBe(i === index ? undefined : TEXTS[i]);
    }
    expect(readState(rootDir)[TARGET].partial).toEqual({ previous: 'Früher' });
  });

  it('accepts and reports a warning-only unit', () => {
    siblings();
    const texts = [...TEXTS];
    texts[3] = 'Gehe zu den Einstellungen.';
    const output = apply(ENTRY, [result(texts)]);
    expect(output.writes).toHaveLength(1);
    expect(output.report).toMatchObject({ applied: 6, rejected: 0, warnings: 1,
      warning_details: [{ target: TARGET, unit: 'u3', codes: ['locale_style_violation'] }] });
  });

  it('records an identical short unit in same without duplicating its hash', () => {
    write(SOURCE, '# API\n');
    siblings();
    const hash = mdxHash(0, '# API\n');
    const output = apply({ ...ENTRY, pending: [0] }, [result(['API'])]);
    expect(output.writes).toEqual([{ path: TARGET, content: '# API {#api}\n' }]);
    expect(output.state[TARGET]).toEqual({ source: 'new-blob', same: [hash] });
    expect(output.report).toMatchObject({ applied: 1, warnings: 1,
      warning_details: [{ target: TARGET, unit: 'u0', codes: ['identical'] }] });
    writeState(rootDir, output.state);
    expect(apply({ ...ENTRY, pending: [0] }, [result(['API'])]).state[TARGET].same).toEqual([hash]);
  });

  it('accepts an allowlisted English-identical MDX unit and records its hash in same', () => {
    const name = 'Brazilian Market on WooCommerce / Extra Checkout Fields for Brazil';
    const source = ENGLISH + `\n<Image alt="${name}" />\n`;
    write(SOURCE, source);
    siblings();
    const output = apply({ ...ENTRY, pending: [...ENTRY.pending, 6] }, [result([...TEXTS, name])]);
    expect(output.writes).toEqual([{ path: TARGET, content: GERMAN + `\n<Image alt="${name}" />\n` }]);
    expect(output.report).toMatchObject({ applied: 7, rejected: 0, files_incomplete: [] });
    expect(output.state[TARGET]).toEqual({ source: 'new-blob', same: [mdxHash(6, source)] });
  });

  it.each(['Open the settings page to configure your store.', '| `rest_cannot_view` | WordPress REST API |'])(
    'accepts identical MDX with a warning: %s', text => {
      const source = ENGLISH.replace('Open the settings page to configure your store.', text);
      write(SOURCE, source);
      siblings();
      const texts = TEXTS.map((translated, index) => index === 3 ? text : translated);
      const output = apply(ENTRY, [result(texts)]);
      expect(output.writes).toEqual([{ path: TARGET, content: GERMAN.replace(TEXTS[3], text) }]);
      expect(output.report).toMatchObject({ applied: 6, rejected: 0, warnings: 1,
        warning_details: [{ target: TARGET, unit: 'u3', codes: ['identical'] }] });
      expect(output.state[TARGET].same).toEqual([mdxHash(3, source)]);
    },
  );

  it('still rejects a complete file with at least three leftover prose lines', () => {
    siblings();
    const parsed = parseDocsMdxUnits(SOURCE, ENGLISH);
    const output = apply(ENTRY, [result(parsed.units.map(unit => decodeDocsUnitSource(parsed, unit)))]);
    expect(output.writes).toEqual([]);
    expect(output.report).toMatchObject({ applied: 6, rejected: 1, warnings: 6 });
    expect(output.report.rejected_details).toContainEqual({ target: TARGET, unit: null, reason: expect.stringContaining('leftover_prose') });
  });

  it.each([undefined, {}, { source: 'old' }, { same: ['hash'] }, { partial: { previous: 'Früher' } }])(
    'removes a new empty entry but keeps prior state %j when no units are accepted', previous => {
      if (previous !== undefined) writeState(rootDir, { [TARGET]: previous });
      const output = apply(ENTRY, [result(TEXTS.map(() => ''))]);
      expect(output.writes).toEqual([]);
      expect(output.report).toMatchObject({ applied: 0, rejected: 6, files_incomplete: [TARGET] });
      if (previous === undefined) expect(output.state).not.toHaveProperty(TARGET);
      else expect(output.state[TARGET]).toMatchObject(previous);
      writeState(rootDir, output.state);
      expect(readState(rootDir)).toEqual(previous === undefined ? {} : { [TARGET]: previous });
    },
  );

  it('counts absent or non-string results as missing and uses all matching locale packets', () => {
    const output = apply(ENTRY, [result(['Falsch'], TARGET, 'fr'),
      { locale: 'de', files: { [TARGET]: { u1: TEXTS[1], u2: null, u3: 7 } } },
      { locale: 'de', files: { [TARGET]: { u4: TEXTS[4] } } }, { locale: 'de' }, null]);
    expect(output.report).toMatchObject({ applied: 2, missing: 4, rejected: 0, files_incomplete: [TARGET] });
    expect(output.state[TARGET].partial).toEqual({ [mdxHash(1)]: TEXTS[1], [mdxHash(4)]: TEXTS[4] });
  });

  it('record only sets source and preserves same and partial, without reading the source', () => {
    const previous = { source: 'old', same: ['hash'], partial: { hash: 'Text' } };
    writeState(rootDir, { [TARGET]: previous, untouched: { source: 'keep' } });
    const output = apply({ ...ENTRY, status: 'record', source: 'missing.mdx' }, []);
    expect(output.writes).toEqual([]);
    expect(output.state).toEqual({ [TARGET]: { ...previous, source: 'new-blob' }, untouched: { source: 'keep' } });
    expect(output.report.applied).toBe(0);
  });

  it('refreshes source and drops partial without writing unchanged content', () => {
    write(TARGET, GERMAN);
    writeState(rootDir, { [TARGET]: { source: 'old', partial: { old: 'Alt' } } });
    const output = apply({ ...ENTRY, status: 'refresh', pending: [], reused: { ...TEXTS } }, []);
    expect(output.writes).toEqual([]);
    expect(output.state[TARGET]).toEqual({ source: 'new-blob' });
    expect(output.report.files_incomplete).toEqual([]);
    expect(output.report.sources_held_back).toEqual([]);
  });

  it('refreshes a translation after English deletes a section and its anchor', () => {
    write(TARGET, GERMAN + '\n## Was zu tun ist {#what-to-do}\n\nVeraltete Anweisungen.\n');
    writeState(rootDir, { [TARGET]: { source: 'old' } });
    siblings();
    const output = apply({ ...ENTRY, status: 'refresh', pending: [], reused: { ...TEXTS } }, []);
    expect(output.writes).toEqual([{ path: TARGET, content: GERMAN }]);
    expect(output.writes[0].content).not.toContain('{#what-to-do}');
    expect(output.writes[0].content).not.toContain('Veraltete Anweisungen.');
    expect(output.report).toMatchObject({ rejected: 0, files_incomplete: [], sources_held_back: [] });
    expect(output.state[TARGET]).toEqual({ source: 'new-blob' });
  });

  it.each([undefined, { source: 'old', partial: { previous: 'Früher' } }])('clears partials when a complete file fails the CI untranslated-prop gate: %j', previous => {
    const source = ENGLISH + '\n<Image alt="Receipt preview" />\n';
    write(SOURCE, source);
    siblings();
    if (previous) writeState(rootDir, { [TARGET]: previous });
    const output = apply({ ...ENTRY, reused: { 6: 'Receipt preview' } });
    expect(output.writes).toEqual([]);
    expect(output.report.files_incomplete).toEqual([TARGET]);
    expect(output.report).toMatchObject({ applied: 6, missing: 0, rejected: 1 });
    expect(output.report.rejected_details).toContainEqual({ target: TARGET, unit: null, reason: expect.stringContaining('untranslated_props') });
    expect(output.state[TARGET]?.partial).toBeUndefined();
    expect(output.state[TARGET]?.source).toBe(previous?.source);
  });

  it.each(['missing', 'stub'])('holds back all writes for a source with a %s locale', mode => {
    const source = ENGLISH + '\n' + 'Additional instructions for configuring your store. '.repeat(20) + '\n';
    write(SOURCE, source);
    siblings(GERMAN.repeat(5));
    const missingTarget = sourceToTranslatedPath(SOURCE, 'ja');
    if (mode === 'missing') fs.unlinkSync(path.join(rootDir, missingTarget));
    else write(missingTarget, '# 短い\n');
    writeState(rootDir, { [TARGET]: { source: 'old', partial: { previous: 'Früher' } } });
    const extra = 'Weitere Anweisungen zum Einrichten Ihres Shops. '.repeat(20);
    const entries = ['de', 'fr'].map(locale => ({ ...ENTRY, locale, target: sourceToTranslatedPath(SOURCE, locale), reused: { 6: extra } }));
    const output = applyResults({ rootDir, plan: { targets: entries }, results: entries.map(entry => result(TEXTS, entry.target, entry.locale)) });
    expect(output.writes).toEqual([]);
    expect(output.report).toMatchObject({ applied: 12, files_written: [],
      sources_held_back: [SOURCE], files_incomplete: entries.map(entry => entry.target) });
    expect(output.state[TARGET].source).toBe('old');
    expect(output.state[TARGET].partial).toMatchObject({ previous: 'Früher', [mdxHash(0)]: TEXTS[0] });
    expect(output.state[entries[1].target].source).toBeUndefined();
  });

  it('considers this run\'s writes when all locales are new', () => {
    const entries = LOCALES.map(locale => ({ ...ENTRY, locale, target: sourceToTranslatedPath(SOURCE, locale) }));
    const output = applyResults({ rootDir, plan: { targets: entries }, results: entries.map(entry => result(TEXTS, entry.target, entry.locale)) });
    expect(output.writes.map(write => write.path)).toEqual(entries.map(entry => entry.target));
    expect(output.report.sources_held_back).toEqual([]);
  });
});

describe('applyResults JSON', () => {
  const source = 'i18n/en/strings.json';
  const target = 'i18n/de/strings.json';
  const english = { label: { message: 'Hello {name}, {name}: {count}', description: 'Greeting' }, short: 'API', next: 'Next page', ignored: { description: 'Keep' } };
  const entry = { ...ENTRY, target, source, kind: 'json', pending: [0, 1, 2] };
  const hash = key => unitHash(['json', key, '', typeof english[key] === 'string' ? english[key] : english[key].message].join('\0'));

  it.each([['3, 2, 2', true], ['30, 2', true], ['30, 2, 1', true], ['2, 30, 2', false], ['2, 30, 2, 1', false], ['30, 2, 2, 2', false]])('requires the source digit-run multiset in JSON: %s', (numbers, rejected) => {
    write(source, { label: 'Wait 30 seconds, then 2 seconds, then 2 seconds.' });
    const output = apply({ ...entry, pending: [0] }, [result([`Warten Sie jeweils ${numbers} Sekunden.`], target)]);
    expect(output.report.rejected_details).toEqual(rejected ? [{ target, unit: 'u0', reason: 'numbers' }] : []);
    expect(output.writes).toHaveLength(rejected ? 0 : 1);
  });

  it.each(['Brazilian Market on WooCommerce / Extra Checkout Fields for Brazil',
    'WCPOS Pro', '{authorName} - {nPosts}', 'Version: {versionLabel}', english.label.message])('accepts identical JSON with a warning: %s', name => {
    write(source, { name });
    const output = apply({ ...entry, pending: [0] }, [result([name], target)]);
    expect(JSON.parse(output.writes[0].content)).toEqual({ name });
    expect(output.report).toMatchObject({ applied: 1, rejected: 0, warnings: 1,
      warning_details: [{ target, unit: 'u0', codes: ['identical'] }] });
    expect(output.state[target].same).toEqual([unitHash(['json', 'name', '', name].join('\0'))]);
  });

  it('accepts an Arabic JSON plural without the English digit', () => {
    write(source, { label: '1 item|{count} items' });
    const target = 'i18n/ar/strings.json';
    const text = 'عنصر واحد|{count} عنصر';
    const output = apply({ ...entry, target, locale: 'ar', pending: [0] }, [result([text], target, 'ar')]);
    expect(output.report).toMatchObject({ applied: 1, rejected: 0 });
    expect(JSON.parse(output.writes[0].content)).toEqual({ label: text });
  });

  it('rebuilds messages, keeps descriptions, and accepts reordered placeholder multisets', () => {
    write(source, english);
    const output = apply(entry, [result(['{count}: Hallo {name}, {name}', 'API', 'Nächste Seite'], target)]);
    expect(JSON.parse(output.writes[0].content)).toEqual({ ...english,
      label: { ...english.label, message: '{count}: Hallo {name}, {name}' }, next: 'Nächste Seite' });
    expect(output.state[target]).toEqual({ source: 'new-blob', same: [hash('short')] });
  });

  it.each([
    ['Hallo {name}: {count}', 'placeholders'], ['Hallo {other}, {name}: {count}', 'placeholders'],
    [' ', 'empty'], ['WooCommerce POS {name}, {name}: {count}', 'WooCommerce POS'],
  ])('rejects invalid JSON translations (%s) and stores accepted partials', (text, reason) => {
    write(source, english);
    const output = apply(entry, [result([text, 'API', 'Nächste Seite'], target)]);
    expect(output.writes).toEqual([]);
    expect(output.report.rejected_details).toEqual([{ target, unit: 'u0', reason: expect.stringContaining(reason) }]);
    expect(output.state[target]).toEqual({ same: [hash('short')], partial: { [hash('short')]: 'API', [hash('next')]: 'Nächste Seite' } });
  });
});

describe('apply CLI', () => {
  it('writes translations, state, JSON and Markdown reports and prints one summary line', () => {
    siblings();
    write('input/plan.json', { targets: [ENTRY] });
    write('results/de.json', result());
    write('results/invalid.json', '{invalid');
    write('results/ignore.txt', 'not JSON');
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    runCli(['--root', rootDir, '--plan', path.join(rootDir, 'input/plan.json'),
      '--results', path.join(rootDir, 'results'), '--report', path.join(rootDir, 'reports/result.json'),
      '--report-md', path.join(rootDir, 'reports/result.md')]);
    expect(read(TARGET)).toBe(GERMAN);
    expect(readState(rootDir)[TARGET]).toEqual({ source: 'new-blob' });
    expect(JSON.parse(read('reports/result.json')).files_written).toEqual([TARGET]);
    expect(read('reports/result.md')).toContain('| de | 1 |');
    expect(stdout).toHaveBeenCalledTimes(1);
    expect(JSON.parse(stdout.mock.calls[0][0])).toEqual({ applied: 6, rejected: 0, warnings: 0, missing: 0, files: 1, incomplete: 0 });
  });

  it('treats missing result files as missing units', () => {
    write('plan.json', { targets: [ENTRY] });
    fs.mkdirSync(path.join(rootDir, 'results'));
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    runCli(['--root', rootDir, '--plan', path.join(rootDir, 'plan.json'), '--results', path.join(rootDir, 'results'),
      '--report', path.join(rootDir, 'report.json'), '--report-md', path.join(rootDir, 'report.md')]);
    expect(JSON.parse(read('report.json'))).toMatchObject({ applied: 0, missing: 6, files_written: [], files_incomplete: [TARGET] });
    expect(readState(rootDir)).toEqual({});
  });

  it.each([
    [[], '--plan is required'], [['--plan', 'plan.json'], '--results is required'],
    [['--plan', 'p', '--results', 'r'], '--report is required'],
    [['--plan', 'p', '--results', 'r', '--report', 'j'], '--report-md is required'],
    [['--plan'], 'Missing value for --plan'], [['--unknown'], 'Unknown argument: --unknown'],
  ])('rejects bad arguments %j', (args, message) => {
    expect(() => runCli(args)).toThrow(message);
  });

  it('prints argument errors to stderr and exits 2', () => {
    const output = spawnSync(process.execPath, [path.resolve(__dirname, '../docs-translation/apply.js'), '--unknown'], { encoding: 'utf8' });
    expect(output.status).toBe(2);
    expect(output.stderr).toContain('Unknown argument: --unknown');
    expect(output.stdout).toBe('');
  });
});
