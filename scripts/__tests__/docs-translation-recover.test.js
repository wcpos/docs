const { parseDocsMdxUnits, applyDocsMdxTranslations } = require('../docs-translation/mdx-units');
const {
  decodeDocsUnitSource, unitKey, unitFingerprint, alignUnits, pairLooksRight, tableCellCount,
  recoverTranslations, STRUCTURAL_ISSUE_CODES, CJK_LOCALES,
} = require('../docs-translation/recover');

describe('decodeDocsUnitSource', () => {
  it.each([
    ['YAML double quotes', String.raw`---
title: "Fix \"X\" in C:\\docs"
---
`, 'Fix "X" in C:\\docs'],
    ['YAML single quotes', "---\ntitle: 'It''s ready'\n---\n", "It's ready"],
    ['plain YAML', '---\ntitle: Ready now\n---\n', 'Ready now'],
    ['double-quoted JSX', '<Image alt="Say &quot;hello&quot; and &#39;bye&#39;" />\n', 'Say "hello" and &#39;bye&#39;'],
    ['single-quoted JSX', "<Image alt='It&#39;s &quot;ready&quot;' />\n", "It's &quot;ready&quot;"],
    ['double-quoted markdown title', String.raw`[Link](/guide "Say \"hello\"")`, 'Say "hello"'],
    ['single-quoted markdown title', String.raw`[Link](/guide 'It\'s ready')`, "It's ready"],
    ['double-quoted JS string', String.raw`<Image alt={"Fix \"X\" in C:\\docs"} />`, 'Fix "X" in C:\\docs'],
    ['single-quoted JS string', String.raw`<Image alt={'It\'s in C:\\docs'} />`, "It's in C:\\docs"],
  ])('decodes and round-trips %s', (_name, source, expected) => {
    const parsed = parseDocsMdxUnits('docs/example.mdx', source);
    const unit = parsed.units.find((candidate) => candidate.type === 'link_title') ?? parsed.units[0];
    const decoded = decodeDocsUnitSource(parsed, unit);
    expect(decoded).toBe(expected);
    expect(applyDocsMdxTranslations(parsed, new Map([[unit.id, decoded]]))).toBe(source);
  });

  it('decodes YAML control, slash and Unicode escapes in one pass', () => {
    const source = String.raw`---
description: "Line\nTab\tSlash\/Unicode\u00e9 Literal\\n"
---
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', source);
    const decoded = decodeDocsUnitSource(parsed, parsed.units[0]);
    expect(decoded).toBe('Line\nTab\tSlash/Unicodeé Literal\\n');
    const reapplied = applyDocsMdxTranslations(parsed, new Map([[parsed.units[0].id, decoded]]));
    const reparsed = parseDocsMdxUnits('docs/example.mdx', reapplied);
    expect(decodeDocsUnitSource(reparsed, reparsed.units[0])).toBe(decoded);
  });

  it.each(['heading', 'paragraph', 'link_text'])('leaves unescaped %s text unchanged', (type) => {
    const unit = { type, source: String.raw`Keep &quot; and \" and \\`, range: { start: 0, end: 29 } };
    expect(decodeDocsUnitSource({ source: unit.source }, unit)).toBe(unit.source);
  });
});

describe('tableCellCount', () => {
  it.each([
    ['Plain text | with a pipe', 0],
    ['| First | Second | Third |', 4],
    ['  | First | Second | Third |  ', 4],
    ['| `a|b` | escaped \\| pipe | Third |', 4],
    ['| ``a`|b`` | escaped \\| pipe | Third |', 4],
    ['| ```a``|b``` | escaped \\| pipe | Third |', 4],
    ['| ````a```|b```` | escaped \\| pipe | Third |', 4],
    ['| unmatched ` code | Second | Third |', 4],
    ['| escaped \\\\| Second | Third |', 4],
  ])('counts structural pipes in %s', (text, count) => {
    expect(tableCellCount(text)).toBe(count);
  });
});

