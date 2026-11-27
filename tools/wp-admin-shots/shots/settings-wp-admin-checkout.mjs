// WP Admin shots for versioned_docs/version-2.x/settings/wp-admin/checkout.mdx, in page order.
export const journey = 'CO';

const settings = '#woocommerce-pos-settings';
const url = 'wp-admin/admin.php?page=woocommerce-pos-settings#/checkout';
const toggle = (label) => `${settings} div:has(> button[role="switch"]):has(label:text-is("${label}")) > button`;
const gateways = `${settings} main div:has(> h2:text-is("Gateways"))`;
const row = (gateway) => `${settings} tr:has(strong:text-is("${gateway}"))`;
const menu = (gateway) => `[role="menu"][aria-label="${gateway}"]`;
const openMenu = (gateway) => async (page) => {
  // The menu is fixed-position and opens downward, so a row near the bottom leaves its items off screen.
  await page.locator(row(gateway)).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.locator(`${row(gateway)} [aria-haspopup="menu"]`).click();
  await page.locator(menu(gateway)).waitFor({ state: 'visible' });
};

export default [
  {
    step: 1,
    slug: 'switches',
    url,
    crop: [`${settings} main > div > div:has(label:text-is("Prevent overselling"))`],
    pins: [
      { name: 'prevent-overselling', selector: toggle('Prevent overselling') },
      { name: 'admin-emails', selector: toggle('Admin emails') },
      { name: 'admin-new-order', selector: `${settings} div:has(> label:text-is("New order")) > input[type="checkbox"]` },
      { name: 'customer-emails', selector: toggle('Customer emails') },
      { name: 'cashier-emails', selector: toggle('Cashier emails') },
    ],
    alt: 'WP Admin, POS → Settings → Checkout: Prevent overselling switched off; Admin emails switched on with New order, Cancelled order and Failed order ticked; Customer emails switched on with Order on hold, Processing order, Completed order, Refunded order and Failed order ticked; Cashier emails switched off.',
  },
  {
    step: 2,
    slug: 'gateways',
    url,
    crop: [`${gateways} > h2`, `${gateways} > p`, `${gateways} table`],
    pins: [
      { name: 'drag-handle', selector: `${row('Cash')} td:first-child` },
      { name: 'default', selector: `${row('Cash')} input[type="radio"]` },
      { name: 'enabled', selector: `${row('Cash')} button[role="switch"]` },
      { name: 'order-status', selector: `${row('Cash')} select` },
      { name: 'actions', selector: `${row('Cash')} [aria-haspopup="menu"]` },
      { name: 'bacs-row', selector: `${row('Direct bank transfer')} td:has(> strong)` },
    ],
    alt: 'WP Admin, POS → Settings → Checkout, Gateways: the description and a table with Default, Gateway, Gateway ID, Enabled and Order Status columns. Cash (the default) and Card are switched on with Completed; Direct bank transfer and Check payments are off with On hold; Cash on delivery and Stripe Terminal are off with Completed. Each row has a drag handle and a ⋮ menu.',
  },
  {
    step: 3,
    slug: 'gateway-menu',
    url,
    prepare: openMenu('Direct bank transfer'),
    crop: [row('Direct bank transfer'), menu('Direct bank transfer')],
    pins: [
      { name: 'menu-pos-settings', selector: `${menu('Direct bank transfer')} [role="menuitem"]:text-is("POS settings")` },
      { name: 'menu-woocommerce-settings', selector: `${menu('Direct bank transfer')} [role="menuitem"]:text-is("WooCommerce settings")` },
    ],
    alt: 'WP Admin, POS → Settings → Checkout: the ⋮ menu of Direct bank transfer open, with POS settings and WooCommerce settings.',
  },
  {
    step: 4,
    slug: 'cash-pos-settings',
    url,
    prepare: async (page) => {
      await openMenu('Cash')(page);
      await page.locator(`${menu('Cash')} [role="menuitem"]:text-is("POS settings")`).click();
      await page.locator('[role="dialog"]:has(h2:text-is("Cash"))').waitFor({ state: 'visible' });
    },
    crop: ['[role="dialog"]:has(h2:text-is("Cash"))'],
    pins: [
      { name: 'title', selector: '[role="dialog"] #title' },
      { name: 'description', selector: '[role="dialog"] #description' },
      { name: 'rounding', selector: '[role="dialog"] #rounding_increment' },
      { name: 'save', selector: '[role="dialog"] button:text-is("Save")' },
    ],
    alt: 'WP Admin, POS → Settings → Checkout: the POS settings dialog for Cash, with a note that the change applies to the POS only and a link to the WooCommerce Settings, Title (Cash), an empty Description, Rounding set to No rounding with its note that cash payments round to the nearest increment, and Cancel and Save.',
  },
];
