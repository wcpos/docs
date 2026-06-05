const config = require('../../docusaurus.config.js');

describe('docusaurus locale configuration', () => {
  it('labels the English locale as English in the language menu', () => {
    expect(config.i18n.localeConfigs.en.label).toBe('English');
  });

  it('includes Dutch as a supported locale with a native label', () => {
    expect(config.i18n.locales).toContain('nl');
    expect(config.i18n.localeConfigs.nl.label).toBe('Nederlands');
  });
});

describe('docusaurus frontmatter parsing', () => {
  it('canonicalizes unquoted description colons before parsing', async () => {
    const parsed = await config.markdown.parseFrontMatter({
      fileContent: `---
title: Descuentos del carrito
description: Aplica descuentos en la caja de WCPOS: descuentos rápidos.
---

Contenido`,
      defaultParseFrontMatter: ({ fileContent }) => {
        expect(fileContent).toContain(
          'description: "Aplica descuentos en la caja de WCPOS: descuentos rápidos."'
        );

        return {
          frontMatter: {
            description:
              'Aplica descuentos en la caja de WCPOS: descuentos rápidos.',
          },
          content: 'Contenido',
        };
      },
    });

    expect(parsed.frontMatter.description).toBe(
      'Aplica descuentos en la caja de WCPOS: descuentos rápidos.'
    );
  });
});