describe('unit identity', () => {
  it('keys decoded text by type, frontmatter key and attribute', () => {
    expect(unitKey({ type: 'paragraph' }, 'Hello')).toBe('paragraph\0\0\0Hello');
    expect(unitKey({ type: 'frontmatter', key: 'title' }, 'Hello')).toBe('frontmatter\0title\0\0Hello');
    expect(unitKey({ type: 'jsx_attr', attr: 'alt' }, 'Hello')).toBe('jsx_attr\0\0alt\0Hello');
  });

  it('fingerprints ordered markdown and HTML destinations, retaining duplicates', () => {
    const source = '[One](/one "title") <a href="/two">Two</a> ![Image](/image) <img src="/four" /> [Again](/one)';
    expect(unitFingerprint({ type: 'paragraph', source })).toBe(
      JSON.stringify(['paragraph', '', '', ['/one', '/two', '/image', '/four', '/one'], 0]),
    );
    expect(unitFingerprint({ type: 'frontmatter', key: 'title', source: 'Hello' })).toBe(
      JSON.stringify(['frontmatter', 'title', '', [], 0]),
    );
    expect(unitFingerprint({ type: 'jsx_attr', attr: 'alt', source: 'Image' })).toBe(
      JSON.stringify(['jsx_attr', '', 'alt', [], 0]),
    );
  });
});

describe('alignUnits', () => {
  it('pairs identical fingerprint sequences positionally, including repeated paragraphs', () => {
    const old = parseDocsMdxUnits('en.mdx', '# Start\n\nOne.\n\nTwo.\n\n# End\n').units;
    const target = parseDocsMdxUnits('es.mdx', '# Inicio\n\nUno.\n\nDos.\n\n# Fin\n').units;
    expect(alignUnits(old, target)).toEqual([[0, 0], [1, 1], [2, 2], [3, 3]]);
  });

  it('leaves all similar paragraphs unpaired after a drop, preserving unique heading anchors', () => {
    const old = parseDocsMdxUnits('en.mdx', '# [Before](/before)\n\nOne.\n\nTwo.\n\nThree.\n\n# [After](/after)\n').units;
    const target = parseDocsMdxUnits('es.mdx', '# [Antes](/before)\n\nUno.\n\nTres.\n\n# [Después](/after)\n').units;
    expect(alignUnits(old, target)).toEqual([[0, 0], [4, 3]]);
  });

  it('does not cross reordered unique paragraphs', () => {
    const old = parseDocsMdxUnits('en.mdx', '[One](/one)\n\n[Two](/two)\n').units;
    const target = parseDocsMdxUnits('es.mdx', '[Dos](/two)\n\n[Uno](/one)\n').units;
    const pairs = alignUnits(old, target);
    expect(pairs).toHaveLength(1);
    expect([[0, 1], [1, 0]]).toContainEqual(pairs[0]);
  });

  it('uses a longest increasing subsequence and pairs equal gaps recursively', () => {
    const old = parseDocsMdxUnits('en.mdx', '[A](/a)\n\nPlain.\n\n[B](/b)\n\n[C](/c)\n').units;
    const target = parseDocsMdxUnits('es.mdx', '[C](/c)\n\n[A](/a)\n\nTexto.\n\n[B](/b)\n').units;
    expect(alignUnits(old, target)).toEqual([[0, 1], [1, 2], [2, 3]]);
  });

  it('does not trim matching non-unique prefixes or suffixes', () => {
    const unit = { type: 'paragraph', source: 'Repeated.' };
    expect(alignUnits([unit, unit, unit], [unit, unit])).toEqual([]);
    expect(alignUnits([], [unit])).toEqual([]);
    expect(alignUnits([unit], [])).toEqual([]);
  });

  it('requires equal fingerprints, not just equal types, for positional matching', () => {
    const old = [{ type: 'paragraph', source: '[One](/one)' }];
    const target = [{ type: 'paragraph', source: '[Uno](/other)' }];
    expect(alignUnits(old, target)).toEqual([]);
  });
});

