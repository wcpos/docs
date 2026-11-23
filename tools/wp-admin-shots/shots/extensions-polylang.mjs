// WP Admin shots for versioned_docs/version-2.x/extensions/polylang.mdx (Polylang), in page order.
// Steps 3 and 4 (the store editor's Language page) are not taken: WCPOS Polylang 0.1.2 adds its
// section only on the hook admin_page_wcpos-store-edit, and Pro's store editor is now pos_page_….
export const journey = 'PL';

const settings = '#woocommerce-pos-settings main';
const card = `${settings} div[class*="grid-cols"] > div:has(h3:text-is("WCPOS Polylang"))`;
const editor = '#wcpos-store-edit';
const languageField = `${editor} main div:has(> div > label:text-is("Language"))`; // label column + select column

export default [
  {
    step: 1,
    slug: 'extension-card',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/extensions',
    prepare: async (page) => {
      await page.locator(`${settings} input[placeholder="Search extensions..."]`).fill('Polylang');
      await page.waitForFunction((sel) => document.querySelector(sel)?.childElementCount === 1, `${settings} div[class*="grid-cols"]`);
    },
    // The search row, the category tabs and the one card the search leaves.
    crop: [`${settings} div:has(> input[placeholder="Search extensions..."])`, `${settings} div:has(> [data-testid="filter-tabs-indicator"])`, card],
    pins: [
      { name: 'search', selector: `${settings} input[placeholder="Search extensions..."]` },
      { name: 'status', selector: `${card} span:text-is("Active")` },
    ],
    alt: 'WP Admin, POS → Settings → Extensions, searched for Polylang: the search box with Refresh, the category tabs, and the WCPOS Polylang card marked Active (v0.1.2, Catalog) with its Auto-update switch and Deactivate button.',
  },
  {
    step: 2,
    slug: 'upload-plugin',
    url: 'wp-admin/plugin-install.php',
    prepare: async (page) => {
      await page.locator('.upload-view-toggle').click();
      await page.locator('.upload-plugin .wp-upload-form').waitFor({ state: 'visible' });
      await page.locator('.upload-view-toggle').blur(); // no focus ring from the click
    },
    // The title row and the upload form only, not the directory text or plugin cards below.
    crop: ['.wrap h1.wp-heading-inline', '.wrap .upload-view-toggle', '.upload-plugin'],
    padBottom: 4,
    pins: [
      { name: 'upload-plugin', selector: '.wrap .upload-view-toggle' },
      { name: 'choose-file', selector: '#pluginzip' },
      { name: 'install-now', selector: '#install-plugin-submit' },
    ],
    alt: 'WP Admin, Plugins → Add Plugins after Upload Plugin: the upload form for a plugin .zip file, with Choose File and a greyed-out Install Now button.',
  },
  {
    step: 5,
    slug: 'currency-language',
    url: 'wp-admin/admin.php?page=wcpos-store-edit&id={storeId:Harbour Street}#/currency',
    crop: [languageField],
    pad: 8, // 16 reaches the Symbol position buttons above and the Timezone select below
    pins: [{ name: 'language', selector: `${languageField} select` }],
    alt: 'WP Admin, store editor for Harbour Street, Currency & language: the Language field set to English (United States), used for the POS screen and receipts.',
  },
];
