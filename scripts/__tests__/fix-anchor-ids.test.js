const {
  textToAnchor,
  extractHeadings,
  addAnchorIds,
  getSourcePath,
} = require('../fix-anchor-ids');

describe('textToAnchor', () => {
  it('converts simple heading to anchor', () => {
    expect(textToAnchor('Connection Errors')).toBe('connection-errors');
  });

  it('handles special characters', () => {
    expect(textToAnchor("What's New")).toBe('whats-new');
    expect(textToAnchor('Step 1: Install')).toBe('step-1-install');
  });

  it('handles multiple spaces', () => {
    expect(textToAnchor('Some   Heading')).toBe('some-heading');
  });

  it('handles numbers', () => {
    expect(textToAnchor('API01001')).toBe('api01001');
  });
});

describe('extractHeadings', () => {
  it('extracts markdown headings', () => {
    const content = `# Main Title

## Section One

Some content

### Subsection

## Section Two {#custom-id}
`;

    const headings = extractHeadings(content);

    expect(headings).toHaveLength(4);
    expect(headings[0]).toMatchObject({
      level: 1,
      text: 'Main Title',
      anchor: 'main-title',
      hasExplicitId: false,
    });
    expect(headings[3]).toMatchObject({
      level: 2,
      text: 'Section Two',
      anchor: 'custom-id',
      hasExplicitId: true,
    });
  });

  it('handles headings with special characters', () => {
    const content = `## Plugin/WordPress Errors

## What's New?
`;
    const headings = extractHeadings(content);

    expect(headings[0].anchor).toBe('pluginwordpress-errors');
    expect(headings[1].anchor).toBe('whats-new');
  });
});

describe('addAnchorIds', () => {
  it('adds explicit IDs to translated headings', () => {
    const source = `## Connection Errors

## Authentication Errors
`;

    const translated = `## أخطاء الاتصال

## أخطاء المصادقة
`;

    const result = addAnchorIds(source, translated);

    expect(result.modified).toBe(true);
    expect(result.content).toContain('## أخطاء الاتصال {#connection-errors}');
    expect(result.content).toContain('## أخطاء المصادقة {#authentication-errors}');
    expect(result.fixes).toHaveLength(2);
  });

  it('preserves existing explicit IDs', () => {
    const source = `## Connection Errors
`;

    const translated = `## أخطاء الاتصال {#connection-errors}
`;

    const result = addAnchorIds(source, translated);

    expect(result.modified).toBe(false);
    expect(result.content).toBe(translated);
  });

  it('handles matching anchors (no change needed)', () => {
    const source = `## FAQ
`;

    const translated = `## FAQ
`;

    const result = addAnchorIds(source, translated);

    expect(result.modified).toBe(false);
  });

  it('handles multi-level headings', () => {
    const source = `# Main

## Section

### Subsection
`;

    const translated = `# 主要

## セクション

### サブセクション
`;

    const result = addAnchorIds(source, translated);

    expect(result.modified).toBe(true);
    expect(result.content).toContain('# 主要 {#main}');
    expect(result.content).toContain('## セクション {#section}');
    expect(result.content).toContain('### サブセクション {#subsection}');
  });

  it('handles real Arabic API errors case', () => {
    const source = `## Connection Errors

Network issues.

## Authentication Errors

Login issues.
`;

    const translated = `## أخطاء الاتصال

مشاكل الشبكة.

## أخطاء المصادقة

مشاكل تسجيل الدخول.
`;

    const result = addAnchorIds(source, translated);

    expect(result.modified).toBe(true);
    expect(result.content).toContain('{#connection-errors}');
    expect(result.content).toContain('{#authentication-errors}');
  });
});

describe('getSourcePath', () => {
  it('converts versioned translation path to source', () => {
    const translated =
      'i18n/ar/docusaurus-plugin-content-docs/version-1.x/error-codes/api.mdx';
    expect(getSourcePath(translated)).toBe(
      'versioned_docs/version-1.x/error-codes/api.mdx'
    );
  });

  it('converts current docs translation path to source', () => {
    const translated =
      'i18n/de/docusaurus-plugin-content-docs/current/getting-started/index.mdx';
    expect(getSourcePath(translated)).toBe('docs/getting-started/index.mdx');
  });

  it('handles different locales', () => {
    const paths = [
      'i18n/es/docusaurus-plugin-content-docs/version-1.x/foo.mdx',
      'i18n/ja/docusaurus-plugin-content-docs/version-1.x/foo.mdx',
      'i18n/zh-CN/docusaurus-plugin-content-docs/version-1.x/foo.mdx',
    ];

    paths.forEach((p) => {
      expect(getSourcePath(p)).toBe('versioned_docs/version-1.x/foo.mdx');
    });
  });

  it('returns null for invalid paths', () => {
    expect(getSourcePath('some/random/path.mdx')).toBeNull();
  });
});