describe('pairLooksRight', () => {
  it.each([
    ['inline code', 'Run `start` now.', 'Ejecute `stop` ahora.'],
    ['link URL', 'Open [guide](/guide).', 'Abra [guía](/other).'],
    ['number', 'Wait 30 days.', 'Espere 10 días.'],
    ['digit multiplicity', 'Wait 10 then 10 days.', 'Espere 10 días.'],
    ['empty text', 'Hello.', ' \t\n'],
    ['length blow-up', 'a'.repeat(40), 'b'.repeat(200)],
    ['protected term', 'Open WooCommerce.', 'Abra la tienda.'],
    ['code block', '```js\nx();\n```', '```js\ny();\n```'],
    ['import', 'import X from "x";', 'import X from "y";'],
    ['inline code punctuation', 'Choose (`start`) now.', 'Elija `start` ahora.'],
    ['inline code spacing', 'Run `start` now.', 'Ejecute`start`ahora.'],
  ])('rejects changed %s', (_name, source, translation) => {
    expect(pairLooksRight({ source, translation, locale: 'es', file: 'es.mdx' })).toBe(false);
  });

  it('accepts a translation with the same links, code and numbers', () => {
    expect(pairLooksRight({
      source: 'Run `start` and read [the guide](/guide) within 30 days.',
      translation: 'Ejecute `start` y lea [la guía](/guide) en 30 días.',
      locale: 'es', file: 'es.mdx',
    })).toBe(true);
  });

  it('compares digit runs as multisets, allowing a different order', () => {
    expect(pairLooksRight({ source: '10 then 20.', translation: '20 después de 10.', locale: 'es', file: 'es.mdx' })).toBe(true);
  });

  it.each([
    ['es', 12, true], ['es', 11, false], ['es', 120, true], ['es', 121, false],
    ['ja', 4, true], ['ja', 3, false], ['ko', 80, true], ['ko', 81, false],
    ['zh-CN', 4, true], ['zh-CN', 81, false],
  ])('checks length boundaries for %s at %i characters', (locale, length, expected) => {
    expect(pairLooksRight({ source: 'a'.repeat(40), translation: '文'.repeat(length), locale, file: 'doc.mdx' })).toBe(expected);
  });

  it('does not apply the length ratio to short source strings', () => {
    expect(pairLooksRight({ source: 'a'.repeat(39), translation: 'b'.repeat(200), locale: 'es', file: 'es.mdx' })).toBe(true);
  });

  it('exports the specified sets', () => {
    expect([...CJK_LOCALES]).toEqual(['ja', 'ko', 'zh-CN']);
    expect([...STRUCTURAL_ISSUE_CODES]).toEqual([
      'code_block_changed', 'import_changed', 'link_url_changed', 'inline_code_changed',
      'inline_code_punctuation_changed', 'inline_code_spacing_changed', 'protected_term_removed',
    ]);
  });
});

