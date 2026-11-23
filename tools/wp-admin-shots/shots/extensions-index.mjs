// WP Admin shots for versioned_docs/version-2.x/extensions/index.mdx (Extensions), in page order.
export const journey = 'J1';

const app = '#woocommerce-pos-settings';
const grid = `${app} main > div > div:nth-child(3)`;
// A card is the grid cell holding the extension's name (h3 → content → body → card).
const card = (name) => `${grid} h3:text-is("${name}") >> xpath=../../..`;
const paypal = card('PayPal Reader for WooCommerce');
const square = card('Square Terminal for WooCommerce');
const search = `${app} main input[placeholder^="Search extensions"]`;

// Shared by the extension pages (atum, wpml, wp-multilang, storeapps-smart-coupons): step 1 searches
// for one extension by name and shoots the search row, the tabs and its card, the only result.
export const cardShot = (name, alt) => ({
  step: 1,
  slug: 'extension-card',
  url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/extensions',
  prepare: async (page) => {
    await page.locator(search).fill(name);
    await page.waitForFunction(([sel, title]) => {
      const cards = document.querySelectorAll(`${sel} > div`);
      return cards.length === 1 && cards[0].querySelector('h3')?.textContent === title;
    }, [grid, name]);
    await page.locator(search).blur(); // no focus ring
  },
  crop: [`${app} main > div > div:first-child`, `${grid} > div`],
  pins: [
    { name: 'search', selector: search },
    { name: 'install', selector: `${card(name)} >> button:text-is("Install")` },
  ],
  alt,
});

// Step 2 of wpml, wp-multilang and storeapps-smart-coupons: WordPress core's Upload Plugin form,
// cut above the plugin directory (no third-party cards or text).
export const uploadPluginShot = {
  step: 2,
  slug: 'upload-plugin',
  url: 'wp-admin/plugin-install.php',
  prepare: async (page) => {
    await page.locator('.upload-view-toggle').click();
    await page.locator('.upload-plugin #pluginzip').waitFor({ state: 'visible' });
    await page.locator('.upload-view-toggle').blur(); // no focus ring
    await page.addStyleTag({ content: '#screen-meta-links { display: none !important; }' }); // the Help tab
  },
  crop: ['.wrap > h1', '.wrap .upload-view-toggle', '.upload-plugin .install-help', '.upload-plugin form'],
  pins: [
    { name: 'upload-plugin', selector: '.wrap .upload-view-toggle' },
    { name: 'choose-file', selector: '.upload-plugin #pluginzip' },
    { name: 'install-now', selector: '.upload-plugin #install-plugin-submit' },
  ],
  alt: 'WP Admin, Plugins → Add Plugins after Upload Plugin: the upload form with its Choose File button for a plugin .zip file and the Install Now button.',
};

export default [
  {
    step: 1,
    slug: 'extensions-screen',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/extensions',
    // The settings app's header and left nav, then the search row, tabs and the first two rows of cards.
    crop: [`${app} aside > div:first-child`, `${app} aside nav`, `${grid} > div:nth-child(4)`],
    maxHeight: 680, // down to the second row's Install buttons
    pins: [
      { name: 'nav-extensions', selector: `${app} [data-testid="settings-nav-extensions"]` },
      { name: 'search', selector: `${app} main input[placeholder^="Search extensions"]` },
      { name: 'refresh', selector: `${app} main button:text-is("Refresh")` },
      { name: 'tabs', selector: `${app} main div:has(> [data-testid="filter-tabs-indicator"])` },
    ],
    alt: 'WP Admin, POS → Settings → Extensions: the settings menu with Extensions selected, the Search extensions box, the Refresh button, the All, Catalog, Coupons, Inventory and Payments tabs, and the first four extension cards, each with an Install button.',
  },
  {
    step: 2,
    slug: 'installed-card',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/extensions',
    crop: [paypal],
    pins: [
      { name: 'status', selector: `${paypal} >> h3 + div > span:first-child` },
      { name: 'version', selector: `${paypal} >> a[href*="/releases/tag/"]` },
      { name: 'more-actions', selector: `${paypal} >> [aria-label="More actions"]` },
      { name: 'auto-update', selector: `${paypal} >> div:has(> button[role="switch"])` },
      { name: 'activate', selector: `${paypal} >> button:text-is("Activate")` },
    ],
    alt: 'The PayPal Reader for WooCommerce card, installed but not active: the Inactive label, version v0.1.0, the Payments category, the ⋮ more actions button, the Auto-update switch turned off and the Activate button.',
  },
  {
    step: 3,
    slug: 'not-installed-card',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/extensions',
    crop: [square],
    pins: [{ name: 'install', selector: `${square} >> button:text-is("Install")` }],
    alt: 'The Square Terminal for WooCommerce card, not installed: version v1.0.0, the Payments category, a short description and the Install button.',
  },
];
