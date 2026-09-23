const {
  docusaurusSlug,
  applyStableHeadingAnchorsFromSource,
  missingPreservedHeadingAnchors,
  restoreNonBreadcrumbInlineCodeSpans,
} = require('../docs-translation/heading-anchors');

describe('docusaurusSlug mirrors github-slugger (Docusaurus heading IDs)', () => {
  // Each pair is a real heading → the anchor `docusaurus write-heading-ids`
  // produced for it in the wcpos/docs corpus. The point of these is the
  // punctuation rules the old slugger got wrong: apostrophes/slashes/dots are
  // dropped *without* leaving a hyphen, underscores survive, and runs of
  // separators are never collapsed.
  const cases = [
    // Apostrophe dropped, not turned into a hyphen — this was the bug that
    // broke the printer-setup anchor and summoned Ada.
    ["Finding Your Printer's IP Address", 'finding-your-printers-ip-address'],
    // Underscores are valid slug characters and must be preserved.
    ['tax and tax_summary', 'tax-and-tax_summary'],
    // Slash inside a token vanishes without splitting the word.
    ['ESC/POS punctuation normalisation', 'escpos-punctuation-normalisation'],
    // "&" is dropped (not expanded to "and"); the surrounding spaces each become
    // a hyphen and are NOT collapsed.
    ['Search & Filters', 'search--filters'],
    // Em dash → dropped, leaving the two flanking spaces as a double hyphen.
    ['Option 1 — Pick a different template', 'option-1--pick-a-different-template'],
    // Markdown links slug to their visible text, not the URL.
    ['[Checkout Performance](/support/performance/checkout)', 'checkout-performance'],
    ['[Foo](/docs/feature_(new)_guide)', 'foo'],
    // Repeated punctuation collapses to nothing, no stray hyphens.
    ['F.A.Q.', 'faq'],
  ];

  for (const [heading, expected] of cases) {
    it(`${JSON.stringify(heading)} -> ${expected}`, () => {
      expect(docusaurusSlug(heading)).toBe(expected);
    });
  }
});

