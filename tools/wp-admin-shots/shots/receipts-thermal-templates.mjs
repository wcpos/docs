// WP Admin shots for versioned_docs/version-2.x/receipts/thermal-templates (thermal template editor), in page order.
export const journey = 'TT';

const editor = '#wcpos-template-editor';
const previewBar = `${editor} div:has(> span:text-is("Thermal Preview"))`;

export default [
  {
    step: 1,
    slug: 'editor',
    // The seeded template's edit screen, reached from its Edit link in POS → Templates.
    url: 'wp-admin/admin.php?page=wcpos-templates',
    prepare: async (page) => {
      // The Edit link in the template's own row: the nearest ancestor of a post.php link that holds the title.
      await page.locator('a[href*="post.php?post="]').first().waitFor({ state: 'visible' });
      const href = await page.evaluate((title) => {
        for (const a of document.querySelectorAll('a[href*="post.php?post="]')) {
          let el = a.parentElement;
          while (el && el.querySelectorAll('a[href*="post.php?post="]').length === 1 && !el.textContent.includes(title)) el = el.parentElement;
          if (el && el.querySelectorAll('a[href*="post.php?post="]').length === 1) return a.href;
        }
        return null;
      }, 'Simple Thermal Receipt (80mm)');
      if (!href) throw new Error('no Edit link for Simple Thermal Receipt (80mm) in POS → Templates');
      await page.goto(href, { waitUntil: 'networkidle' });
      await page.locator(`${editor} .cm-editor`).waitFor({ state: 'visible' });
      await page.locator(previewBar).waitFor({ state: 'visible' });
    },
    // Title, Update, the start of the XML and the top of the preview. The crop ends on the preview's
    // bar, so the sample receipt below it is in the picture but not in the leak-check text.
    crop: ['#titlediv', '#submitdiv', previewBar],
    pad: 12, // 16 would show the bottom edge of the Add New Template button above the title
    padBottom: 240,
    maxHeight: 900,
    pins: [
      { name: 'xml-editor', selector: `${editor} div:has(> .cm-editor)` },
      { name: 'preview', selector: previewBar },
      { name: 'update', selector: '#publish' },
    ],
    alt: 'WP Admin, Edit Template for Simple Thermal Receipt (80mm): the XML editor with its fields list, the Thermal Preview below it showing the top of the sample receipt, and the Update button.',
  },
];
