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
    // Match the POS shot on the page (Alabama, 12345, no city): values staged in the browser only, the form is never submitted.
    prepare: (page) => page.evaluate(() => {
      const $ = window.jQuery;
      $('#woocommerce_store_address, #woocommerce_store_address_2, #woocommerce_store_city').val('');
      $('#woocommerce_store_postcode').val('12345');
      $('#woocommerce_default_country').val('US:AL').trigger('change');
    }),
    crop: section('Store Address'),
    pins: [
      { name: 'address-1', selector: control('woocommerce_store_address') },
      { name: 'city', selector: control('woocommerce_store_city') },
      { name: 'country-state', selector: control('woocommerce_default_country') },
      { name: 'postcode', selector: control('woocommerce_store_postcode') },
    ],
    alt: 'WooCommerce → Settings → General, Store Address: this is where your business is located; an empty Address line 1 and Address line 2, an empty City, Country / State United States (US) — Alabama and Postcode / ZIP 12345.',
  },
];
