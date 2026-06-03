const {
  findTranslationMarkerIssues,
  findDisallowedTranslationAuthors,
  changedTranslationFiles,
} = require('../check-translation-safety');

describe('findTranslationMarkerIssues', () => {
  it('flags visible locale prefixes in translated MDX prose', () => {
    const content = `---\ntitle: WCPOS Polylang\n---\n\nDE: # WCPOS Polylang\n\n- HI: Filters product queries.\n| AR: Filter | AR: Purpose |\n`;

    expect(findTranslationMarkerIssues('i18n/de/file.mdx', content)).toEqual([
      {
        path: 'i18n/de/file.mdx',
        line: 5,
        reason: 'visible_locale_prefix',
        text: 'DE: # WCPOS Polylang',
      },
      {
        path: 'i18n/de/file.mdx',
        line: 7,
        reason: 'visible_locale_prefix',
        text: '- HI: Filters product queries.',
      },
      {
        path: 'i18n/de/file.mdx',
        line: 8,
        reason: 'visible_locale_prefix',
        text: '| AR: Filter | AR: Purpose |',
      },
    ]);
  });

  it('flags placeholder translated frontmatter prefixes', () => {
    const content = `---\ntitle: Ubersetzt - WCPOS Polylang\nsidebar_label: مترجم - Polylang\ndescription: अनुवादित - Filter products by language.\n---\n`;

    expect(findTranslationMarkerIssues('i18n/de/file.mdx', content)).toEqual([
      {
        path: 'i18n/de/file.mdx',
        line: 2,
        reason: 'placeholder_frontmatter_prefix',
        text: 'title: Ubersetzt - WCPOS Polylang',
      },
      {
        path: 'i18n/de/file.mdx',
        line: 3,
        reason: 'placeholder_frontmatter_prefix',
        text: 'sidebar_label: مترجم - Polylang',
      },
      {
        path: 'i18n/de/file.mdx',
        line: 4,
        reason: 'placeholder_frontmatter_prefix',
        text: 'description: अनुवादित - Filter products by language.',
      },
    ]);
  });

  it('allows natural translated words that are not marker prefixes', () => {
    const content = `---\ntitle: Payment methods\n---\n\nUI: Use the button to sync products.\nQA: Verify the translated checkout screen.\nOK: The receipt printer is connected.\nLa tienda permite productos traducidos sin duplicados.\nالعناصر المترجمة متاحة في نقطة البيع.\n`;

    expect(findTranslationMarkerIssues('i18n/es/file.mdx', content)).toEqual([]);
  });
});

describe('changedTranslationFiles', () => {
  it('returns an empty list when the comparison ref is unavailable', () => {
    expect(changedTranslationFiles('refs/heads/__missing_translation_safety_ref__')).toEqual([]);
  });
});

describe('findDisallowedTranslationAuthors', () => {
  it('flags reviewer/fixer bots that touched translation files', () => {
    const commits = [
      {
        hash: 'abc123',
        author: 'wcpos-agents[bot]',
        subject: 'fix: complete translation coverage',
        files: ['i18n/de/file.mdx', 'scripts/check.js'],
      },
      {
        hash: 'def456',
        author: 'wcpos-bot[bot]',
        subject: 'feat(aide): update de docs translations',
        files: ['i18n/de/ok.mdx'],
      },
    ];

    expect(findDisallowedTranslationAuthors(commits)).toEqual([
      {
        hash: 'abc123',
        author: 'wcpos-agents[bot]',
        subject: 'fix: complete translation coverage',
        files: ['i18n/de/file.mdx'],
      },
    ]);
  });
});