describe('recoverTranslations', () => {
  it.each([false, true])('requires matching table shape even for a unique URL (row: %s)', (isRow) => {
    const source = "| **Exclude sale items** | Skips items already on sale (and any line where a cashier has lowered the price at the till — see [POS price overrides](/pos/cart/discounts#how-pos-price-changes-interact-with-coupons)) | Clearance items don't get the extra discount |";
    const prose = '**استثناء المنتجات المخفَّضة** — يتم تخطي المنتجات المعروضة للبيع بسعر مخفَّض (وأي بند قام أمين الصندوق بتخفيض سعره عند نقطة البيع — انظر [تعديلات أسعار نقطة البيع](/pos/cart/discounts#how-pos-price-changes-interact-with-coupons)).';
    const row = '| **استثناء المنتجات المخفَّضة** | يتم تخطي المنتجات المعروضة للبيع بسعر مخفَّض (وأي بند قام أمين الصندوق بتخفيض سعره عند نقطة البيع — انظر [تعديلات أسعار نقطة البيع](/pos/cart/discounts#how-pos-price-changes-interact-with-coupons)) | لا تحصل منتجات التصفية على الخصم الإضافي |';
    const translation = isRow ? row : prose;
    expect(pairLooksRight({ source, translation, locale: 'ar', file: 'ar.mdx' })).toBe(isRow);
    const result = recoverTranslations({
      file: 'ar.mdx', locale: 'ar', oldEnglishPath: 'en.mdx', oldEnglish: source, target: translation,
    });
    expect(result).toEqual({
      translations: new Map(isRow ? [[unitKey({ type: 'paragraph' }, source), row]] : []),
      paired: isRow ? 1 : 0, rejected: 0, unpairedTarget: isRow ? 0 : 1,
    });
  });

  it('recovers decoded frontmatter, headings, paragraphs and JSX end to end', () => {
    const oldEnglish = String.raw`---
title: "Fix \"X\""
description: "Setup guide"
---
# Start

Run ` + '`start`' + String.raw` in 30 days.

<Card title="Say &quot;hello&quot;" label={'It\'s ready'} />

Wait 10 days.
`;
    const target = String.raw`---
title: "Arreglar \"X\""
description: "Guía de instalación"
---
# Inicio

Ejecute ` + '`start`' + String.raw` en 30 días.

<Card title="Diga &quot;hola&quot;" label={'Está listo'} />

Espere 20 días.
`;
    const result = recoverTranslations({ file: 'es.mdx', locale: 'es', oldEnglishPath: 'en.mdx', oldEnglish, target });
    expect(result.paired).toBe(6);
    expect(result.rejected).toBe(1);
    expect(result.unpairedTarget).toBe(0);
    const parsed = parseDocsMdxUnits('en.mdx', oldEnglish);
    const expected = ['Arreglar "X"', 'Guía de instalación', 'Inicio', 'Ejecute `start` en 30 días.', 'Diga "hola"', 'Está listo'];
    expect(result.translations).toEqual(new Map(parsed.units.slice(0, 6).map((unit, index) => [
      unitKey(unit, decodeDocsUnitSource(parsed, unit)), expected[index],
    ])));
    const applied = applyDocsMdxTranslations(parsed, new Map(parsed.units.slice(0, 6).map((unit, index) => [unit.id, expected[index]])));
    expect(applied).toBe(target.replace('Espere 20 días.', 'Wait 10 days.'));
  });

  it('keeps the first accepted value for repeated keys while counting every accepted pair', () => {
    const result = recoverTranslations({
      file: 'es.mdx', locale: 'es', oldEnglishPath: 'en.mdx',
      oldEnglish: 'Hello.\n\nHello.\n', target: 'Hola.\n\nSaludos.\n',
    });
    expect(result).toEqual({ translations: new Map([['paragraph\0\0\0Hello.', 'Hola.']]), paired: 2, rejected: 0, unpairedTarget: 0 });
  });

  it('does not count unaligned units as rejected pairs', () => {
    const result = recoverTranslations({
      file: 'es.mdx', locale: 'es', oldEnglishPath: 'en.mdx',
      oldEnglish: 'One.\n\nTwo.\n\nThree.\n', target: 'Uno.\n\nTres.\n',
    });
    expect(result).toEqual({ translations: new Map(), paired: 0, rejected: 0, unpairedTarget: 2 });
  });

  it('counts an extra translated paragraph independently of accepted and rejected pairs', () => {
    const result = recoverTranslations({
      file: 'es.mdx', locale: 'es', oldEnglishPath: 'en.mdx',
      oldEnglish: '# Start\n\nRead [help](/help).\n', target: '# Inicio\n\nLea [ayuda](/help).\n\nTexto adicional.\n',
    });
    expect(result).toMatchObject({ paired: 2, rejected: 0, unpairedTarget: 1 });
  });
});