describe('heading anchor and inline code helpers', () => {
  it('restores non-breadcrumb inline code spans while preserving localized breadcrumbs', () => {
    const source = 'Use `{{order.number}}` in `Settings > Stores` and `WP Admin>Plugins>Settings`, then keep `totals.total_display`.';
    const translated = 'Utilisez `{{commande.numéro}}` dans `Réglages > Boutiques` et `Admin WP>Extensions>Réglages`, puis gardez `totaux.total_affichage`.';

    expect(restoreNonBreadcrumbInlineCodeSpans(source, translated)).toBe(
      'Utilisez `{{order.number}}` dans `Réglages > Boutiques` et `Admin WP>Extensions>Réglages`, puis gardez `totals.total_display`.',
    );
  });

  it('restores delimiter-aware inline code spans containing backticks', () => {
    const source = 'Keep ``literal `tick` value`` and `checkout.id`.';
    const translated = 'Gardez ``littéral `tic` valeur`` et `paiement.identifiant`.';

    expect(restoreNonBreadcrumbInlineCodeSpans(source, translated)).toBe('Gardez ``literal `tick` value`` et `checkout.id`.');
  });

  it('adds stable English-source Docusaurus anchors to translated headings', () => {
    const source = ['## Default Payment Methods', '### Cash', '## Custom Gateways', ''].join('\n');
    const translated = ['## Standard-Zahlungsmethoden', '### Bargeld', '## Benutzerdefinierte Gateways', ''].join('\n');

    expect(applyStableHeadingAnchorsFromSource(source, translated)).toBe(
      ['## Standard-Zahlungsmethoden {#default-payment-methods}', '### Bargeld {#cash}', '## Benutzerdefinierte Gateways {#custom-gateways}', ''].join('\n'),
    );
  });

  it('preserves existing localized Docusaurus heading anchors by heading position', () => {
    const source = [
      '## Performance Categories',
      '### [Checkout Performance](/support/performance/checkout)',
      '### [Server Performance](/support/performance/server)',
      '',
    ].join('\n');
    // Real Docusaurus anchors slug only the link text, so a heading like
    // `[Checkout Performance](/support/performance/checkout)` yields
    // {#checkout-performance} — not the URL-contaminated slug the old slugger
    // emitted. These positionally-stable anchors must be preserved verbatim.
    const existingTarget = [
      '## Leistungskategorien {#performance-categories}',
      '### [Checkout-Leistung](/support/performance/checkout) {#checkout-performance}',
      '### [Server-Leistung](/support/performance/server) {#server-performance}',
      '',
    ].join('\n');
    const translated = [
      '## Leistungskategorien',
      '### [Checkout-Leistung](/support/performance/checkout)',
      '### [Server-Leistung](/support/performance/server)',
      '',
    ].join('\n');

    expect(applyStableHeadingAnchorsFromSource(source, translated, existingTarget)).toBe(existingTarget);
  });

  it('does not add stable heading anchors inside fenced code blocks', () => {
    const source = ['## Real Heading', '```md', '## Example Heading', '```', '## Next Heading', ''].join('\n');
    const translated = ['## Echte Ueberschrift', '```md', '## Beispielueberschrift', '```', '## Naechste Ueberschrift', ''].join('\n');

    expect(applyStableHeadingAnchorsFromSource(source, translated)).toBe(
      ['## Echte Ueberschrift {#real-heading}', '```md', '## Beispielueberschrift', '```', '## Naechste Ueberschrift {#next-heading}', ''].join('\n'),
    );
  });

  it('overwrites a stale existingTarget anchor that was borrowed from a different source heading', () => {
    // Regression for wcpos/docs PR #190: an earlier buggy commit assigned
    // {#purchase-a-license} to the Troubleshooting heading. Subsequent runs
    // must NOT propagate that bad anchor — they must recompute from source.
    const source = ['## Troubleshooting', '', '## Purchase a License', ''].join('\n');
    const existingTarget = ['## Fehlerbehebung {#purchase-a-license}', '', '## Lizenz erwerben {#purchase-a-license}', ''].join('\n');
    const translated = ['## Fehlerbehebung', '', '## Lizenz erwerben', ''].join('\n');

    expect(applyStableHeadingAnchorsFromSource(source, translated, existingTarget)).toBe(
      ['## Fehlerbehebung {#troubleshooting}', '', '## Lizenz erwerben {#purchase-a-license}', ''].join('\n'),
    );
  });

  it('overwrites a stale anchor left behind by a source heading rename', () => {
    // wcpos/docs #215: "Template types" became "Template engines" (and the
    // sibling sections were renamed too), so the source-derived slugs changed.
    // The previously translated file still carried the old {#template-types}
    // anchors and the model echoed them back inline. They are not borrowed from
    // any current heading, but no longer map to one either, so they must be
    // replaced by the new source-derived slugs rather than preserved.
    const source = ['## Template engines', '', '### Adaptive tax display', ''].join('\n');
    const existingTarget = ['## Motores de plantillas {#template-types}', '', '### Visualización adaptativa de impuestos {#custom-templates}', ''].join('\n');
    const translated = ['## Motores de plantillas {#template-types}', '', '### Visualización adaptativa de impuestos {#custom-templates}', ''].join('\n');

    expect(applyStableHeadingAnchorsFromSource(source, translated, existingTarget)).toBe(
      ['## Motores de plantillas {#template-engines}', '', '### Visualización adaptativa de impuestos {#adaptive-tax-display}', ''].join('\n'),
    );
  });

  it('does not require preserving heading anchors invalidated by source renames', () => {
    const source = ['## Template engines', '', '### Adaptive tax display', ''].join('\n');
    const existingTarget = ['## Motores de plantillas {#template-types}', '', '### Visualizacion adaptativa de impuestos {#adaptive-tax-display}', ''].join(
      '\n',
    );
    const output = ['## Motores de plantillas {#template-engines}', '', '### Visualizacion adaptativa de impuestos', ''].join('\n');

    expect(missingPreservedHeadingAnchors(source, output, existingTarget)).toStrictEqual(['{#adaptive-tax-display}']);
  });

  it('does not cascade-shift anchors when the translation has an extra heading the source lacks', () => {
    // If the model inserts a stray heading (or splits one), a flat sequential
    // counter would assign every subsequent translated heading the wrong
    // source anchor. Per-level positional matching avoids the cascade.
    const source = ['## Editing Orders', '', '## Order Statuses', ''].join('\n');
    const translated = [
      '## Bestellungen bearbeiten',
      '',
      '### Hinweis', // hallucinated extra heading
      '',
      '## Bestellstatus',
      '',
    ].join('\n');

    expect(applyStableHeadingAnchorsFromSource(source, translated)).toBe(
      ['## Bestellungen bearbeiten {#editing-orders}', '', '### Hinweis', '', '## Bestellstatus {#order-statuses}', ''].join('\n'),
    );
  });

  it('strips duplicate inline anchors from translated headings without a source position', () => {
    const source = '## Intro\n';
    const translated = ['## Einleitung {#intro}', '### Extra {#intro}', ''].join('\n');

    expect(applyStableHeadingAnchorsFromSource(source, translated)).toBe(['## Einleitung {#intro}', '### Extra', ''].join('\n'));
  });

  it('deduplicates anchors when existingTarget would produce duplicates', () => {
    // Even with valid-looking anchors, if existingTarget would create
    // duplicates within the output, the second occurrence falls back to
    // the source-derived slug.
    const source = ['## Editing Orders', '## Order Statuses', '## Use Cases', '## Related Documentation', ''].join('\n');
    const existingTarget = [
      '## Bestellungen bearbeiten {#use-cases}',
      '## Bestellstatus {#related-documentation}',
      '## Anwendungsfälle {#use-cases}',
      '## Verwandte Dokumentation {#related-documentation}',
      '',
    ].join('\n');
    const translated = ['## Bestellungen bearbeiten', '## Bestellstatus', '## Anwendungsfälle', '## Verwandte Dokumentation', ''].join('\n');

    expect(applyStableHeadingAnchorsFromSource(source, translated, existingTarget)).toBe(
      [
        '## Bestellungen bearbeiten {#editing-orders}',
        '## Bestellstatus {#order-statuses}',
        '## Anwendungsfälle {#use-cases}',
        '## Verwandte Dokumentation {#related-documentation}',
        '',
      ].join('\n'),
    );
  });
});
