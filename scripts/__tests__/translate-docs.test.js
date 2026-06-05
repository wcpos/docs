const matter = require('gray-matter');
const { normalizeTranslatedFrontmatter } = require('../translate-docs');

describe('normalizeTranslatedFrontmatter', () => {
  it('preserves translated descriptions with unquoted colons', () => {
    const sourceData = {
      title: 'Discounts',
      description: 'Apply discounts at the register.',
    };
    const translatedDescription =
      'Aplica descuentos en la caja de WCPOS: descuentos rapidos.';
    const translatedContent = `---
title: Descuentos
description: ${translatedDescription}
---

Contenido traducido`;

    const result = normalizeTranslatedFrontmatter(
      translatedContent,
      sourceData,
      'docs/discounts.mdx'
    );

    expect(matter(result).data.description).toBe(translatedDescription);
    expect(result).toContain(`description: "${translatedDescription}"`);
  });
});
