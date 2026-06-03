const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  getSourcePath,
  sourceToTranslatedPath,
  localeOf,
  lineToProse,
  isSignificantProse,
  findUntranslatedProps,
  findLeftoverProse,
  headingAnchors,
  findMissingSections,
  isStub,
  listIncompleteSources,
  buildTranslationAudit,
  LOCALES,
  main,
} = require('../check-translation-completeness');

describe('path mapping', () => {
  it('maps a versioned translation path to its English source', () => {
    expect(
      getSourcePath('i18n/de/docusaurus-plugin-content-docs/version-1.x/templates/customise.mdx')
    ).toBe('versioned_docs/version-1.x/templates/customise.mdx');
  });

  it('maps a current translation path to docs/', () => {
    expect(
      getSourcePath('i18n/ko/docusaurus-plugin-content-docs/current/getting-started/index.mdx')
    ).toBe('docs/getting-started/index.mdx');
  });

  it('round-trips source -> translated', () => {
    const src = 'versioned_docs/version-1.x/stores/setup.mdx';
    expect(sourceToTranslatedPath(src, 'zh-CN')).toBe(
      'i18n/zh-CN/docusaurus-plugin-content-docs/version-1.x/stores/setup.mdx'
    );
  });

  it('extracts the locale', () => {
    expect(localeOf('i18n/pt-BR/docusaurus-plugin-content-docs/version-1.x/x.mdx')).toBe('pt-BR');
  });
});

describe('lineToProse', () => {
  it('extracts the value of a user-facing JSX prop', () => {
    expect(lineToProse('  <AccordionItem question="How do I delete a store?">')).toContain(
      'How do I delete a store?'
    );
  });

  it('extracts image caption text but drops the tags', () => {
    const p = lineToProse('<p class="image-caption">Checkout Settings in the Checkout Modal</p>');
    expect(p).toBe('Checkout Settings in the Checkout Modal');
  });

  it('drops inline code, links targets and technical attributes', () => {
    const p = lineToProse('- See [Reports](/reports) and run `wp pos sync` on `wp-admin`');
    expect(p).not.toContain('/reports');
    expect(p).not.toContain('wp pos sync');
    expect(p).toContain('See');
    expect(p).toContain('Reports');
  });
});

describe('isSignificantProse', () => {
  it('accepts a real multi-word phrase', () => {
    expect(isSignificantProse('How do I add my store logo')).toBe(true);
  });

  it('rejects a single hyphenated identifier (no whitespace)', () => {
    expect(isSignificantProse('wp-emoji-styles')).toBe(false);
    expect(isSignificantProse('classic-theme-styles')).toBe(false);
  });

  it('rejects single words', () => {
    expect(isSignificantProse('Checkout')).toBe(false);
  });
});

