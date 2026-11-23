// WP Admin shots for versioned_docs/version-2.x/settings/wp-admin/registers.mdx, in page order.
import { switchesOn } from './lib.mjs';

export const journey = 'RW';

const S = '#woocommerce-pos-settings';
const section = (heading) => `${S} main > div:has(h3:text-is("${heading}"))`;
const GENERAL = 'wp-admin/admin.php?page=woocommerce-pos-settings';

export default [
  {
    step: 1,
    slug: 'register-free',
    site: 'free',
    url: GENERAL,
    prepare: (page) => switchesOn(page, section('Register')),
    crop: [section('Register')],
    pins: [
      { name: 'open-close', selector: `${section('Register')} button[role="switch"] >> nth=0` },
      { name: 'opening-float', selector: '#opening-float' },
      { name: 'ask-manager', selector: `${section('Register')} button[role="switch"] >> nth=1` },
      { name: 'remind', selector: `${section('Register')} button[role="switch"] >> nth=2` },
    ],
    alt: 'WP Admin, POS → Settings → General on the free plugin, Register section: Open and close the register switched on, the Opening float, and Ask a manager when the count is out and Remind the cashier to close, both on with their amount and time.',
  },
  {
    step: 2,
    slug: 'register-site-defaults',
    url: GENERAL,
    prepare: (page) => switchesOn(page, section('Register')),
    crop: [section('Register')],
    pins: [
      { name: 'site-defaults', selector: `${section('Register')} p:has-text("Site defaults")` },
      { name: 'ask-manager', selector: `${section('Register')} button[role="switch"] >> nth=1` },
      { name: 'remind', selector: `${section('Register')} button[role="switch"] >> nth=2` },
      { name: 'manage-stores', selector: `${section('Register')} :text-is("Manage stores")` },
    ],
    alt: 'WP Admin, POS → Settings → General with WCPOS Pro, Register section: site defaults that each store can customise, with Open and close the register, Ask a manager when the count is out and Remind the cashier to close all on, and Manage stores.',
  },
];
