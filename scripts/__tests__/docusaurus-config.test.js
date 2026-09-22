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

describe('published versions are translated for every locale', () => {
  const fs = require('fs');
  const path = require('path');

  // A locale with no translation for a published version does not fail the
  // build: Docusaurus serves the English body inside the localized shell, under
  // hreflang-tagged URLs, and the per-file completeness gate cannot see a gap
  // that has no translated files at all. This is the gate for the AT LAUNCH flip:
  // adding '2.x' to onlyIncludeVersions fails here until it is translated.
  // 0.5 catches a wholesale gap while tolerating an old version's partial
  // coverage (0.4.x nl is at 23 of 35 pages); per-file drops are
  // check-translation-completeness.js's job.
  const MIN_LOCALE_COVERAGE = 0.5;

  const root = path.join(__dirname, '../..');
  const docsOptions = config.presets.find(
    ([name]) => name === '@docusaurus/preset-classic'
  )[1].docs;
  const locales = config.i18n.locales.filter(
    (locale) => locale !== config.i18n.defaultLocale
  );

  const countPages = (dir) => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir, { withFileTypes: true }).reduce((count, entry) => {
      if (entry.isDirectory()) return count + countPages(path.join(dir, entry.name));
      return count + (/\.mdx?$/.test(entry.name) ? 1 : 0);
    }, 0);
  };

  for (const version of docsOptions.onlyIncludeVersions) {
    const sourcePages = countPages(path.join(root, 'versioned_docs', `version-${version}`));

    it.each(locales)(`${version} is translated for %s`, (locale) => {
      const translatedPages = countPages(
        path.join(root, 'i18n', locale, 'docusaurus-plugin-content-docs', `version-${version}`)
      );
      expect(translatedPages / sourcePages).toBeGreaterThanOrEqual(MIN_LOCALE_COVERAGE);
    });
  }
});