describe('findUntranslatedProps', () => {
  const source = `import AccordionItem from 'x';

<AccordionItem question="How do I delete a store?">
<Image alt="Tax settings screen" img="/x.png" />
`;

  it('flags a prop value left identical to the English source', () => {
    const translated = `import AccordionItem from 'x';

<AccordionItem question="How do I delete a store?">
<Image alt="Pantalla de ajustes de impuestos" img="/x.png" />
`;
    const hits = findUntranslatedProps(source, translated);
    expect(hits).toContain('question="How do I delete a store?"');
    expect(hits).not.toContain('alt="Pantalla de ajustes de impuestos"');
  });

  it('passes when every prop value is translated', () => {
    const translated = `import AccordionItem from 'x';

<AccordionItem question="¿Cómo elimino una tienda?">
<Image alt="Pantalla de ajustes de impuestos" img="/x.png" />
`;
    expect(findUntranslatedProps(source, translated)).toHaveLength(0);
  });

  it('does not flag a technical prop (img/to) that must stay identical', () => {
    const translated = `<Image alt="captura" img="/x.png" />`;
    expect(findUntranslatedProps('<Image alt="screenshot" img="/x.png" />', translated)).toHaveLength(0);
  });

  it('flags a CommonMark image title tooltip left identical to the English source', () => {
    const src = '![Payment gateways](/x.png "An example of Payment Gateway settings in WCPOS")\n';
    const translated = '![Pasarelas de pago](/x.png "An example of Payment Gateway settings in WCPOS")\n';
    expect(findUntranslatedProps(src, translated)).toContain(
      'title="An example of Payment Gateway settings in WCPOS"',
    );
  });

  it('passes when the CommonMark image title tooltip is translated', () => {
    const src = '![Payment gateways](/x.png "An example of Payment Gateway settings in WCPOS")\n';
    const translated =
      '![Pasarelas de pago](/x.png "Un ejemplo de la configuración de pasarelas de pago en WCPOS")\n';
    expect(findUntranslatedProps(src, translated)).toHaveLength(0);
  });

  it('flags a parenthesized CommonMark title tooltip left identical to the English source', () => {
    const src = '[Payment gateways](/x.png (An example of Payment Gateway settings in WCPOS))\n';
    const translated = '[Pasarelas de pago](/x.png (An example of Payment Gateway settings in WCPOS))\n';
    expect(findUntranslatedProps(src, translated)).toContain(
      'title="An example of Payment Gateway settings in WCPOS"',
    );
  });

  it('passes when the parenthesized CommonMark title tooltip is translated', () => {
    const src = '[Payment gateways](/x.png (An example of Payment Gateway settings in WCPOS))\n';
    const translated =
      '[Pasarelas de pago](/x.png (Un ejemplo de la configuración de pasarelas de pago en WCPOS))\n';
    expect(findUntranslatedProps(src, translated)).toHaveLength(0);
  });

  it('does not flag allowlisted product/platform labels (prop or title), but still flags real leaks', () => {
    const src =
      '<DownloadButton label="Mac (Apple Silicon)" />\n\n![iOS build](/y.png "iOS (TestFlight)")\n\n<AccordionItem question="How do I install it?">\n';
    const hits = findUntranslatedProps(src, src);
    expect(hits).not.toContain('label="Mac (Apple Silicon)"'); // allowlisted — kept on purpose
    expect(hits).not.toContain('title="iOS (TestFlight)"'); // allowlisted — kept on purpose
    expect(hits).toContain('question="How do I install it?"'); // genuine leak — still flagged
  });
});

describe('findLeftoverProse', () => {
  const source = `The Checkout Settings page controls payment gateways.

Each gateway can be enabled or disabled for the POS.
`;

  it('flags a paragraph left in English', () => {
    const translated = `Die Checkout-Einstellungsseite steuert Zahlungsgateways.

Each gateway can be enabled or disabled for the POS.
`;
    const hits = findLeftoverProse(source, translated);
    expect(hits.some((h) => h.includes('Each gateway can be enabled or disabled'))).toBe(true);
  });

  it('passes a fully translated document', () => {
    const translated = `Die Checkout-Einstellungsseite steuert Zahlungsgateways.

Jedes Gateway kann für das POS aktiviert oder deaktiviert werden.
`;
    expect(findLeftoverProse(source, translated)).toHaveLength(0);
  });
});

describe('findMissingSections (stale detection)', () => {
  const en = [
    '---', 'title: Tax', '---', '',
    '## Display settings {#display-settings}', 'Body.', '',
    '## Troubleshooting {#troubleshooting}', 'Newly added section.', '',
    '### Tax is zero {#tax-is-zero}', 'More.', '',
  ].join('\n');

  it('flags anchors the source has but the translation lacks', () => {
    const stale = [
      '---', 'title: Impuestos', '---', '',
      '## Ajustes de visualización {#display-settings}', 'Cuerpo.', '',
    ].join('\n');
    expect(findMissingSections(en, stale).sort()).toEqual(['tax-is-zero', 'troubleshooting']);
  });

  it('returns nothing when the translation has every source anchor', () => {
    const fresh = [
      '## Ajustes {#display-settings}', '',
      '## Resolución {#troubleshooting}', '',
      '### Cero {#tax-is-zero}', '',
    ].join('\n');
    expect(findMissingSections(en, fresh)).toEqual([]);
  });

  it('does not flag a renamed anchor when no section was dropped (no net deficit)', () => {
    // EN `## F.A.Q. {#faq}` but the translated heading auto-slugs to {#f-a-q}.
    // Same number of headings → the section exists, it is not stale.
    const enFaq = ['## Intro {#intro}', '', '## F.A.Q. {#faq}', ''].join('\n');
    const trRenamed = ['## Introducción {#intro}', '', '## Preguntas {#f-a-q}', ''].join('\n');
    expect(findMissingSections(enFaq, trRenamed)).toEqual([]);
  });

  it('ignores extra anchors the translation adds (no false positive, no sweep loop)', () => {
    const extra = [
      '## Ajustes {#display-settings}', '',
      '## Resolución {#troubleshooting}', '',
      '### Cero {#tax-is-zero}', '',
      '## Encabezado traducido {#extra-local-anchor}', '',
    ].join('\n');
    expect(findMissingSections(en, extra)).toEqual([]);
  });

  it('does not count anchors inside code fences', () => {
    const source = ['## Real {#real}', '', '```', 'text {#fenced}', '```', ''].join('\n');
    expect([...headingAnchors(source)]).toEqual(['real']);
  });

  it('does not let inline Mustache examples mask a missing heading anchor', () => {
    const source = ['## Intro {#intro}', '', '## lines {#lines}', 'Line item details.', ''].join('\n');
    const translated = [
      '## Intro {#intro}', '',
      'Loop with `{{#lines}}...{{/lines}}`.',
      '',
    ].join('\n');

    expect(findMissingSections(source, translated)).toEqual(['lines']);
  });

  it('returns nothing when the source has no anchors', () => {
    expect(findMissingSections('# Plain\n\nNo anchors here.', 'anything')).toEqual([]);
  });
});

