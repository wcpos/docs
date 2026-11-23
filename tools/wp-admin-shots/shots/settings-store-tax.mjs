// WP Admin shots for versioned_docs/version-2.x/settings/store/tax.mdx (WooCommerce tax settings), in page order.
// Admin notices are hidden by capture.mjs and the crops start below them.
export const journey = 'TX';

const form = '#mainform';

export default [
  {
    step: 1,
    slug: 'enable-taxes',
    url: 'wp-admin/admin.php?page=wc-settings&tab=general',
    // Enable taxes sits in WooCommerce's Taxes and coupons section, shown with its heading and description.
    crop: [`${form} h2:text-is("Taxes and coupons")`, `${form} h2:text-is("Taxes and coupons") + div`, `${form} tr:has(#woocommerce_calc_taxes)`],
    pins: [{ name: 'enable-taxes', selector: `${form} label:has(#woocommerce_calc_taxes)` }],
    alt: 'WooCommerce → Settings → General, Taxes and coupons: Enable taxes with Enable tax rates and calculations ticked; rates will be configurable and taxes will be calculated during checkout.',
  },
];
