// WP Admin shots for versioned_docs/version-2.x/stores/registers-and-devices.mdx, in page order.
export const journey = 'RD';

const settings = '#woocommerce-pos-settings';
const register = `${settings} main > div:has(h3:text-is("Register"))`;
const editor = '#wcpos-store-edit';
const section = (heading) => `${editor} main > * > *:has(h3:text-is("${heading}"))`;

export default [
  {
    step: 1,
    slug: 'general-register-free',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings',
    // A site without Pro (Pro replaces this section), with the register switched on for this shot
    // only; 5.00 and 17:30 are the free plugin's own defaults. Both are undone after the shot.
    site: 'free',
    settings: { woocommerce_pos_settings_general: { register_sessions: true, variance_threshold: '5.00', expected_close_time: '17:30' } },
    crop: [register],
    pins: [
      { name: 'open-close', selector: `${register} button[role="switch"]` },
      { name: 'opening-float', selector: '#opening-float' },
      { name: 'ask-manager', selector: '#variance_threshold' },
      { name: 'close-reminder', selector: '#expected_close_time' },
      { name: 'more-registers-pro', selector: `${register} a:text-is("More registers and stores with Pro")` },
    ],
    alt: 'WP Admin, POS → Settings → General, Register section on a site without Pro: Open and close the register switched on, an Opening float of 200.00, Ask a manager when the count is out by more than 5.00 and Remind the cashier to close at 17:30 (both switched on), and the More registers and stores with Pro link.',
  },
  {
    step: 2,
    slug: 'store-registers',
    url: 'wp-admin/admin.php?page=wcpos-store-edit&id={storeId:Harbour Street}#/registers',
    crop: [`${editor} aside[aria-label="Store menu"] nav`, `${editor} div:has(> h1)`, section('Tills'), section('Cash drawer rules')],
    pins: [
      { name: 'menu-registers', selector: `${editor} aside[aria-label="Store menu"] nav a:text-is("Registers")` },
      { name: 'register-add', selector: '[data-testid="register-add"]' },
      { name: 'cash-drawer-customise', selector: `${section('Cash drawer rules')} button:text-is("Customise")` },
    ],
    alt: 'WP Admin, store editor for Harbour Street, Registers: the store menu with Registers (1 open) current, the Tills table with Café till (100.00, Closed) and Front counter (150.00, Open since 09:00 AM · Maya Chen), + Add register, and Cash drawer rules with the Site defaults chip and Customise.',
  },
];
