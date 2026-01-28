const {
  validateFrontmatter,
  extractFrontmatter,
  fixSingleQuotedStrings,
  fixPartialQuoting,
  fixBackslashEscapedQuotes,
  fixFrontmatter,
} = require('../validate-frontmatter');

describe('validateFrontmatter', () => {
  it('returns valid for correct frontmatter', () => {
    const content = `---
title: Simple Title
sidebar_label: Label
---

Content here`;

    expect(validateFrontmatter(content)).toEqual({ valid: true });
  });

  it('returns valid for double-quoted strings with escaped quotes', () => {
    const content = `---
title: "Troubleshooting \\"Critical Error\\" Messages"
sidebar_label: Error
---

Content here`;

    expect(validateFrontmatter(content)).toEqual({ valid: true });
  });

  it('returns error for nested single quotes', () => {
    const content = `---
title: 'Text with 'nested' quotes'
sidebar_label: Label
---

Content here`;

    const result = validateFrontmatter(content);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns error for partial quoting', () => {
    const content = `---
title: "Quoted part" rest of title
sidebar_label: Label
---

Content here`;

    const result = validateFrontmatter(content);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('extractFrontmatter', () => {
  it('extracts frontmatter from MDX content', () => {
    const content = `---
title: Test
description: A test
---

Body content`;

    expect(extractFrontmatter(content)).toBe('title: Test\ndescription: A test');
  });

  it('returns null for content without frontmatter', () => {
    const content = 'Just some content without frontmatter';
    expect(extractFrontmatter(content)).toBeNull();
  });
});

describe('fixSingleQuotedStrings', () => {
  it('fixes single-quoted strings with internal single quotes', () => {
    const input = "title: 'Text with 'nested' quotes'";
    const expected = 'title: "Text with \'nested\' quotes"';
    expect(fixSingleQuotedStrings(input)).toBe(expected);
  });

  it('preserves valid single-quoted strings without internal quotes', () => {
    const input = "title: 'Simple quoted string'";
    expect(fixSingleQuotedStrings(input)).toBe(input);
  });

  it('handles Spanish translation with nested quotes', () => {
    // Real case from es/response-error.mdx
    const input =
      "title: 'Solución de problemas del error \"No se pueden leer las propiedades de undefined (leyendo 'data')\"'";
    const result = fixSingleQuotedStrings(input);

    // Should be double-quoted with escaped internal double quotes
    expect(result).toContain('title: "');
    expect(result).toContain("'data'");
  });

  it('handles German translation with nested quotes', () => {
    // Real case from de/response-error.mdx
    const input =
      "title: 'Fehlerbehebung bei \"Kann Eigenschaften von undefined (lesen von 'data')\" Fehler'";
    const result = fixSingleQuotedStrings(input);

    expect(result).toContain('title: "');
    expect(result).toContain("'data'");
  });

  it('escapes internal double quotes when converting', () => {
    const input = 'title: \'Text with "double" and \'single\' quotes\'';
    const result = fixSingleQuotedStrings(input);

    expect(result).toContain('\\"double\\"');
  });
});

describe('fixPartialQuoting', () => {
  it('fixes partial quoting where only part of value is quoted', () => {
    // Real case from ko/critical-error.mdx
    const input =
      'title: "이 웹사이트에서 치명적인 오류가 발생했습니다." 해결하기';
    const expected =
      'title: "\\"이 웹사이트에서 치명적인 오류가 발생했습니다.\\" 해결하기"';
    expect(fixPartialQuoting(input)).toBe(expected);
  });

  it('preserves fully quoted strings', () => {
    const input = 'title: "Fully quoted string here"';
    expect(fixPartialQuoting(input)).toBe(input);
  });

  it('preserves unquoted strings', () => {
    const input = 'title: Simple unquoted title';
    expect(fixPartialQuoting(input)).toBe(input);
  });
});

describe('fixBackslashEscapedQuotes', () => {
  it('fixes backslash-escaped single quotes in single-quoted strings', () => {
    // Real case from ja/response-error.mdx
    const input =
      "title: '「未定義のプロパティを読み取ることができません（\\'data\\'を読み取る）」エラーのトラブルシューティング'";
    const result = fixBackslashEscapedQuotes(input);

    // Should convert to double-quoted and remove backslashes
    expect(result).toContain('title: "');
    expect(result).not.toContain("\\'");
  });

  it('preserves strings without backslash escapes', () => {
    const input = "title: 'Normal string'";
    expect(fixBackslashEscapedQuotes(input)).toBe(input);
  });
});

describe('fixFrontmatter', () => {
  it('fixes complete MDX content with nested single quotes', () => {
    const content = `---
title: 'Text with 'nested' quotes'
sidebar_label: Label
---

Content here`;

    const result = fixFrontmatter(content);
    expect(result.fixed).toBe(true);
    expect(result.content).toContain('title: "');

    // Verify the fixed content is valid
    expect(validateFrontmatter(result.content).valid).toBe(true);
  });

  it('fixes complete MDX content with partial quoting', () => {
    const content = `---
title: "Quoted part" rest of title
sidebar_label: Label
---

Content here`;

    const result = fixFrontmatter(content);
    expect(result.fixed).toBe(true);

    // Verify the fixed content is valid
    expect(validateFrontmatter(result.content).valid).toBe(true);
  });

  it('returns unfixed for content without frontmatter', () => {
    const content = 'Just content without frontmatter';
    const result = fixFrontmatter(content);

    expect(result.fixed).toBe(false);
    expect(result.error).toBe('No frontmatter found');
  });

  it('preserves already valid frontmatter', () => {
    const content = `---
title: "Valid \\"quoted\\" title"
sidebar_label: Label
---

Content here`;

    const result = fixFrontmatter(content);
    // Should still succeed even if no changes needed
    expect(validateFrontmatter(result.content).valid).toBe(true);
  });

  it('handles real Spanish translation case', () => {
    const content = `---
title: 'Solución de problemas del error "No se pueden leer las propiedades de undefined (leyendo 'data')"'
sidebar_label: Error de respuesta
description: Soluciona el error en WCPOS.
---

Content`;

    const result = fixFrontmatter(content);
    expect(result.fixed).toBe(true);
    expect(validateFrontmatter(result.content).valid).toBe(true);
  });

  it('handles real Korean translation case', () => {
    const content = `---
title: "이 웹사이트에서 치명적인 오류가 발생했습니다." 해결하기
sidebar_label: 치명적인 오류
description: WordPress 치명적인 오류를 수정합니다.
---

Content`;

    const result = fixFrontmatter(content);
    expect(result.fixed).toBe(true);
    expect(validateFrontmatter(result.content).valid).toBe(true);
  });
});
