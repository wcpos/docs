const attacher = require('../../src/remark/localized-doc-links');
const { resolveLocalizedDocLink } = attacher;

describe('localized doc links', () => {
  let files;
  let options;

  beforeEach(() => {
    files = new Set();
    options = {
      siteDir: '/site',
      sourceFilePath: '/site/versioned_docs/version-2.x/error-codes/index.mdx',
      url: './AUTH101.mdx',
      locale: 'es',
      exists: (filePath) => files.has(filePath),
    };
  });

  it('rewrites a fallback page link to the translated target', () => {
    files.add('/site/versioned_docs/version-2.x/error-codes/AUTH101.mdx');
    files.add('/site/i18n/es/docusaurus-plugin-content-docs/version-2.x/error-codes/AUTH101.mdx');
    expect(resolveLocalizedDocLink({ ...options, url: './AUTH101.mdx#cause' })).toBe(
      '@site/i18n/es/docusaurus-plugin-content-docs/version-2.x/error-codes/AUTH101.mdx#cause',
    );
  });

  it('rewrites a translated page link to the English fallback target', () => {
    files.add('/site/versioned_docs/version-2.x/error-codes/AUTH201.mdx');
    expect(resolveLocalizedDocLink({
      ...options,
      sourceFilePath: '/site/i18n/es/docusaurus-plugin-content-docs/version-2.x/settings/wp-admin/access.mdx',
      url: '../../error-codes/AUTH201.mdx',
    })).toBe('@site/versioned_docs/version-2.x/error-codes/AUTH201.mdx');
  });

  it('leaves the default or undefined locale alone', () => {
    files.add('/site/versioned_docs/version-2.x/error-codes/AUTH101.mdx');
    for (const locale of ['en', undefined]) {
      expect(resolveLocalizedDocLink({ ...options, locale })).toBeNull();
    }
  });

  it("resolves a bare link from the linking page's folder", () => {
    files.add('/site/versioned_docs/version-2.x/pos/product-panel/variations.mdx');
    files.add('/site/i18n/es/docusaurus-plugin-content-docs/version-2.x/pos/product-panel/variations.mdx');
    expect(resolveLocalizedDocLink({
      ...options, sourceFilePath: '/site/versioned_docs/version-2.x/pos/product-panel/index.mdx',
      url: 'variations.mdx',
    })).toBe('@site/i18n/es/docusaurus-plugin-content-docs/version-2.x/pos/product-panel/variations.mdx');
  });

  it('resolves a bare link from the version root when the folder has no such page', () => {
    files.add('/site/versioned_docs/version-2.x/pos/cart/index.mdx');
    expect(resolveLocalizedDocLink({
      ...options, sourceFilePath: '/site/i18n/es/docusaurus-plugin-content-docs/version-2.x/settings/store/general.mdx',
      url: 'pos/cart/index.mdx#x',
    })).toBe('@site/versioned_docs/version-2.x/pos/cart/index.mdx#x');
  });

  it('prefers the folder over the version root for a bare link', () => {
    files.add('/site/versioned_docs/version-2.x/support/troubleshooting/clear-local-data.mdx');
    files.add('/site/versioned_docs/version-2.x/troubleshooting/clear-local-data.mdx');
    expect(resolveLocalizedDocLink({
      ...options, sourceFilePath: '/site/versioned_docs/version-2.x/support/index.mdx',
      url: 'troubleshooting/clear-local-data.mdx',
    })).toBe('@site/versioned_docs/version-2.x/support/troubleshooting/clear-local-data.mdx');
  });

  it('never falls back to the version root for a dotted link', () => {
    files.add('/site/versioned_docs/version-2.x/variations.mdx');
    expect(resolveLocalizedDocLink({
      ...options, sourceFilePath: '/site/versioned_docs/version-2.x/settings/index.mdx',
      url: './variations.mdx',
    })).toBeNull();
  });

  it('leaves non-relative and non-Markdown links alone', () => {
    files.add('/site/versioned_docs/version-2.x/error-codes/error-codes/AUTH101.mdx');
    files.add('/site/versioned_docs/version-2.x/error-codes/img/shot.png');
    files.add('/site/versioned_docs/version-2.x/error-codes/page');
    for (const url of [
      '/error-codes/AUTH101.mdx', 'https://example.com/a.md',
      '@site/versioned_docs/version-2.x/a.mdx', './img/shot.png', './page',
      'mailto:a@b.md', '#top',
    ]) {
      expect(resolveLocalizedDocLink({ ...options, url })).toBeNull();
    }
  });

  it('leaves a missing target alone for Docusaurus to report', () => {
    expect(resolveLocalizedDocLink(options)).toBeNull();
  });

  it('leaves links escaping the version root alone', () => {
    files.add('/site/x.mdx');
    files.add('/site/i18n/es/x.mdx');
    expect(resolveLocalizedDocLink({
      ...options,
      sourceFilePath: '/site/versioned_docs/version-2.x/a.mdx',
      url: '../../x.mdx',
    })).toBeNull();
  });

  it('leaves non-doc sources alone', () => {
    files.add('/site/i18n/es/docusaurus-plugin-content-docs/version-2.x/error-codes/AUTH101.mdx');
    expect(resolveLocalizedDocLink({
      ...options, sourceFilePath: '/site/src/pages/index.mdx',
    })).toBeNull();
  });

  it('rewrites nested links and definitions', () => {
    files.add('/site/i18n/fr/docusaurus-plugin-content-docs/version-2.x/error-codes/AUTH101.mdx');
    files.add('/site/i18n/fr/docusaurus-plugin-content-docs/version-2.x/error-codes/AUTH111.mdx');
    const tree = { type: 'root', children: [
      { type: 'paragraph', children: [{ type: 'link', url: './AUTH101.mdx' }] },
      { type: 'definition', url: './AUTH111.mdx' },
    ] };
    attacher({ siteDir: '/site', locale: 'fr', exists: options.exists })(tree, {
      path: options.sourceFilePath,
    });
    expect(tree.children[0].children[0].url).toBe(
      '@site/i18n/fr/docusaurus-plugin-content-docs/version-2.x/error-codes/AUTH101.mdx',
    );
    expect(tree.children[1].url).toBe(
      '@site/i18n/fr/docusaurus-plugin-content-docs/version-2.x/error-codes/AUTH111.mdx',
    );
  });

  it('reads the locale from the environment at transform time', () => {
    const previousLocale = process.env.DOCUSAURUS_CURRENT_LOCALE;
    try {
      delete process.env.DOCUSAURUS_CURRENT_LOCALE;
      const transform = attacher({ siteDir: '/site', exists: options.exists });
      process.env.DOCUSAURUS_CURRENT_LOCALE = 'de';
      files.add('/site/i18n/de/docusaurus-plugin-content-docs/version-2.x/error-codes/AUTH101.mdx');
      const tree = { type: 'root', children: [{ type: 'link', url: './AUTH101.mdx' }] };
      transform(tree, { path: options.sourceFilePath });
      expect(tree.children[0].url).toBe(
        '@site/i18n/de/docusaurus-plugin-content-docs/version-2.x/error-codes/AUTH101.mdx',
      );
    } finally {
      if (previousLocale === undefined) delete process.env.DOCUSAURUS_CURRENT_LOCALE;
      else process.env.DOCUSAURUS_CURRENT_LOCALE = previousLocale;
    }
  });
});