describe('isStub', () => {
  const longSource = 'A fairly long English source document. '.repeat(40); // > 600 chars

  it('flags a "coming soon" stub', () => {
    expect(isStub(longSource, '---\ntitle: x\n---\n\n敬请期待...\n', 'zh-CN')).toBe(true);
  });

  it('does not flag a full translation', () => {
    const full = 'Ein ziemlich langes deutsches Quelldokument. '.repeat(40);
    expect(isStub(longSource, full, 'de')).toBe(false);
  });

  it('ignores short source files (index/stub pages)', () => {
    expect(isStub('Tiny source.', '小', 'zh-CN')).toBe(false);
  });
});

describe('main', () => {
  it('reports dropped locales when a changed translation path was deleted', () => {
    const cwd = process.cwd();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-check-'));
    const sourcePath = 'docs/foo.mdx';
    const deletedPath = 'i18n/de/docusaurus-plugin-content-docs/current/foo.mdx';
    const presentPath = 'i18n/es/docusaurus-plugin-content-docs/current/foo.mdx';
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      process.chdir(tmp);
      fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
      fs.mkdirSync(path.dirname(presentPath), { recursive: true });
      fs.writeFileSync(sourcePath, 'The Checkout Settings page controls payment gateways.\n');
      fs.writeFileSync(presentPath, 'La pagina de ajustes controla las pasarelas de pago.\n');

      expect(main([deletedPath])).toBe(1);
      expect(error.mock.calls.flat().join('\n')).toContain('missing/stub in:');
    } finally {
      process.chdir(cwd);
      log.mockRestore();
      error.mockRestore();
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('listIncompleteSources (self-healing sweep input)', () => {
  const source = 'versioned_docs/version-1.x/support/translations.mdx';

  it('flags a source missing in at least one locale', () => {
    const present = new Set([
      source,
      sourceToTranslatedPath(source, 'de'),
      sourceToTranslatedPath(source, 'es'),
      // nl (and the other locales) intentionally absent — the nl-backlog case
    ]);
    const result = listIncompleteSources({
      sources: [source],
      existsSync: (p) => present.has(p),
      readFile: () => 'x'.repeat(50),
    });
    expect(result.map((r) => r.source)).toContain(source);
    expect(result[0].gaps).toContain('nl');
  });

  it('does not flag a source translated in every locale', () => {
    const present = new Set([source, ...LOCALES.map((l) => sourceToTranslatedPath(source, l))]);
    const result = listIncompleteSources({
      sources: [source],
      existsSync: (p) => present.has(p),
      readFile: () => 'x'.repeat(50),
    });
    expect(result).toEqual([]);
  });

  it('flags a stubbed translation as a gap', () => {
    const present = new Set([source, ...LOCALES.map((l) => sourceToTranslatedPath(source, l))]);
    const longSource = 'A'.repeat(2000);
    const result = listIncompleteSources({
      sources: [source],
      existsSync: (p) => present.has(p),
      // every translation is a tiny stub relative to a long source
      readFile: (p) => (p === source ? longSource : 'short'),
    });
    expect(result.map((r) => r.source)).toContain(source);
    expect(result[0].gaps.some((g) => g.includes('(stub)'))).toBe(true);
  });

  it('flags a stale translation (missing a section the source has) as a gap', () => {
    const present = new Set([source, ...LOCALES.map((l) => sourceToTranslatedPath(source, l))]);
    const enSource = [
      '## Uno {#one}', 'x'.repeat(400), '', '## Dos {#two}', 'y'.repeat(400), '',
    ].join('\n');
    // de is a faithful but stale translation missing the {#two} section; the rest are current.
    const stale = ['## Uno {#one}', 'x'.repeat(400), ''].join('\n');
    const result = listIncompleteSources({
      sources: [source],
      existsSync: (p) => present.has(p),
      readFile: (p) =>
        p === source ? enSource : p === sourceToTranslatedPath(source, 'de') ? stale : enSource,
    });
    expect(result.map((r) => r.source)).toContain(source);
    expect(result[0].gaps).toContain('de (stale)');
  });
});


describe('buildTranslationAudit', () => {
  const source = 'versioned_docs/version-1.x/foo.mdx';

  it('returns locale-scoped repair targets for missing, stub, and English leftovers', () => {
    const files = new Map();
    files.set(source, 'The Checkout Settings page controls payment gateways.\n\nEach gateway can be enabled or disabled for the POS.\n\nCash Gateway remains enabled.\n'.repeat(20));
    files.set(sourceToTranslatedPath(source, 'es'), 'La página de ajustes controla las pasarelas de pago.\n'.repeat(20));
    files.set(sourceToTranslatedPath(source, 'de'), 'The Checkout Settings page controls payment gateways.\n\nEach gateway can be enabled or disabled for the POS.\n\nCash Gateway remains enabled.\n'.repeat(20));
    files.set(sourceToTranslatedPath(source, 'ja'), '短い');

    const audit = buildTranslationAudit({
      sources: [source],
      locales: ['es', 'de', 'nl', 'ja'],
      existsSync: (p) => files.has(p),
      readFile: (p) => files.get(p),
    });

    expect(audit).toEqual([
      {
        source,
        locales: {
          de: ['english_prose'],
          nl: ['missing'],
          ja: ['stub'],
        },
      },
    ]);
  });

  it('reports a stale translation (missing a source section) as a repair target', () => {
    const files = new Map();
    const enSource = [
      '## Intro {#intro}', 'A'.repeat(400), '',
      '## Troubleshooting {#troubleshooting}', 'B'.repeat(400), '',
    ].join('\n');
    files.set(source, enSource);
    // es is current; de is a faithful translation of an older revision missing {#troubleshooting}.
    files.set(sourceToTranslatedPath(source, 'es'), enSource);
    files.set(sourceToTranslatedPath(source, 'de'), ['## Einführung {#intro}', 'A'.repeat(400), ''].join('\n'));

    const audit = buildTranslationAudit({
      sources: [source],
      locales: ['es', 'de'],
      existsSync: (p) => files.has(p),
      readFile: (p) => files.get(p),
    });

    expect(audit).toEqual([{ source, locales: { de: ['stale'] } }]);
  });

  it('reports missing JSON chrome files as repair targets', () => {
    const audit = buildTranslationAudit({
      sources: [],
      jsonSources: ['i18n/en/docusaurus-theme-classic/navbar.json'],
      locales: ['es', 'nl'],
      existsSync: (p) => p === 'i18n/en/docusaurus-theme-classic/navbar.json' || p === 'i18n/es/docusaurus-theme-classic/navbar.json',
      readFile: () => '{}',
    });

    expect(audit).toEqual([
      {
        source: 'i18n/en/docusaurus-theme-classic/navbar.json',
        locales: {
          nl: ['missing_json'],
        },
      },
    ]);
  });

  it('does not report allowlisted JSX prop values as English prose leaks', () => {
    const files = new Map();
    files.set(
      source,
      '<Button label="iOS (TestFlight)" />\n<Button label="Android (Beta)" />\n<Button label="Mac (Intel)" />\n<Button label="Mac (Apple Silicon)" />\n',
    );
    files.set(sourceToTranslatedPath(source, 'es'), files.get(source));

    const audit = buildTranslationAudit({
      sources: [source],
      locales: ['es'],
      existsSync: (p) => files.has(p),
      readFile: (p) => files.get(p),
    });

    expect(audit).toEqual([]);
  });
});
