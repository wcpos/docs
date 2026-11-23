// WP Admin shots for versioned_docs/version-2.x/receipts/storefront (receipts in My Account), in page order.
export const journey = 'SF';

const app = '#woocommerce-pos-settings';
const section = (heading) => `${app} main div:has(> div > div > h3:text-is("${heading}"))`;
const row = (label) => `${section('Customers')} div:has(> div > label:text-is("${label}"))`;
const url = 'wp-admin/admin.php?page=woocommerce-pos-settings';

export default [
  {
    step: 1,
    slug: 'general',
    url,
    // The POS menu, the settings menu down to License, and the screen's title and Stores section.
    crop: ['#toplevel_page_woocommerce-pos', '[data-testid="settings-nav-general"]', '[data-testid="settings-nav-license"]', `${app} h1`, section('Stores')],
    pins: [
      { name: 'menu-settings', selector: '#toplevel_page_woocommerce-pos .wp-submenu a[href*="page=woocommerce-pos-settings"]' },
      { name: 'nav-general', selector: '[data-testid="settings-nav-general"]' },
    ],
    alt: 'WP Admin, POS → Settings with General selected in the settings menu, and the top of the General screen with the Stores section.',
  },
  {
    step: 2,
    slug: 'customers',
    url,
    // From the Customers heading down to the customer receipt template; the Tax IDs part is left out.
    crop: [`${section('Customers')} h3`, row('Receipt template for customers')],
    pins: [
      { name: 'download-receipts', selector: `${row('Let customers download receipts')} > button[role="switch"]` },
      { name: 'receipt-template', selector: `${section('Customers')} select[aria-label="Receipt template for customers"]` },
    ],
    alt: 'WP Admin, POS → Settings → General, Customers section: Let customers download receipts is switched on and Receipt template for customers is set to Use active receipt template.',
  },
];
