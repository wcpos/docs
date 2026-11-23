// WP Admin shots for versioned_docs/version-2.x/settings/wp-admin/email-notifications.mdx, in page order.
import { switchesOn } from './lib.mjs';

export const journey = 'EN';

const S = '#woocommerce-pos-settings';
const row = (label) => `${S} main > div:first-child > div > div:has(button[role="switch"]):has-text("${label}")`;

export default [
  {
    step: 1,
    slug: 'email-switches',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/checkout',
    prepare: (page) => switchesOn(page, row('Cashier emails')),
    crop: [row('Prevent overselling'), row('Admin emails'), row('Cashier emails')],
    pins: [
      { name: 'admin-emails', selector: `${row('Admin emails')} button[role="switch"]` },
      { name: 'customer-emails', selector: `${row('Customer emails')} button[role="switch"]` },
      { name: 'cashier-emails', selector: `${row('Cashier emails')} button[role="switch"]` },
    ],
    alt: 'WP Admin, POS → Settings → Checkout: the Prevent overselling switch above the Admin emails, Customer emails and Cashier emails switches, all on, each with a checkbox for every email in its group.',
  },
];
