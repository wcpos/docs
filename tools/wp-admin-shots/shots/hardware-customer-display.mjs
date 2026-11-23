// WP Admin shots for versioned_docs/version-2.x/hardware/customer-display.mdx, in page order.
export const journey = 'DT';

const gallery = '#wcpos-template-gallery';
const tabs = `${gallery} div:has(> button:text-is("Display"))`;
const yours = `${gallery} section:has(h2:text-is("Your Templates"))`;
const liveRow = `${yours} tr:has(input[name="wcpos-live-display"]:checked)`;
const editor = '#wcpos-store-edit';
const section = (heading) => `${editor} main > * > *:has(h3:text-is("${heading}"))`;
const display = section('Customer display');

export default [
  {
    step: 1,
    slug: 'templates-display',
    // The hash route the Display tab itself navigates to.
    url: 'wp-admin/admin.php?page=wcpos-templates#/?type=display',
    prepare: async (page) => {
      await page.locator(liveRow).waitFor({ state: 'visible' });
    },
    // The tabs, the Display heading and the Your Templates table; the gallery below is cut off.
    crop: [tabs, yours],
    maxHeight: 520,
    pins: [
      { name: 'tab-display', selector: `${tabs} > button:text-is("Display")` },
      { name: 'live', selector: `${liveRow} input[name="wcpos-live-display"]` },
      { name: 'enabled', selector: `${liveRow} button[role="switch"]` },
    ],
    alt: 'WP Admin, POS → Templates, Display tab: Customer Display Templates, with Your Templates listing Pro Display as the live template (Live chosen, Enabled switched on) and its Preview button.',
  },
  {
    step: 2,
    slug: 'store-customer-display',
    url: 'wp-admin/admin.php?page=wcpos-store-edit&id={storeId:Harbour Street}#/display',
    // The store menu down to its Selling group (Customer display sits there), the title bar and the section.
    crop: [`${editor} aside[aria-label="Store menu"] nav:has(a:text-is("Customer display"))`, `${editor} div:has(> h1)`, display],
    pins: [
      { name: 'menu-display', selector: `${editor} aside[aria-label="Store menu"] nav a:text-is("Customer display")` },
      { name: 'same-as-site', selector: `${display} span:text-is("Same as site")` },
      { name: 'customise', selector: `${display} button:text-is("Customise")` },
      { name: 'templates-link', selector: `${display} a:text-is("Templates → Display")` },
    ],
    alt: 'WP Admin, store editor for Harbour Street, Customer display: the store menu with Customer display current, and the Customer display section with Display template set to Same as site · Pro Display, the Customise button and the Templates → Display link.',
  },
];
