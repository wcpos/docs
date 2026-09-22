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

describe('robots.txt sitemap declarations', () => {
  const fs = require('fs');
  const path = require('path');

  const robots = fs.readFileSync(
    path.join(__dirname, '../../static/robots.txt'),
    'utf8'
  );

  const declared = robots
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith('sitemap:'))
    .map((line) => line.slice('sitemap:'.length).trim());

  // Docusaurus emits one sitemap per built locale: the default locale's at the
  // site root, every other locale's under its own prefix.
  const expected = config.i18n.locales.map((locale) =>
    locale === config.i18n.defaultLocale
      ? `${config.url}${config.baseUrl}sitemap.xml`
      : `${config.url}${config.baseUrl}${locale}/sitemap.xml`
  );

  it('declares a sitemap for every configured locale', () => {
    expect([...declared].sort()).toEqual([...expected].sort());
  });

  it('declares each sitemap exactly once', () => {
    expect(declared.length).toBe(new Set(declared).size);
  });
});
