// WP Admin shots for versioned_docs/version-2.x/settings/wp-admin/index.mdx, in page order.
import { switchesOn } from './lib.mjs';

export const journey = 'WA';

const S = '#woocommerce-pos-settings';
const section = (heading) => `${S} main > div:has(h3:text-is("${heading}"))`;
const GENERAL = 'wp-admin/admin.php?page=woocommerce-pos-settings';

export default [
  {
    step: 1,
    slug: 'settings-menu',
    url: GENERAL,
    crop: [`${S} aside > div:first-child`, `${S} aside nav >> nth=2`, section('Stores')],
    pins: [
      { name: 'menu-settings', selector: `${S} aside h3:text-is("Settings")` },
      { name: 'menu-tools', selector: `${S} aside h3:text-is("Tools")` },
      { name: 'menu-account', selector: `${S} aside h3:text-is("Account")` },
    ],
    alt: 'WP Admin, POS → Settings → General with WCPOS Pro: the WCPOS menu down the left with its Settings, Tools and Account groups, General selected, and the Stores section beside it.',
  },
  {
    step: 2,
    slug: 'force-ssl',
    url: GENERAL,
    prepare: (page) => switchesOn(page, section('Advanced')),
    crop: [section('Advanced')],
    pins: [
      { name: 'force-ssl', selector: `${section('Advanced')} button[role="switch"]` },
    ],
    alt: 'The Advanced section at the bottom of General, with Force SSL switched on.',
  },
  {
    step: 3,
    slug: 'store-details-free',
    site: 'free',
    url: GENERAL,
    crop: [section('Store details')],
    pins: [
      { name: 'store-name', selector: `${section('Store details')} :text-is("Store name")` },
      { name: 'phone', selector: `${section('Store details')} :text-is("Phone")` },
      { name: 'email', selector: `${section('Store details')} :text-is("Email")` },
      { name: 'refund-policy', selector: `${section('Store details')} :text-is("Refund & Returns Policy")` },
      { name: 'store-tax-ids', selector: `${section('Store details')} :text-is("Store tax IDs")` },
    ],
    alt: 'Store details on General with the free plugin: Store name, Phone, Email and Refund & Returns Policy, then Store tax IDs and the Add tax ID button.',
  },
];
