// WP Admin shots for versioned_docs/version-2.x/settings/wp-admin/store-tax-ids.mdx, in page order.
export const journey = 'ST';

const settings = '#woocommerce-pos-settings';
const taxIds = `${settings} div:has(> h4:text-is("Store tax IDs"))`;
const editor = '#wcpos-store-edit';
const row = `${editor} [data-testid="tax-id-row-0"]`;
const section = (heading) =>`${editor} main > * > *:has(h3:text-is("${heading}"))`;

export default [
  {
    step: 1,
    slug: 'general-tax-ids-free',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/general',
    // A site without Pro, with one store tax ID in the free General settings for this shot only.
    site: 'free',
    settings: { woocommerce_pos_settings_general: { store_tax_ids: [{ type: 'us_ein', value: '93-4815162', country: 'US' }] } },
    // Show the card in place: the foot of Refund & Returns Policy and its hint above it, never the Email field.
    // A transparent 1 px marker 90 px above the heading sets the crop's top edge; it changes no layout.
    prepare: async (page) => {
      await page.locator(taxIds).first().evaluate((card) => {
        const box = card.getBoundingClientRect();
        const marker = Object.assign(document.createElement('div'), { id: 'wpas-crop-top' });
        marker.style.cssText = `position:absolute;left:${box.left + window.scrollX}px;top:${box.top + window.scrollY - 90}px;width:1px;height:1px;opacity:0;pointer-events:none`;
        document.body.appendChild(marker);
      });
    },
    crop: [taxIds, '#wpas-crop-top'],
    pins: [
      { name: 'add-tax-id', selector: `${taxIds} button:text-is("Add tax ID")` },
      { name: 'type', selector: `${taxIds} [aria-label="Type"]` },
      { name: 'country', selector: `${taxIds} [aria-label="Country"]` },
      { name: 'value', selector: `${taxIds} [aria-label="Value"]` },
      { name: 'custom-label', selector: `${taxIds} [aria-label="Custom label"]` },
      { name: 'remove', selector: `${taxIds} button:text-is("Remove")` },
    ],
    alt: 'WP Admin, POS → Settings → General on a site without Pro, Store tax IDs under the foot of the Refund & Returns Policy box and its hint, Brief statement that will appear on POS receipts: the description with its Learn more link, one row with Type US EIN, Value 93-4815162, Country United States (US) and an empty Custom label, Remove, and Add tax ID.',
  },
  {
    step: 2,
    slug: 'store-tax',
    url: 'wp-admin/admin.php?page=wcpos-store-edit&id={storeId:Harbour Street}#/tax',
    crop: [`${editor} aside[aria-label="Store menu"] nav`, `${editor} div:has(> h1)`, section('Tax'), section('Tax number printed on receipts')],
    pins: [
      { name: 'menu-tax', selector: `${editor} aside[aria-label="Store menu"] nav a[href$="#/tax"]` },
      { name: 'tax', selector: `${editor} main h3:text-is("Tax")` },
      { name: 'type', selector: `${row} [aria-label="Type"]` },
      { name: 'value', selector: `${row} input[aria-label="Value"]` },
      { name: 'country', selector: `${row} [aria-label="Country"]` },
      { name: 'label', selector: `${row} input[aria-label="Label"]` },
      { name: 'remove', selector: `${row} button:text-is("Remove")` },
      { name: 'add-tax-number', selector: `${editor} main button:text-is("Add tax number")` },
    ],
    alt: 'WP Admin, store editor for Harbour Street, Tax: the store menu with Tax current, the Tax section (Calculate tax using This store\'s address, and Rates that apply with the Set up rates in WooCommerce → Tax button), and Tax number printed on receipts with one row: US EIN, 93-4815162, United States (US) and an empty Label (optional), Remove, and Add tax number.',
  },
];
