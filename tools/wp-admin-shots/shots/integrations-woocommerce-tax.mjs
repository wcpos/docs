// WP Admin shots for versioned_docs/version-2.x/integrations/woocommerce-tax.mdx (WooCommerce tax settings), in page order.
// Admin notices are hidden by capture.mjs and the crops start below them.
export const journey = 'WT';

const form = '#mainform';
const rates = `${form} table.wc_tax_rates`;
const editor = '#wcpos-store-edit';

export default [
  {
    step: 1,
    slug: 'standard-rates',
    url: 'wp-admin/admin.php?page=wc-settings&tab=tax&section=standard',
    prepare: (page) => page.locator(`${rates} #rates tr[data-id]`).first().waitFor({ state: 'visible' }),
    crop: [`${form} h3:has-text("tax rates")`, rates],
    pins: [
      { name: 'rate-row', selector: `${rates} #rates tr[data-id] td.rate` },
      { name: 'postcode', selector: `${rates} thead th:nth-child(3)` },
      { name: 'city', selector: `${rates} thead th:nth-child(4)` },
    ],
    alt: 'WooCommerce → Settings → Tax, "Standard" tax rates: one rate for country US, state WA, any postcode and any city, Rate % 10.2500, Tax name Sales tax, Priority 1, not compound and applied to shipping, with Insert row, Remove selected row(s), Import CSV and Export CSV below.',
  },
  {
    step: 2,
    slug: 'store-tax',
    url: 'wp-admin/admin.php?page=wcpos-store-edit&id={storeId:Harbour Street}#/tax',
    crop: [`${editor} aside[aria-label="Store menu"] nav`, `${editor} div:has(> h1)`, `${editor} main > * > *:has(h3:text-is("Tax"))`],
    padBottom: 0,
    pins: [
      { name: 'menu-tax', selector: `${editor} aside[aria-label="Store menu"] nav a[href$="#/tax"]` },
      { name: 'calculate-using', selector: `${editor} select[aria-label="Calculate tax using"]` },
      { name: 'set-up-rates', selector: `${editor} main a:has-text("Set up rates in WooCommerce")` },
    ],
    alt: 'WP Admin, store editor for Harbour Street, Tax: the store menu with Tax current and marked Set up, and the Tax section with Calculate tax using This store\'s address (the tax rate is looked up for this address) and Rates that apply: no rate matches this store\'s address, so sales here are not taxed until a rate covers it, with the Set up rates in WooCommerce → Tax button.',
  },
];
