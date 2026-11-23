// WP Admin shots for versioned_docs/version-2.x/support/troubleshooting/totals-disagree.mdx, in page order.
// Admin notices are hidden by capture.mjs and the crops start below them.
export const journey = 'TW';

const form = '#mainform';
const rates = `${form} table.wc_tax_rates`;
const header = (n) => `${rates} thead th:nth-child(${n})`;
const section = (heading) => [`${form} h2:text-is("${heading}")`, `${form} h2:text-is("${heading}") + div`, `${form} h2:text-is("${heading}") + div + table.form-table`];

export default [
  {
    step: 1,
    slug: 'tax-options',
    url: 'wp-admin/admin.php?page=wc-settings&tab=tax',
    crop: [`${form} tr:has(input[name="woocommerce_prices_include_tax"])`, `${form} tr:has(#woocommerce_tax_round_at_subtotal)`],
    padBottom: 0,
    pins: [
      { name: 'prices-entered', selector: `${form} td.forminp:has(input[name="woocommerce_prices_include_tax"]) ul` },
      { name: 'rounding', selector: `${form} label:has(#woocommerce_tax_round_at_subtotal)` },
    ],
    alt: 'WooCommerce → Settings → Tax, Tax options: Prices entered with tax No, I will enter prices exclusive of tax; Calculate tax based on Customer shipping address; Shipping tax class based on cart items; and Rounding with Round tax at subtotal level, instead of rounding per line unticked.',
  },
  {
    step: 2,
    slug: 'standard-rates',
    url: 'wp-admin/admin.php?page=wc-settings&tab=tax&section=standard',
    prepare: (page) => page.locator(`${rates} #rates tr[data-id]`).first().waitFor({ state: 'visible' }),
    crop: [`${form} h3:has-text("tax rates")`, rates],
    pins: [
      { name: 'postcode', selector: header(3) },
      { name: 'city', selector: header(4) },
      { name: 'rate', selector: header(5) },
      { name: 'priority', selector: header(7) },
      { name: 'compound', selector: header(8) },
      { name: 'shipping', selector: header(9) },
    ],
    alt: 'WooCommerce → Settings → Tax, "Standard" tax rates with columns Country code, State code, Postcode / ZIP, City, Rate %, Tax name, Priority, Compound and Shipping: one rate for US, WA, any postcode and city, 10.2500, Sales tax, priority 1, not compound and applied to shipping.',
  },
  {
    step: 3,
    slug: 'currency-options',
    url: 'wp-admin/admin.php?page=wc-settings&tab=general',
    crop: section('Currency options'),
    pins: [{ name: 'decimals', selector: `${form} input#woocommerce_price_num_decimals` }],
    alt: 'WooCommerce → Settings → General, Currency options: the following options affect how prices are displayed on the frontend; Currency United States (US) dollar ($) — USD, Currency position Left, Thousand separator a comma, Decimal separator a full stop and Number of decimals 2.',
  },
];
