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
    variant: 'free',
    url: GENERAL,
    crop: [`${S} aside > div:first-child`, `${S} aside nav >> nth=2`, section('Store details')],
    pins: [
      { name: 'menu-general', selector: `${S} aside nav :text-is("General")` },
      { name: 'menu-checkout', selector: `${S} aside nav :text-is("Checkout")` },
      { name: 'menu-cloud-print', selector: `${S} aside nav :text-is("Cloud Print")` },
      { name: 'menu-access', selector: `${S} aside nav :text-is("Access")` },
      { name: 'menu-sessions', selector: `${S} aside nav :text-is("Sessions")` },
      { name: 'menu-extensions', selector: `${S} aside nav :text-is("Extensions")` },
      { name: 'menu-export-closures', selector: `${S} aside nav :text-is("Export closures")` },
      { name: 'menu-logs', selector: `${S} aside nav :text-is("Logs")` },
      { name: 'menu-license', selector: `${S} aside nav :text-is("License")` },
    ],
    alt: 'WP Admin, POS → Settings → General with the free plugin: the WCPOS menu down the left with General, Checkout, Cloud Print, Access, Sessions and Extensions under Settings, Export closures and Logs under Tools, License under Account, General selected, and the Store details section beside it.',
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
    variant: 'free',
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
