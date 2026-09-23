const { parseDocsMdxUnits, applyDocsMdxTranslations } = require('../docs-translation/mdx-units');

const source = `---
title: Getting Started
sidebar_label: Start
sidebar_position: 1
slug: /getting-started
---

import Image from '@theme/IdealImage';

# Getting Started

Welcome to WCPOS.

\`POS\` stays inline.

\`\`\`php
// Do not translate code comments
function demo() {}
\`\`\`

[Open settings](/settings/store/general)

<Image alt="Receipt preview" img={require('./receipt.png')} />
`;

describe('parseDocsMdxUnits', () => {
  it('translates AccordionItem question props as visible JSX text', () => {
    const mdx = `<AccordionItem question="How do I add my store logo?">

Logos come from store settings.

</AccordionItem>
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.attr ?? '', unit.source])).toStrictEqual([
      ['jsx_attr', 'question', 'How do I add my store logo?'],
      ['paragraph', '', 'Logos come from store settings.'],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [parsed.units[0].id, 'Wie füge ich mein Shop-Logo hinzu?'],
        [parsed.units[1].id, 'Logos stammen aus den Shop-Einstellungen.'],
      ]),
    );

    expect(output).toBe(`<AccordionItem question="Wie füge ich mein Shop-Logo hinzu?">

Logos stammen aus den Shop-Einstellungen.

</AccordionItem>
`);
  });

  it('does not extract markdown table separator rows as translatable prose', () => {
    const parsed = parseDocsMdxUnits('docs/table.mdx', '| Template | Format |\n|---|---|\n| Receipt | HTML |\n');

    expect(parsed.units.map((unit) => unit.source)).toStrictEqual(['| Template | Format |', '| Receipt | HTML |']);
  });

  it('extracts only translatable docs units', () => {
    const parsed = parseDocsMdxUnits('versioned_docs/version-1.x/getting-started/index.mdx', source);
    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['frontmatter', 'Getting Started'],
      ['frontmatter', 'Start'],
      ['heading', 'Getting Started'],
      ['paragraph', 'Welcome to WCPOS.'],
      ['paragraph', '`POS` stays inline.'],
      ['paragraph', '[Open settings](/settings/store/general)'],
      ['jsx_attr', 'Receipt preview'],
    ]);
  });

  it('reassembles translated units without changing imports, code blocks, links, slugs, or image paths', () => {
    const parsed = parseDocsMdxUnits('versioned_docs/version-1.x/getting-started/index.mdx', source);
    const translations = new Map(parsed.units.map((unit) => [unit.id, `TRANSLATED:${unit.source}`]));
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toMatch(/title: TRANSLATED:Getting Started/);
    expect(output).toMatch(/sidebar_label: TRANSLATED:Start/);
    expect(output).toMatch(/slug: \/getting-started/);
    expect(output).toMatch(/import Image from '@theme\/IdealImage';/);
    expect(output).toMatch(/```php\n\/\/ Do not translate code comments\nfunction demo\(\) \{\}\n```/);
    expect(output).toMatch(/TRANSLATED:\[Open settings\]\(\/settings\/store\/general\)/);
    expect(output).toMatch(/<Image alt="TRANSLATED:Receipt preview" img=\{require\('\.\/receipt\.png'\)\} \/>/);
  });

  it('quotes translated frontmatter scalars that contain YAML-sensitive characters', () => {
    const mdx = `---
title: Getting Started
description: Short description
slug: /getting-started
---

Body text.
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);
    const title = parsed.units.find((unit) => unit.type === 'frontmatter' && unit.key === 'title');
    const description = parsed.units.find((unit) => unit.type === 'frontmatter' && unit.key === 'description');

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [title.id, 'Primeros pasos: configuración #1 "rápida"'],
        [description.id, 'Use URL: /admin # keep safe'],
      ]),
    );

    expect(output).toMatch(/^title: "Primeros pasos: configuración #1 \\\"rápida\\\""$/m);
    expect(output).toMatch(/^description: "Use URL: \/admin # keep safe"$/m);
    expect(output).toMatch(/^slug: \/getting-started$/m);
  });

  it('keeps safe plain frontmatter descriptions unquoted when translations contain punctuation allowed by YAML', () => {
    const mdx = `---
description: Configure payment methods in WCPOS including cash, card, and custom payment gateways like Stripe Terminal and SumUp.
slug: /getting-started
---

Body text.
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);
    const description = parsed.units.find((unit) => unit.type === 'frontmatter' && unit.key === 'description');

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([[description.id, 'Zahlungsmethoden in WCPOS konfigurieren, einschließlich Bargeld, Karte und Zahlungsgateways wie Stripe Terminal und SumUp.']]),
    );

    expect(output).toMatch(
      /^description: Zahlungsmethoden in WCPOS konfigurieren, einschließlich Bargeld, Karte und Zahlungsgateways wie Stripe Terminal und SumUp\.$/m,
    );
  });

  it('keeps commas and apostrophes unquoted in safe plain frontmatter scalars', () => {
    const mdx = `---
description: Short description
slug: /getting-started
---

Body text.
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);
    const description = parsed.units.find((unit) => unit.type === 'frontmatter' && unit.key === 'description');

    const output = applyDocsMdxTranslations(parsed, new Map([[description.id, "Fast checkout, for Bob's store"]]));

    expect(output).toMatch(/^description: Fast checkout, for Bob's store$/m);
  });

  it('quotes frontmatter scalars that YAML parsers would coerce', () => {
    const mdx = `---
title: Getting Started
sidebar_label: Start
description: Short description
---

Body text.
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);
    const title = parsed.units.find((unit) => unit.type === 'frontmatter' && unit.key === 'title');
    const sidebar = parsed.units.find((unit) => unit.type === 'frontmatter' && unit.key === 'sidebar_label');
    const description = parsed.units.find((unit) => unit.type === 'frontmatter' && unit.key === 'description');

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [title.id, 'yes'],
        [sidebar.id, '1e3'],
        [description.id, '.inf'],
      ]),
    );

    expect(output).toMatch(/^title: "yes"$/m);
    expect(output).toMatch(/^sidebar_label: "1e3"$/m);
    expect(output).toMatch(/^description: ".inf"$/m);
  });

  it('translates markdown list and blockquote text while preserving control markers', () => {
    const mdx = '- Install WCPOS\n1. Open settings\n> Note for admins\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['paragraph', 'Install WCPOS'],
      ['paragraph', 'Open settings'],
      ['paragraph', 'Note for admins'],
    ]);

    const translations = new Map([
      [parsed.units[0].id, 'Instalar WCPOS'],
      [parsed.units[1].id, 'Abrir ajustes'],
      [parsed.units[2].id, 'Nota para administradores'],
    ]);
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toBe('- Instalar WCPOS\n1. Abrir ajustes\n> Nota para administradores\n');
  });

  it('translates heading text while preserving markdown heading markers and explicit anchors', () => {
    const parsed = parseDocsMdxUnits('docs/example.mdx', '# Getting Started {#keep-me}\n');
    const heading = parsed.units.find((unit) => unit.type === 'heading');

    expect(heading?.source).toBe('Getting Started');

    const output = applyDocsMdxTranslations(parsed, new Map([[heading.id, 'Primeros pasos']]));

    expect(output).toBe('# Primeros pasos {#keep-me}\n');
  });

  it('preserves inline code spans while translating paragraph chunks around them', () => {
    const parsed = parseDocsMdxUnits('docs/example.mdx', 'Use `POS` mode.\n');

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([['paragraph', 'Use `POS` mode.']]);

    const translations = new Map([[parsed.units[0].id, 'Usar modo `POS`.']]);
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toBe('Usar modo `POS`.\n');
  });

  it('translates markdown link sentences as one unit so grammar can be reordered', () => {
    const parsed = parseDocsMdxUnits('docs/example.mdx', 'Create integrations using the [Custom Gateways](/payment/custom-gateways) system.\n');

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['paragraph', 'Create integrations using the [Custom Gateways](/payment/custom-gateways) system.'],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([[parsed.units[0].id, 'Créez des intégrations avec le système [Passerelles personnalisées](/payment/custom-gateways).']]),
    );

    expect(output).toBe('Créez des intégrations avec le système [Passerelles personnalisées](/payment/custom-gateways).\n');
  });

  it('translates mixed paragraph text and markdown links as one unit while preserving link destinations', () => {
    const parsed = parseDocsMdxUnits('docs/example.mdx', 'See [settings](/settings/store/general#taxes) for details.\n');

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([['paragraph', 'See [settings](/settings/store/general#taxes) for details.']]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([[parsed.units[0].id, 'Consulte [ajustes](/settings/store/general#taxes) para obtener más detalles.']]),
    );

    expect(output).toBe('Consulte [ajustes](/settings/store/general#taxes) para obtener más detalles.\n');
  });

  it('extracts a markdown link title tooltip on link-only prose lines', () => {
    const mdx = 'See [setup](/setup "English tooltip") now.\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['paragraph', 'See'],
      ['link_text', 'setup'],
      ['link_title', 'English tooltip'],
      ['paragraph', 'now.'],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [parsed.units[0].id, 'Consulte'],
        [parsed.units[1].id, 'configuración'],
        [parsed.units[2].id, 'Información en español'],
        [parsed.units[3].id, 'ahora.'],
      ]),
    );

    expect(output).toBe('Consulte [configuración](/setup "Información en español") ahora.\n');
  });

  it('translates complete sentences that combine inline code and markdown links', () => {
    const mdx =
      'Install from `WP Admin > POS > Settings > Extensions`, or download from the [GitHub releases page](https://github.com/wcpos/wcpos-atum/releases).\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      [
        'paragraph',
        'Install from `WP Admin > POS > Settings > Extensions`, or download from the [GitHub releases page](https://github.com/wcpos/wcpos-atum/releases).',
      ],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [
          parsed.units[0].id,
          'Instalar desde `WP Admin > POS > Settings > Extensions`, o descargar desde la [página de lanzamientos de GitHub](https://github.com/wcpos/wcpos-atum/releases).',
        ],
      ]),
    );

    expect(output).toBe(
      'Instalar desde `WP Admin > POS > Settings > Extensions`, o descargar desde la [página de lanzamientos de GitHub](https://github.com/wcpos/wcpos-atum/releases).\n',
    );
  });

  it('does not collapse mixed markdown link and image lines into one free-text unit', () => {
    const mdx = 'See [settings](/settings/store/general) and ![Receipt preview](./receipt.png) now.\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['paragraph', 'See'],
      ['link_text', 'settings'],
      ['paragraph', 'and'],
      ['link_text', 'Receipt preview'],
      ['paragraph', 'now.'],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [parsed.units[0].id, 'Consulte'],
        [parsed.units[1].id, 'ajustes'],
        [parsed.units[2].id, 'y'],
        [parsed.units[3].id, 'vista previa del recibo'],
        [parsed.units[4].id, 'ahora.'],
      ]),
    );

    expect(output).toBe('Consulte [ajustes](/settings/store/general) y ![vista previa del recibo](./receipt.png) ahora.\n');
  });

  it('extracts a markdown image title tooltip as a translatable unit and reassembles it', () => {
    const mdx = '![Payment Gateway settings in WCPOS.](https://wcpos.com/payment-gateways.png "An example of Payment Gateway settings in WCPOS")\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['link_text', 'Payment Gateway settings in WCPOS.'],
      ['link_title', 'An example of Payment Gateway settings in WCPOS'],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [parsed.units[0].id, 'Zahlungsgateway-Einstellungen in WCPOS.'],
        [parsed.units[1].id, 'Ein Beispiel für die Zahlungsgateway-Einstellungen in WCPOS'],
      ]),
    );

    expect(output).toBe(
      '![Zahlungsgateway-Einstellungen in WCPOS.](https://wcpos.com/payment-gateways.png "Ein Beispiel für die Zahlungsgateway-Einstellungen in WCPOS")\n',
    );
  });

  it('escapes the title delimiter when a translated image tooltip contains it', () => {
    const mdx = "![Schema](./schema.png 'A diagram')\n";
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    const titleUnit = parsed.units.find((unit) => unit.type === 'link_title');
    expect(titleUnit, 'expected a link_title unit').toBeTruthy();

    const output = applyDocsMdxTranslations(parsed, new Map([[titleUnit.id, "Un schéma de l'application"]]));

    expect(output).toBe("![Schema](./schema.png 'Un schéma de l\\'application')\n");
  });

  it('preserves multi-line import declarations without extracting continuation lines', () => {
    const mdx = `import {
  Image,
  Tabs,
} from "@theme/components";

Actual docs text.
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([['paragraph', 'Actual docs text.']]);

    const output = applyDocsMdxTranslations(parsed, new Map([[parsed.units[0].id, 'Texto real de docs.']]));

    expect(output).toBe(`import {
  Image,
  Tabs,
} from "@theme/components";

Texto real de docs.
`);
  });

  it('translates multi-line JSX alt attributes without extracting component structure or shadowing attr replacements', () => {
    const mdx = `<Image
  alt="Receipt preview"
  img={require("./receipt.png")}
/>

After image.
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['jsx_attr', 'Receipt preview'],
      ['paragraph', 'After image.'],
    ]);

    const translations = new Map([
      [parsed.units[0].id, 'Vista previa del recibo'],
      [parsed.units[1].id, 'Después de la imagen.'],
    ]);
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toBe(`<Image
  alt="Vista previa del recibo"
  img={require("./receipt.png")}
/>

Después de la imagen.
`);
  });

  it('extracts and reassembles prose inside HTML list items and inline tags', () => {
    // Regression for wcpos/docs#216: <ul><li><strong>...</strong> ...</li> prose
    // shipped untranslated because lowercase HTML content lines were treated as
    // pure JSX structure and skipped entirely.
    const mdx = `<ul>
  <li><strong>Web app</strong> — pick the Vendor.</li>
  <li>Plain item text.</li>
</ul>
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['paragraph', 'Web app'],
      ['paragraph', '— pick the Vendor.'],
      ['paragraph', 'Plain item text.'],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [parsed.units[0].id, 'App web'],
        [parsed.units[1].id, '— elige el Fabricante.'],
        [parsed.units[2].id, 'Texto de elemento simple.'],
      ]),
    );

    expect(output).toBe(`<ul>
  <li><strong>App web</strong> — elige el Fabricante.</li>
  <li>Texto de elemento simple.</li>
</ul>
`);
  });

  it('does not extract JSX expression children from structural lines', () => {
    const mdx = '<Button>{t("Pay now")}</Button>\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units).toStrictEqual([]);
  });

  it('preserves markdown-link-looking syntax inside inline code', () => {
    const mdx = 'Use `[settings](/admin#taxes)` literally.\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([['paragraph', 'Use `[settings](/admin#taxes)` literally.']]);

    const translations = new Map([[parsed.units[0].id, 'Use `[settings](/admin#taxes)` literally.']]);
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toBe(mdx);
  });

  it('does not extract markdown link text from JSX props', () => {
    const mdx = '<Card title="[Setup](/setup)" />\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units).toStrictEqual([]);
  });

  it('translates safe JSX title and description props used by docs cards', () => {
    const mdx = [
      '<FeatureCard icon="box" title="Per-Location Stock">',
      '</FeatureCard>',
      '<LinkCard',
      '  to="/extensions/atum"',
      '  title="WCPOS ATUM Integration"',
      '  description="Link WCPOS Pro stores to ATUM Multi-Inventory locations for per-location stock, pricing, and SKUs."',
      '  icon="box"',
      '/>',
      '',
    ].join('\n');
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.attr, unit.source])).toStrictEqual([
      ['jsx_attr', 'title', 'Per-Location Stock'],
      ['jsx_attr', 'title', 'WCPOS ATUM Integration'],
      ['jsx_attr', 'description', 'Link WCPOS Pro stores to ATUM Multi-Inventory locations for per-location stock, pricing, and SKUs.'],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [parsed.units[0].id, 'Bestand pro Standort'],
        [parsed.units[1].id, 'WCPOS ATUM-Integration'],
        [parsed.units[2].id, 'Verknüpfen Sie WCPOS Pro-Filialen mit ATUM Multi-Inventory-Standorten.'],
      ]),
    );

    expect(output).toMatch(/title="Bestand pro Standort"/);
    expect(output).toMatch(/title="WCPOS ATUM-Integration"/);
    expect(output.includes('description="Verknüpfen Sie WCPOS Pro-Filialen mit ATUM Multi-Inventory-Standorten."')).toBe(true);
    expect(output.includes('to="/extensions/atum"')).toBe(true);
    expect(output).toMatch(/icon="box"/);
  });

  it('translates simple JSX element text children and visible labels used by RequirementsList items', () => {
    const mdx = '<RequirementItem label="API Credentials">Appropriate API keys or credentials</RequirementItem>\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.attr, unit.source])).toStrictEqual([
      ['jsx_attr', 'label', 'API Credentials'],
      ['paragraph', undefined, 'Appropriate API keys or credentials'],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [parsed.units[0].id, 'API-Zugangsdaten'],
        [parsed.units[1].id, 'Geeignete API-Schlüssel oder Zugangsdaten'],
      ]),
    );

    expect(output).toBe('<RequirementItem label="API-Zugangsdaten">Geeignete API-Schlüssel oder Zugangsdaten</RequirementItem>\n');
  });

  it('does not translate suffix matches inside JSX attribute names', () => {
    const mdx = '<Button aria-label="Screen reader text" label="Visible label" />\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.attr, unit.source])).toStrictEqual([['jsx_attr', 'label', 'Visible label']]);

    const output = applyDocsMdxTranslations(parsed, new Map([[parsed.units[0].id, 'Sichtbares Label']]));

    expect(output).toBe('<Button aria-label="Screen reader text" label="Sichtbares Label" />\n');
  });

  it('translates JSX text children when the same text appears in an attribute', () => {
    const mdx = '<RequirementItem label="WooCommerce installed and activated">WooCommerce installed and activated</RequirementItem>\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.attr, unit.source])).toStrictEqual([
      ['jsx_attr', 'label', 'WooCommerce installed and activated'],
      ['paragraph', undefined, 'WooCommerce installed and activated'],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [parsed.units[0].id, 'WooCommerce installiert und aktiviert'],
        [parsed.units[1].id, 'WooCommerce installiert und aktiviert'],
      ]),
    );

    expect(output).toBe('<RequirementItem label="WooCommerce installiert und aktiviert">WooCommerce installiert und aktiviert</RequirementItem>\n');
  });

  it('does not duplicate JSX text children in mixed-content lines', () => {
    const mdx = 'Before <RequirementItem>Ready</RequirementItem> after.\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['paragraph', 'Before'],
      ['paragraph', 'Ready'],
      ['paragraph', 'after.'],
    ]);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [parsed.units[0].id, 'Antes'],
        [parsed.units[1].id, 'Listo'],
        [parsed.units[2].id, 'despues.'],
      ]),
    );

    expect(output).toBe('Antes <RequirementItem>Listo</RequirementItem> despues.\n');
  });

  it('preserves JSX-attribute-looking syntax inside inline code', () => {
    const mdx = 'Use `alt="Receipt preview"` in the example.\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([['paragraph', 'Use `alt="Receipt preview"` in the example.']]);

    const translations = new Map([[parsed.units[0].id, 'Use `alt="Receipt preview"` in the example.']]);
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toBe(mdx);
  });

  it('translates markdown image alt text while preserving image path and syntax', () => {
    const mdx = '![Receipt preview](./receipt.png)\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([['link_text', 'Receipt preview']]);

    const output = applyDocsMdxTranslations(parsed, new Map([[parsed.units[0].id, 'TRANSLATED:Receipt preview']]));

    expect(output).toBe('![TRANSLATED:Receipt preview](./receipt.png)\n');
  });

  it('translates mixed paragraph text and markdown image alt text while preserving image paths', () => {
    const mdx = 'See ![Receipt preview](./receipt.png) for details.\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['paragraph', 'See'],
      ['link_text', 'Receipt preview'],
      ['paragraph', 'for details.'],
    ]);

    const translations = new Map([
      [parsed.units[0].id, 'Consulte'],
      [parsed.units[1].id, 'vista previa del recibo'],
      [parsed.units[2].id, 'para obtener más detalles.'],
    ]);
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toBe('Consulte ![vista previa del recibo](./receipt.png) para obtener más detalles.\n');
  });

  it('preserves multi-backtick inline code without extracting markdown links inside it', () => {
    const mdx = 'Use ``[settings](/admin#taxes)`` literally.\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([['paragraph', 'Use ``[settings](/admin#taxes)`` literally.']]);

    const translations = new Map([[parsed.units[0].id, 'Use ``[settings](/admin#taxes)`` literally.']]);
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toBe(mdx);
  });

  it('translates JSX alt braced string expressions while preserving braces and double quotes', () => {
    const mdx = '<Image alt={"Receipt preview"} img={require("./receipt.png")} />\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([['jsx_attr', 'Receipt preview']]);

    const output = applyDocsMdxTranslations(parsed, new Map([[parsed.units[0].id, 'Vista previa del recibo']]));

    expect(output).toBe('<Image alt={"Vista previa del recibo"} img={require("./receipt.png")} />\n');
  });

  it('translates JSX alt braced string expressions while preserving braces and single quotes', () => {
    const mdx = "<Image alt={'Receipt preview'} img={require('./receipt.png')} />\n";
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([['jsx_attr', 'Receipt preview']]);

    const output = applyDocsMdxTranslations(parsed, new Map([[parsed.units[0].id, 'Vista previa del recibo']]));

    expect(output).toBe("<Image alt={'Vista previa del recibo'} img={require('./receipt.png')} />\n");
  });

  it('translates prose and alt text around inline JSX without corrupting the tag', () => {
    const mdx = 'See <Image alt="Receipt preview" img={require("./receipt.png")} /> for details.\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['paragraph', 'See'],
      ['jsx_attr', 'Receipt preview'],
      ['paragraph', 'for details.'],
    ]);

    const translations = new Map([
      [parsed.units[0].id, 'Consulte'],
      [parsed.units[1].id, 'Vista previa del recibo'],
      [parsed.units[2].id, 'para obtener más detalles.'],
    ]);
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toBe('Consulte <Image alt="Vista previa del recibo" img={require("./receipt.png")} /> para obtener más detalles.\n');
  });

  it('protects multiline lowercase HTML tags while translating safe alt text and surrounding prose', () => {
    const mdx = `Before image.

<img
  alt="Receipt preview"
  src="./receipt.png"
/>

After image.
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['paragraph', 'Before image.'],
      ['jsx_attr', 'Receipt preview'],
      ['paragraph', 'After image.'],
    ]);

    const translations = new Map([
      [parsed.units[0].id, 'Antes de la imagen.'],
      [parsed.units[1].id, 'Vista previa del recibo'],
      [parsed.units[2].id, 'Después de la imagen.'],
    ]);
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toBe(`Antes de la imagen.

<img
  alt="Vista previa del recibo"
  src="./receipt.png"
/>

Después de la imagen.
`);
  });

  it('protects lowercase inline HTML while translating surrounding prose and alt text', () => {
    const mdx = 'Use <img alt="Receipt preview" src="./receipt.png" /> here.\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([
      ['paragraph', 'Use'],
      ['jsx_attr', 'Receipt preview'],
      ['paragraph', 'here.'],
    ]);

    const translations = new Map([
      [parsed.units[0].id, 'Use'],
      [parsed.units[1].id, 'Receipt preview'],
      [parsed.units[2].id, 'here.'],
    ]);
    const output = applyDocsMdxTranslations(parsed, translations);

    expect(output).toBe(mdx);
  });

  it('keeps unchanged unit IDs stable when earlier units are inserted', () => {
    const before = parseDocsMdxUnits('docs/example.mdx', 'First paragraph.\nStable paragraph.\n');
    const after = parseDocsMdxUnits('docs/example.mdx', 'Inserted paragraph.\nFirst paragraph.\nStable paragraph.\n');
    const beforeStable = before.units.find((unit) => unit.source === 'Stable paragraph.');
    const afterStable = after.units.find((unit) => unit.source === 'Stable paragraph.');

    expect(beforeStable?.id).toBe(afterStable?.id);
  });

  it('preserves markdown link URLs containing balanced parentheses', () => {
    const mdx = 'See [settings](/foo_(bar)) now.\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => [unit.type, unit.source])).toStrictEqual([['paragraph', 'See [settings](/foo_(bar)) now.']]);

    const output = applyDocsMdxTranslations(parsed, new Map([[parsed.units[0].id, 'Consulte [ajustes](/foo_(bar)) ahora.']]));

    expect(output).toBe('Consulte [ajustes](/foo_(bar)) ahora.\n');
  });

  it('JS-escapes double quotes in JSX alt braced string expressions', () => {
    const mdx = '<Image alt={"Receipt preview"} />\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    const output = applyDocsMdxTranslations(parsed, new Map([[parsed.units[0].id, 'He said "hi"']]));

    expect(output).toBe('<Image alt={"He said \\"hi\\""} />\n');
  });

  it('JS-escapes apostrophes in JSX alt braced string expressions', () => {
    const mdx = "<Image alt={'Receipt preview'} />\n";
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    const output = applyDocsMdxTranslations(parsed, new Map([[parsed.units[0].id, "Bob's receipt"]]));

    expect(output).toBe("<Image alt={'Bob\\'s receipt'} />\n");
  });

  it('HTML-escapes quotes in quoted JSX alt attributes', () => {
    const mdx = '<Image alt="Receipt preview" />\n';
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    const output = applyDocsMdxTranslations(parsed, new Map([[parsed.units[0].id, 'He said "hi"']]));

    expect(output).toBe('<Image alt="He said &quot;hi&quot;" />\n');
  });
});

describe('parseDocsMdxUnits tilde fences', () => {
  it('does not extract or modify tilde-fenced code block contents', () => {
    const mdx = `Before fence.

~~~php
// Do not translate this code comment
echo "Hello";
~~~

After fence.
`;
    const parsed = parseDocsMdxUnits('docs/example.mdx', mdx);

    expect(parsed.units.map((unit) => unit.source)).toStrictEqual(['Before fence.', 'After fence.']);

    const output = applyDocsMdxTranslations(
      parsed,
      new Map([
        [parsed.units[0].id, 'Antes del bloque.'],
        [parsed.units[1].id, 'Después del bloque.'],
      ]),
    );

    expect(output).toBe(`Antes del bloque.

~~~php
// Do not translate this code comment
echo "Hello";
~~~

Después del bloque.
`);
  });
});
