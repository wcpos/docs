const { normalizeAdminBreadcrumbInlineCode, validateDocsMdxStructure, validateProtectedTermsInText } = require('../docs-translation/docs-qa');

const source = `---
title: Source
slug: /source
---

import Image from '@theme/IdealImage';

[Open settings](/settings)

\`inline_code\`

\`\`\`js
const value = 'same';
\`\`\`
`;

const good = `---
title: Quelle
slug: /source
---

import Image from '@theme/IdealImage';

[Ouvrir les réglages](/settings)

\`inline_code\`

\`\`\`js
const value = 'same';
\`\`\`
`;

const bad = good.replace('/settings', '/reglages').replace('inline_code', 'code_traduit');

describe('validateDocsMdxStructure', () => {
  it('accepts translations that preserve structural elements', () => {
    const issues = validateDocsMdxStructure(source, good, 'test.mdx');
    expect(issues).toStrictEqual([]);
  });

  it('reports changed URLs and inline code', () => {
    const issues = validateDocsMdxStructure(source, bad, 'test.mdx');
    expect(issues.some((issue) => issue.code === 'link_url_changed')).toBe(true);
    expect(issues.some((issue) => issue.code === 'inline_code_changed')).toBe(true);
  });

  it('reports unsafe unquoted frontmatter scalars', () => {
    const translated = good.replace('title: Quelle', 'title: Primeros pasos: configuración #1');
    const issues = validateDocsMdxStructure(source, translated, 'test.mdx');

    expect(issues.some((issue) => issue.code === 'frontmatter_yaml_unsafe')).toBe(true);
  });

  it('accepts commas and apostrophes in safe unquoted frontmatter scalars', () => {
    const translated = good.replace('title: Quelle', 'title: Bob\'s fast checkout, for stores');
    const issues = validateDocsMdxStructure(source, translated, 'test.mdx');

    expect(issues.some((issue) => issue.code === 'frontmatter_yaml_unsafe')).toBe(false);
  });

  it('reports visible source UI and marketing labels left untranslated', () => {
    const translated = `${good}
- **Any WooCommerce Gateway** - translated surrounding text
See [Checkout Settings](/settings/wp-admin/checkout).
<RequirementItem label="API Credentials">Translated surrounding text</RequirementItem>
Visible options: **ATUM Inventory**, *Default*.
Keep code untouched: ` + '`Checkout Settings` and `Default`' + `
`;
    const issues = validateDocsMdxStructure(source, translated, 'test.mdx');

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(true);
  });

  it('reports visible option labels left untranslated', () => {
    const translated = `${good}
- **ATUM Inventory** — translated surrounding text.
- *ATUM Inventory* — translated surrounding text.
- ATUM Inventory — translated surrounding text.
- *Default* — translated surrounding text.
Keep code untouched: ` + '`Default` and `ATUM Inventory`' + `
`;
    const issues = validateDocsMdxStructure(source, translated, 'test.mdx', 'ko');

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(true);
  });

  it('reports unchanged quoted English prose left untranslated', () => {
    const issues = validateDocsMdxStructure(
      'Add a tagline "Family-owned since 1987" under the store name.\n',
      'Aggiungi uno slogan "Family-owned since 1987" sotto il nome del negozio.\n',
      'test.mdx',
      'it',
    );

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(true);
  });

  it('does not report quoted protected product terms as untranslated prose', () => {
    const issues = validateDocsMdxStructure(
      'Open "Stripe Terminal" settings.\n',
      'Apri le impostazioni di "Stripe Terminal".\n',
      'test.mdx',
      'it',
    );

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(false);
  });

  it('reports quoted visible app messages left untranslated', () => {
    const issues = validateDocsMdxStructure(
      'The preview is blank or shows \'No POS orders found\'.\n',
      'L\'anteprima è vuota o mostra \'No POS orders found\'.\n',
      'test.mdx',
      'it',
    );

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(true);
  });

  it('does not report protected ATUM Inventory Management as an untranslated label', () => {
    const issues = validateDocsMdxStructure(
      'Install ATUM Inventory Management before configuring stores.\n',
      'ATUM Inventory Management 설치 후 매장을 구성합니다.\n',
      'test.mdx',
      'ko',
    );

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(false);
  });


  it('reports changed punctuation around parenthesized inline code spans', () => {
    const sourceWithParenthesizedCode = 'Check logs (`WP Admin > POS > Support > Logs`) for errors.\n';
    const translated = 'Prüfen Sie die Logs (`WP Admin > POS > Support > Logs`") auf Fehler.\n';
    const issues = validateDocsMdxStructure(sourceWithParenthesizedCode, translated, 'test.mdx');

    expect(issues.some((issue) => issue.code === 'inline_code_punctuation_changed')).toBe(true);
  });

  it('reports missing spacing between inline code spans and prose', () => {
    const sourceWithInlineCode = 'Install from `WP Admin > POS > Settings > Extensions`, or download the release.\n';
    const translated = 'Installation über `WP Admin > POS > Settings > Extensions`oder laden Sie das Release herunter.\n';
    const issues = validateDocsMdxStructure(sourceWithInlineCode, translated, 'test.mdx', 'de');

    expect(issues.some((issue) => issue.code === 'inline_code_spacing_changed')).toBe(true);
  });

  it('reports missing spacing on a line with multiple inline code spans (span-bridging regression)', () => {
    const source =
      'The same `<barcode>` syntax works in both HTML and thermal templates. Other supported types include `ean13`, `ean8`, `upca`, `pdf417`, and [everything bwip-js supports](https://example.com/bwip).\n';
    const glued =
      'La même syntaxe `<barcode>` fonctionne dans les modèles HTML et thermiques. Les autres types pris en charge incluent `ean13`, `ean8`, `upca`, `pdf417`et [tout ce que bwip-js prend en charge](https://example.com/bwip).\n';
    const spaced =
      'La même syntaxe `<barcode>` fonctionne dans les modèles HTML et thermiques. Les autres types pris en charge incluent `ean13`, `ean8`, `upca`, `pdf417` et [tout ce que bwip-js prend en charge](https://example.com/bwip).\n';

    const gluedIssues = validateDocsMdxStructure(source, glued, 'test.mdx', 'fr');
    expect(gluedIssues.some((issue) => issue.code === 'inline_code_spacing_changed')).toBe(true);

    const spacedIssues = validateDocsMdxStructure(source, spaced, 'test.mdx', 'fr');
    expect(spacedIssues.some((issue) => issue.code === 'inline_code_spacing_changed')).toBe(false);
  });

  it('distinguishes repeated inline code spans when checking spacing regressions', () => {
    const source = 'Use `API`docs with `API` docs.\n';
    const translated = 'Usa `API` docs con `API`docs.\n';
    const issues = validateDocsMdxStructure(source, translated, 'test.mdx', 'es');

    expect(issues.some((issue) => issue.code === 'inline_code_spacing_changed')).toBe(true);
  });

  it('treats CJK ideographs, Japanese kana, and Hangul adjacent to inline code as conventional', () => {
    const source = 'Supported types include `upca`, `pdf417`, and more.\n';

    const chineseGlued = '支持的类型包括 `upca`、`pdf417`以及更多。\n';
    const zhIssues = validateDocsMdxStructure(source, chineseGlued, 'test.mdx', 'zh-CN');
    expect(zhIssues.some((issue) => issue.code === 'inline_code_spacing_changed')).toBe(false);

    const koreanGlued = '지원되는 유형으로는 `upca`, `pdf417`및 더 많은 것이 있습니다.\n';
    const koIssues = validateDocsMdxStructure(source, koreanGlued, 'test.mdx', 'ko');
    expect(koIssues.some((issue) => issue.code === 'inline_code_spacing_changed')).toBe(false);

    const japaneseGlued = '対応する形式には `upca`、`pdf417`などがあります。\n';
    const jaIssues = validateDocsMdxStructure(source, japaneseGlued, 'test.mdx', 'ja');
    expect(jaIssues.some((issue) => issue.code === 'inline_code_spacing_changed')).toBe(false);
  });

  it('allows a Korean particle attached to inline code where English used a space', () => {
    const issues = validateDocsMdxStructure(
      'Use `code` in the editor.\n', '편집기의 `code`에서 작업합니다.\n', 'test.mdx', 'ko',
    );
    expect(issues.some((issue) => issue.code === 'inline_code_spacing_changed')).toBe(false);
  });

  it('still flags German prose attached to inline code where English used a space', () => {
    const issues = validateDocsMdxStructure(
      'Use `code` in the editor.\n', 'Verwenden Sie `code`in dem Editor.\n', 'test.mdx', 'de',
    );
    expect(issues.some((issue) => issue.code === 'inline_code_spacing_changed')).toBe(true);
  });

  it('allows an identical product-name column with two data rows and translated siblings', () => {
    const tableSource = [
      '| Plugin | Details |',
      '|---|---|',
      '| Wordfence | Firewall |',
      '| Really Simple Security | Security tools |',
    ].join('\n');
    const translated = [
      '| Extension | Détails |',
      '|---|---|',
      '| Wordfence | Pare-feu |',
      '| Really Simple Security | Outils de sécurité |',
    ].join('\n');
    const issues = validateDocsMdxStructure(tableSource, translated, 'test.mdx', 'fr');
    expect(issues.some((issue) => issue.code === 'untranslated_table_cell')).toBe(false);
  });

  it('still flags a wholly untranslated column of repeating values', () => {
    const tableSource = [
      '| Setting | Default |',
      '|---|---|',
      '| Print receipts | Yes |',
      '| Open drawer | No |',
      '| Email receipts | Yes |',
    ].join('\n');
    const translated = [
      '| Ajuste | Predeterminado |',
      '|---|---|',
      '| Imprimir recibos | Yes |',
      '| Abrir cajón | No |',
      '| Enviar recibos por correo | Yes |',
    ].join('\n');
    const issues = validateDocsMdxStructure(tableSource, translated, 'test.mdx', 'fr');
    const cells = issues.find((issue) => issue.code === 'untranslated_table_cell');
    expect(cells, 'expected untranslated_table_cell').toBeTruthy();
    expect(cells.message).toMatch(/Yes/);
  });

  it('does not let a ragged row turn a single unchanged cell into an identifier column', () => {
    const tableSource = [
      '| Template | Label |',
      '|---|---|',
      '| Thermal receipt | Kitchen Ticket |',
      '| Minimal receipt |',
    ].join('\n');
    const translated = [
      '| Vorlage | Beschriftung |',
      '|---|---|',
      '| Thermobeleg | Kitchen Ticket |',
      '| Minimaler Beleg |',
    ].join('\n');
    const issues = validateDocsMdxStructure(tableSource, translated, 'test.mdx', 'de');
    const cells = issues.find((issue) => issue.code === 'untranslated_table_cell');
    expect(cells, 'expected untranslated_table_cell').toBeTruthy();
    expect(cells.message).toMatch(/Kitchen Ticket/);
  });

  it('still flags a wholly untranslated two-row column of enumerated values', () => {
    const tableSource = [
      '| Setting | Default |',
      '|---|---|',
      '| Print receipts | Yes |',
      '| Open drawer | No |',
    ].join('\n');
    const translated = [
      '| Paramètre | Par défaut |',
      '|---|---|',
      '| Imprimer les reçus | Yes |',
      '| Ouvrir le tiroir | No |',
    ].join('\n');
    const issues = validateDocsMdxStructure(tableSource, translated, 'test.mdx', 'fr');
    expect(issues.some((issue) => issue.code === 'untranslated_table_cell')).toBe(true);
  });

  it('flags exactly the unchanged cell in an otherwise translated product-name column', () => {
    const tableSource = [
      '| Plugin | Details |',
      '|---|---|',
      '| Wordfence | Firewall |',
      '| Really Simple Security | Security tools |',
    ].join('\n');
    const translated = [
      '| Extension | Détails |',
      '|---|---|',
      '| Pare-feu Wordfence | Pare-feu |',
      '| Really Simple Security | Outils de sécurité |',
    ].join('\n');
    const issues = validateDocsMdxStructure(tableSource, translated, 'test.mdx', 'fr')
      .filter((issue) => issue.code === 'untranslated_table_cell');
    expect(issues.map((issue) => issue.message)).toStrictEqual([
      'Table cells were left untranslated: Really Simple Security.',
    ]);
  });

  it('still flags an identical cell in a single-data-row table', () => {
    const tableSource = '| Plugin | Details |\n|---|---|\n| Wordfence | Firewall |\n';
    const translated = '| Extension | Détails |\n|---|---|\n| Wordfence | Pare-feu |\n';
    const issues = validateDocsMdxStructure(tableSource, translated, 'test.mdx', 'fr')
      .filter((issue) => issue.code === 'untranslated_table_cell');
    expect(issues.map((issue) => issue.message)).toStrictEqual([
      'Table cells were left untranslated: Wordfence.',
    ]);
  });

  it('allows the identical Option header in German but still flags it in French', () => {
    const tableSource = '| Option | Value |\n|---|---|\n| Enabled | Yes |\n';
    const german = '| Option | Wert |\n|---|---|\n| Aktiviert | Ja |\n';
    const french = '| Option | Valeur |\n|---|---|\n| Activé | Oui |\n';
    expect(
      validateDocsMdxStructure(tableSource, german, 'test.mdx', 'de')
        .some((issue) => issue.code === 'untranslated_table_cell')
    ).toBe(false);
    const issues = validateDocsMdxStructure(tableSource, french, 'test.mdx', 'fr')
      .filter((issue) => issue.code === 'untranslated_table_cell');
    expect(issues.map((issue) => issue.message)).toStrictEqual(['Table cells were left untranslated: Option.']);
  });

  for (const [locale, word, translatedLabel] of [['de', 'Standard', 'Wert'], ['es', 'No', 'Valor']]) {
    it(`allows the evidenced ${locale} table-cell rendering ${word}`, () => {
      const tableSource = `| Label | Value |\n|---|---|\n| Value | ${word} |\n`;
      const translated = `| ${translatedLabel} | ${translatedLabel} |\n|---|---|\n| ${translatedLabel} | ${word} |\n`;
      expect(
        validateDocsMdxStructure(tableSource, translated, 'test.mdx', locale)
          .some((issue) => issue.code === 'untranslated_table_cell')
      ).toBe(false);
    });
  }

  it('keeps identifier-column exemptions local to the second table', () => {
    const tableSource = [
      '| Template | Details |',
      '|---|---|',
      '| Kitchen Ticket | Items only |',
      '| Standard Receipt | Full receipt |',
      'Available plugins:',
      '| Plugin | Details |',
      '|---|---|',
      '| Wordfence | Firewall |',
      '| Really Simple Security | Security tools |',
    ].join('\n');
    const translated = [
      '| Modèle | Détails |',
      '|---|---|',
      '| Kitchen Ticket | Articles uniquement |',
      '| Reçu standard | Reçu complet |',
      'Extensions disponibles :',
      '| Extension | Détails |',
      '|---|---|',
      '| Wordfence | Pare-feu |',
      '| Really Simple Security | Outils de sécurité |',
    ].join('\n');
    const issues = validateDocsMdxStructure(tableSource, translated, 'test.mdx', 'fr')
      .filter((issue) => issue.code === 'untranslated_table_cell');
    expect(issues.map((issue) => issue.message)).toStrictEqual(['Table cells were left untranslated: Kitchen Ticket.']);
  });

  it('flags table cells left untranslated beside translated siblings, respecting per-locale keeps', () => {
    const tableSource = [
      '| Template | Engine | Description |',
      '|---|---|---|',
      '| Standard Receipt | HTML | Default receipt |',
      '| Detailed Thermal Receipt | Thermal | Full tax invoice |',
      '| Kitchen Ticket | Thermal | Items only, no prices |',
      '',
    ].join('\n');

    // Korean leaves the template names and the engine label in English while
    // translating the rest of each row — the names must be flagged, HTML must not.
    const koreanTranslated = [
      '| 템플릿 | 엔진 | 설명 |',
      '|---|---|---|',
      '| 표준 영수증 | HTML | 기본 영수증 |',
      '| Detailed Thermal Receipt | 감열 | 전체 세금계산서 |',
      '| Kitchen Ticket | 감열 | 품목만, 가격 없음 |',
      '',
    ].join('\n');
    const koIssue = validateDocsMdxStructure(tableSource, koreanTranslated, 'test.mdx', 'ko')
      .find((issue) => issue.code === 'untranslated_table_cell');
    expect(koIssue, 'expected untranslated_table_cell for Korean').toBeTruthy();
    expect(koIssue.message).toMatch(/Detailed Thermal Receipt/);
    expect(koIssue.message).toMatch(/Kitchen Ticket/);
    expect(koIssue.message).not.toMatch(/HTML/);

    // German intentionally keeps "Engine" and "Thermal" (its feature card is
    // named "Thermal-XML"); those must NOT be flagged.
    const germanTranslated = [
      '| Vorlage | Engine | Beschreibung |',
      '|---|---|---|',
      '| Standardbeleg | HTML | Standardbeleg |',
      '| Detaillierter Thermobeleg | Thermal | Vollständige Steuerrechnung |',
      '| Küchenbon | Thermal | Nur Artikel, keine Preise |',
      '',
    ].join('\n');
    expect(
      validateDocsMdxStructure(tableSource, germanTranslated, 'test.mdx', 'de')
        .some((issue) => issue.code === 'untranslated_table_cell')
    ).toBe(false);
  });

  it('does not treat markdown-only table cell changes as translated siblings', () => {
    const tableSource = [
      '| Template | Description |',
      '|---|---|',
      '| Kitchen Ticket | Detailed Receipt |',
      '',
    ].join('\n');
    const markdownOnlyTranslated = [
      '| Template | Description |',
      '|---|---|',
      '| **Kitchen Ticket** | Detailed Receipt |',
      '',
    ].join('\n');

    expect(
      validateDocsMdxStructure(tableSource, markdownOnlyTranslated, 'test.mdx', 'es')
        .some((issue) => issue.code === 'untranslated_table_cell')
    ).toBe(false);
  });

  it('does not flag fully-translated or fully-untouched tables', () => {
    const tableSource = [
      '| Template | Engine | Description |',
      '|---|---|---|',
      '| Kitchen Ticket | Thermal | Items only |',
      '',
    ].join('\n');
    const fullyTranslated = [
      '| Plantilla | Motor | Descripción |',
      '|---|---|---|',
      '| Ticket de cocina | Térmico | Solo artículos |',
      '',
    ].join('\n');
    expect(
      validateDocsMdxStructure(tableSource, fullyTranslated, 'test.mdx', 'es')
        .some((issue) => issue.code === 'untranslated_table_cell')
    ).toBe(false);
    // Identical table (locale has not touched it) must not be flagged either.
    expect(
      validateDocsMdxStructure(tableSource, tableSource, 'test.mdx', 'es')
        .some((issue) => issue.code === 'untranslated_table_cell')
    ).toBe(false);
  });

  it('allows localized WP admin breadcrumb labels inside inline code spans', () => {
    const sourceWithAdminBreadcrumbs = [
      'Install via `WP Admin > Plugins > Add New > Upload Plugin`.',
      'Configure payments in `WP Admin > WooCommerce > Settings > Payments`.',
      'Enable checkout in `WP Admin > POS > Settings > Checkout`.',
      'Edit store settings from `POS > Stores`.',
      'Upload it through `Plugins > Add New > Upload Plugin`.',
      '',
    ].join('\n');
    const translated = [
      'Installa tramite `WP Admin > Plugin > Aggiungi Nuovo > Carica plugin`.',
      'Configura i pagamenti in `WP Admin > WooCommerce > Impostazioni > Pagamenti`.',
      'Abilita il checkout in `WP Admin > POS > Impostazioni > Pagamento`.',
      'Modifica le impostazioni del negozio da `POS > Negozi`.',
      'Caricalo tramite `Plugin > Aggiungi Nuovo > Carica plugin`.',
      '',
    ].join('\n');
    const issues = validateDocsMdxStructure(sourceWithAdminBreadcrumbs, translated, 'test.mdx', 'it');

    expect(issues.some((issue) => issue.code === 'inline_code_changed')).toBe(false);
  });

  it('allows deployed Italian and Korean admin breadcrumb label variants', () => {
    const sourceWithAdminBreadcrumbs = [
      'Install via `WP Admin > Plugins > Add New > Upload Plugin`.',
      'Configure payments in `WP Admin > WooCommerce > Settings > Payments`.',
      'Enable checkout in `WP Admin > POS > Settings > Checkout`.',
      '',
    ].join('\n');
    const italian = [
      'Installa tramite `WP Admin > Plugin > Aggiungi Nuovo > Carica plugin`.',
      'Configura i pagamenti in `WP Admin > WooCommerce > Impostazioni > Pagamenti`.',
      'Abilita il checkout in `WP Admin > POS > Impostazioni > Pagamento`.',
      '',
    ].join('\n');
    const korean = [
      '`WP Admin > 플러그인 > 새로 추가 > 플러그인 업로드`에서 설치합니다.',
      '`WP Admin > WooCommerce > 설정 > 결제`에서 구성합니다.',
      '`WP Admin > POS > 설정 > 결제`에서 활성화합니다.',
      '',
    ].join('\n');

    expect(
      validateDocsMdxStructure(sourceWithAdminBreadcrumbs, italian, 'test.mdx', 'it')
        .some((issue) => issue.code === 'inline_code_changed')
    ).toBe(false);
    expect(
      validateDocsMdxStructure(sourceWithAdminBreadcrumbs, korean, 'test.mdx', 'ko')
        .some((issue) => issue.code === 'inline_code_changed')
    ).toBe(false);
  });

  it('reports admin breadcrumbs with unrelated translated segments', () => {
    const sourceWithAdminBreadcrumbs = 'Install via `WP Admin > Plugins > Add New > Upload Plugin`.\n';
    const translated = 'Installa tramite `WP Admin > Banana > Ciao > Arrivederci`.\n';
    const issues = validateDocsMdxStructure(sourceWithAdminBreadcrumbs, translated, 'test.mdx', 'it');

    expect(issues.some((issue) => issue.code === 'inline_code_changed')).toBe(true);
  });

  it('allows localized WCPOS-rooted admin breadcrumbs', () => {
    const sourceWithAdminBreadcrumbs = 'Open `WCPOS > Dashboard`.\n';
    const translated = 'Apri `WCPOS > Bacheca`.\n';
    const issues = validateDocsMdxStructure(sourceWithAdminBreadcrumbs, translated, 'test.mdx', 'it');

    expect(issues.some((issue) => issue.code === 'inline_code_changed')).toBe(false);
  });

  it('reports English WP admin breadcrumb labels left untranslated inside inline code spans', () => {
    const sourceWithAdminBreadcrumbs = 'Install via `WP Admin > Plugins > Add New > Upload Plugin`, then open `POS > Stores` and upload through `Plugins > Add New > Upload Plugin`.\n';
    const translated = 'Installa tramite `WP Admin > Plugins > Add New > Upload Plugin`, quindi apri `POS > Stores` e caricalo tramite `Plugins > Add New > Upload Plugin`.\n';
    const issues = validateDocsMdxStructure(sourceWithAdminBreadcrumbs, translated, 'test.mdx', 'it');

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(true);
  });

  it('uses sourced Italian Checkout label', () => {
    const sourceWithAdminBreadcrumbs = 'Enable checkout in `WP Admin > POS > Settings > Checkout`.\n';
    const translated = 'Abilita il checkout in `WP Admin > POS > Impostazioni > Pagamento`.\n';
    const issues = validateDocsMdxStructure(sourceWithAdminBreadcrumbs, translated, 'test.mdx', 'it');

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(false);
  });

  it('allows English POS in Spanish admin breadcrumbs because WCPOS sources keep it as POS', () => {
    const sourceWithAdminBreadcrumbs = 'Open `POS > Stores`.\n';
    const translated = 'Abre `POS > Tiendas`.\n';
    const issues = validateDocsMdxStructure(sourceWithAdminBreadcrumbs, translated, 'test.mdx', 'es');

    expect(issues.some((issue) => issue.message.includes('POS'))).toBe(false);
  });

  it('allows Portuguese admin breadcrumb labels that are identical to English loanwords', () => {
    const sourceWithAdminBreadcrumbs = 'Install via `Plugins > Add New > Upload Plugin`.\n';
    const translated = 'Instale via `Plugins > Adicionar novo > Enviar plugin`.\n';
    const issues = validateDocsMdxStructure(sourceWithAdminBreadcrumbs, translated, 'test.mdx', 'pt-BR');

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(false);
  });

  it('allows German Plugins as a localized WordPress admin label', () => {
    const sourceWithAdminBreadcrumbs = 'Install via `WP Admin > Plugins > Add New > Upload Plugin`.\n';
    const translated = 'Installieren Sie das Plugin über `WP Admin > Plugins > Neu hinzufügen > Plugin hochladen`.\n';
    const issues = validateDocsMdxStructure(sourceWithAdminBreadcrumbs, translated, 'test.mdx', 'de');

    expect(issues.some((issue) => issue.message.includes('Plugins'))).toBe(false);
  });


  it('uses sourced WCPOS menu labels instead of guessing POS localization', () => {
    const sourceWithAdminBreadcrumbs = 'Open `WP Admin > POS > Settings`.\n';
    const spanish = 'Abre `WP Admin > POS > Configuración`.\n';
    const arabic = 'افتح `WP Admin > POS > الإعدادات`.\n';

    expect(
      validateDocsMdxStructure(sourceWithAdminBreadcrumbs, spanish, 'test.mdx', 'es')
        .some((issue) => issue.message.includes('POS'))
    ).toBe(false);
    expect(
      validateDocsMdxStructure(sourceWithAdminBreadcrumbs, arabic, 'test.mdx', 'ar')
        .some((issue) => issue.message.includes('POS'))
    ).toBe(true);
  });

  it('normalizes admin breadcrumbs to sourced locale labels before QA', () => {
    const source = '**Enable** the gateway in `WP Admin > POS > Settings > Checkout`.\n';
    const translated = '**Habilita** la pasarela en `WP Admin > TPV > Ajustes > Pago`.\n';

    expect(
      normalizeAdminBreadcrumbInlineCode(source, translated, 'es')
    ).toBe('**Habilita** la pasarela en `WP Admin > POS > Ajustes > Finalizar compra`.\n');
  });

  it('normalizes admin breadcrumbs after fenced code blocks with backticks', () => {
    const source = [
      'Example:',
      '```js',
      'const a = `x`;',
      '```',
      '**Enable** the gateway in `WP Admin > POS > Settings > Checkout`.',
      '',
    ].join('\n');
    const translated = [
      'Ejemplo:',
      '```js',
      'const a = `x`;',
      '```',
      '**Habilita** la pasarela en `WP Admin > TPV > Ajustes > Pago`.',
      '',
    ].join('\n');

    expect(
      normalizeAdminBreadcrumbInlineCode(source, translated, 'es')
    ).toBe([
      'Ejemplo:',
      '```js',
      'const a = `x`;',
      '```',
      '**Habilita** la pasarela en `WP Admin > POS > Ajustes > Finalizar compra`.',
      '',
    ].join('\n'));
  });

  it('reports English gateway link labels left untranslated', () => {
    const source = '- **[Email Invoice](./email-invoice)** - Send payment invoices by email\n';
    const translated = '- **[Email Invoice](./email-invoice)** - Envíe facturas de pago por correo electrónico\n';
    const issues = validateDocsMdxStructure(source, translated, 'test.mdx', 'es');

    expect(issues.some((issue) => issue.message.includes('Email Invoice'))).toBe(true);
  });

  it('reports informal Spanish imperative style', () => {
    const source = 'For issues, visit the GitHub repository and create an issue.\n';
    const translated = 'Para problemas, visita el repositorio de GitHub correspondiente y crea una incidencia.\n';
    const issues = validateDocsMdxStructure(source, translated, 'test.mdx', 'es');

    expect(issues.some((issue) => issue.message.includes('visita'))).toBe(true);
  });

  it('allows French Extensions as a localized admin label and rejects known POS phrasing', () => {
    const sourceWithAdminBreadcrumbs = 'Install via `WP Admin > Plugins > Add New > Upload Plugin`. Pro version required for POS checkout.\n';
    const translated = 'Installez l\'extension via `WP Admin > Extensions > Ajouter une extension > Téléverser une extension`. Version Pro requise pour le paiement POS.\n';
    const issues = validateDocsMdxStructure(sourceWithAdminBreadcrumbs, translated, 'test.mdx', 'fr');

    expect(issues.some((issue) => issue.message.includes('Extensions'))).toBe(false);
    expect(issues.some((issue) => issue.message.includes('paiement POS'))).toBe(true);
  });

  it('allows localized WP admin breadcrumbs inside parenthesized inline code spans', () => {
    const sourceWithAdminBreadcrumbs = 'Check logs (`WP Admin > POS > Settings > Stores`) before retrying.\n';
    const translated = 'Controlla i log (`WP Admin > POS > Impostazioni > Negozi`) prima di riprovare.\n';
    const issues = validateDocsMdxStructure(sourceWithAdminBreadcrumbs, translated, 'test.mdx', 'it');

    expect(issues.some((issue) => issue.code === 'inline_code_punctuation_changed')).toBe(false);
  });


  it('reports protected product terms removed from corresponding translated text', () => {
    const issues = validateProtectedTermsInText('WCPOS supports payments.', 'POS unterstützt Zahlungen.', 'test.mdx');

    expect(issues.some((issue) => issue.code === 'protected_term_removed')).toBe(true);
  });
  it('preserves ATUM Inventory Management as a product name', () => {
    const issues = validateProtectedTermsInText(
      'Install ATUM Inventory Management before configuring stores.',
      'ATUM 재고 관리를 설치한 후 매장을 구성합니다.',
      'test.mdx',
    );

    expect(issues.some((issue) => issue.code === 'protected_term_removed')).toBe(true);
  });


  it('reports known bad German glossary regressions', () => {
    const translated = `${good}
**Cash-Gateway** und **Kassierereinstellungen** in der POS.
2. Aktivieren Sie den Schalter **Enabled**.
<FeatureCard title="Per-Location Stock">translated body</FeatureCard>
Sprachauswahl pro Store und Kassierersuche mit Gateway-Template.
`;
    const issues = validateDocsMdxStructure(source, translated, 'test.mdx', 'de');

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(true);
  });

  it('does not report German glossary regressions for other locales', () => {
    const translated = `${good}
An example compares "Kassierereinstellungen" with another label.
`;
    const issues = validateDocsMdxStructure(source, translated, 'test.mdx', 'fr');

    expect(issues.some((issue) => issue.code === 'untranslated_visible_label')).toBe(false);
  });


  it('reports informal German imperative style violations', () => {
    const translated = `${good}
1. Gehe zu den Einstellungen.
2. **Stripe Terminal** — Aktiviere zunächst den Testmodus.
`;
    const issues = validateDocsMdxStructure(source, translated, 'test.mdx', 'de');

    expect(issues.some((issue) => issue.code === 'locale_style_violation')).toBe(true);
  });
});

