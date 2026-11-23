// WP Admin shots for versioned_docs/version-2.x/settings/store/general.mdx (WooCommerce → Settings → General), in page order.
// Admin notices are hidden by capture.mjs and the crops start below them.
export const journey = 'SG';

const form = '#mainform';
const url = 'wp-admin/admin.php?page=wc-settings&tab=general';
// A section: its heading, the description that follows it, and its settings table.
const section = (heading) => [`${form} h2:text-is("${heading}")`, `${form} h2:text-is("${heading}") + div`, `${form} h2:text-is("${heading}") + div + table.form-table`];
const control = (id) => `${form} tr:has(label[for="${id}"]) td.forminp :is(.select2-container, input#${id})`;

export default [
  {
    step: 1,
    slug: 'store-address',
    url,
    crop: section('Store Address'),
    pins: [
      { name: 'address-1', selector: control('woocommerce_store_address') },
      { name: 'city', selector: control('woocommerce_store_city') },
      { name: 'country-state', selector: control('woocommerce_default_country') },
      { name: 'postcode', selector: control('woocommerce_store_postcode') },
    ],
    alt: 'WooCommerce → Settings → General, Store Address: this is where your business is located; Address line 1 12 Harbour Street, an empty Address line 2, City Portland, Country / State United States (US) — Oregon and Postcode / ZIP 97204.',
  },
  {
    step: 2,
    slug: 'currency-options',
    url,
    crop: section('Currency options'),
    pins: [
      { name: 'currency', selector: control('woocommerce_currency') },
      { name: 'currency-position', selector: control('woocommerce_currency_pos') },
      { name: 'thousand-separator', selector: control('woocommerce_price_thousand_sep') },
      { name: 'decimal-separator', selector: control('woocommerce_price_decimal_sep') },
      { name: 'decimals', selector: control('woocommerce_price_num_decimals') },
    ],
    alt: 'WooCommerce → Settings → General, Currency options: Currency United States (US) dollar ($) — USD, Currency position Left, Thousand separator a comma, Decimal separator a full stop and Number of decimals 2.',
  },
];
