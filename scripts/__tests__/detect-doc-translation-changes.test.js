/* global describe, it, expect */
const {
  filterTranslationSourceFiles,
  resolveChangedFiles,
} = require('../detect-doc-translation-changes');

describe('filterTranslationSourceFiles', () => {
  it('keeps docs, English i18n JSON, sidebars, and Docusaurus config', () => {
    expect(
      filterTranslationSourceFiles([
        'versioned_docs/version-1.x/getting-started/index.mdx',
        'versioned_docs/version-1.x/api/reference.md',
        'i18n/en/docusaurus-plugin-content-docs/version-1.x.json',
        'versioned_sidebars/version-1.x-sidebars.json',
        'sidebars.js',
        'docusaurus.config.js',
        'src/css/custom.css',
        'i18n/de/docusaurus-plugin-content-docs/version-1.x/foo.mdx',
        'README.md',
      ])
    ).toEqual([
      'docusaurus.config.js',
      'i18n/en/docusaurus-plugin-content-docs/version-1.x.json',
      'sidebars.js',
      'versioned_docs/version-1.x/api/reference.md',
      'versioned_docs/version-1.x/getting-started/index.mdx',
      'versioned_sidebars/version-1.x-sidebars.json',
    ]);
  });

  it('deduplicates and sorts out-of-order paths for stable workflow output', () => {
    expect(
      filterTranslationSourceFiles([
        'versioned_docs/version-1.x/z.mdx',
        'sidebars.js',
        'versioned_docs/version-1.x/a.mdx',
        'sidebars.js',
        'docusaurus.config.js',
      ])
    ).toEqual([
      'docusaurus.config.js',
      'sidebars.js',
      'versioned_docs/version-1.x/a.mdx',
      'versioned_docs/version-1.x/z.mdx',
    ]);
  });
});

describe('resolveChangedFiles', () => {
  it('uses explicit files before git diff output', () => {
    expect(
      resolveChangedFiles({
        explicitFiles: ['versioned_docs/version-1.x/a.mdx'],
        diffFiles: ['src/ignored.js'],
        allFiles: ['versioned_docs/version-1.x/b.mdx'],
      })
    ).toEqual(['versioned_docs/version-1.x/a.mdx']);
  });

  it('falls back to all files when no changed source files are detected', () => {
    expect(
      resolveChangedFiles({
        explicitFiles: [],
        diffFiles: ['src/ignored.js'],
        allFiles: ['versioned_docs/version-1.x/b.mdx'],
      })
    ).toEqual(['versioned_docs/version-1.x/b.mdx']);
  });
});