const complexSource = [
  'import Foo, {',
  '  Bar,',
  '  Baz,',
  '} from "pkg";',
  'import type {',
  '  TypeOne,',
  '  TypeTwo,',
  '} from "types";',
  '',
  '[Docs](/guide/(advanced\\)/details "Read docs")',
  '![Receipt preview](./receipt.png "Receipt")',
  'Use ``inline ` code`` here.',
  '',
].join('\n');

const complexGood = [
  'import Foo, {',
  '  Bar,',
  '  Baz,',
  '} from "pkg";',
  'import type {',
  '  TypeOne,',
  '  TypeTwo,',
  '} from "types";',
  '',
  '[Documentation](/guide/(advanced\\)/details "Lire docs")',
  '![Aperçu du reçu](./receipt.png "Reçu")',
  'Utilisez ``inline ` code`` ici.',
  '',
].join('\n');

describe('validateDocsMdxStructure review hardening', () => {
  it('accepts changed markdown link and image titles when destinations are unchanged', () => {
    const issues = validateDocsMdxStructure(complexSource, complexGood, 'complex.mdx');
    expect(issues).toStrictEqual([]);
  });

  it('reports changed default-plus-named and type import declarations', () => {
    const changedImports = complexGood
      .replace('  Bar,', '  Barre,')
      .replace('  TypeTwo,', '  TypeDeux,');
    const issues = validateDocsMdxStructure(complexSource, changedImports, 'complex.mdx');
    expect(issues.some((issue) => issue.code === 'import_changed')).toBe(true);
  });

  it('reports changed balanced markdown link URLs and image paths', () => {
    const changedLinks = complexGood
      .replace('/guide/(advanced\\)/details', '/guide/(avance\\)/details')
      .replace('./receipt.png', './recu.png');
    const issues = validateDocsMdxStructure(complexSource, changedLinks, 'complex.mdx');
    expect(issues.some((issue) => issue.code === 'link_url_changed')).toBe(true);
  });

  it('reports changed escaped-paren markdown link URLs without relying on image path changes', () => {
    const sourceWithEscapedParen = '[Docs](/guide/(advanced\\)/details "Read docs")\n';
    const translatedWithEscapedParen = '[Docs](/guide/(avance\\)/details "Lire docs")\n';

    const issues = validateDocsMdxStructure(sourceWithEscapedParen, translatedWithEscapedParen, 'escaped-link.mdx');

    expect(issues.some((issue) => issue.code === 'link_url_changed')).toBe(true);
  });

  it('reports changed multi-backtick inline code spans', () => {
    const changedInlineCode = complexGood.replace('``inline ` code``', '``code ` traduit``');
    const issues = validateDocsMdxStructure(complexSource, changedInlineCode, 'complex.mdx');
    expect(issues.some((issue) => issue.code === 'inline_code_changed')).toBe(true);
  });

  it('reports duplicate Docusaurus heading anchor IDs in the same file', () => {
    const duplicateAnchorTranslation = [
      '---',
      'title: Test',
      '---',
      '',
      '## Fehlerbehebung {#purchase-a-license}',
      '',
      '## Lizenz erwerben {#purchase-a-license}',
      '',
    ].join('\n');
    const sourceForTest = [
      '---',
      'title: Test',
      '---',
      '',
      '## Troubleshooting',
      '',
      '## Purchase a License',
      '',
    ].join('\n');
    const issues = validateDocsMdxStructure(sourceForTest, duplicateAnchorTranslation, 'test.mdx');
    const duplicate = issues.find((issue) => issue.code === 'duplicate_heading_anchor');
    expect(duplicate, 'expected duplicate_heading_anchor issue').toBeTruthy();
    expect(duplicate.message).toMatch(/purchase-a-license/);
  });

  it('does not flag unique Docusaurus heading anchors', () => {
    const cleanTranslation = [
      '---',
      'title: Test',
      '---',
      '',
      '## Fehlerbehebung {#troubleshooting}',
      '',
      '## Lizenz erwerben {#purchase-a-license}',
      '',
    ].join('\n');
    const sourceForTest = [
      '---',
      'title: Test',
      '---',
      '',
      '## Troubleshooting',
      '',
      '## Purchase a License',
      '',
    ].join('\n');
    const issues = validateDocsMdxStructure(sourceForTest, cleanTranslation, 'test.mdx');
    expect(issues.some((issue) => issue.code === 'duplicate_heading_anchor')).toBe(false);
  });
});
