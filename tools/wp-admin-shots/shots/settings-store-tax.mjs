// WP Admin shots for versioned_docs/version-2.x/settings/store/tax.mdx (WooCommerce tax settings), in page order.
// Admin notices are hidden by capture.mjs and the crops start below them.
export const journey = 'TX';

const form = '#mainform';
// A settings row's control: a select (select2), radio or checkbox fieldset, or text input.
const control = (id) => `${form} tr:has(label[for="${id}"]) td.forminp :is(.select2-container, fieldset, input#${id})`;

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
  {
    step: 2,
    slug: 'tax-options',
    url: 'wp-admin/admin.php?page=wc-settings&tab=tax',
    // Not hidden by capture.mjs: the plain-HTTP warning above the subnav (its foot fell in the pad)
    // and the fixed 1 px layout footer, which drew a rule across the shot at the viewport's foot.
    prepare: (page) => page.addStyleTag({ content: '#mainform #message.woocommerce-message, .woocommerce-layout__footer { display: none !important; }' }),
    crop: [`${form} ul.subsubsub`, `${form} h2:text-is("Tax options")`, `${form} h2:text-is("Tax options") ~ table.form-table`],
    maxHeight: 820,
    pins: [
      { name: 'prices-entered-with-tax', selector: control('woocommerce_prices_include_tax') },
      { name: 'calculate-tax-based-on', selector: control('woocommerce_tax_based_on') },
      { name: 'shipping-tax-class', selector: control('woocommerce_shipping_tax_class') },
      { name: 'rounding', selector: control('woocommerce_tax_round_at_subtotal') },
      { name: 'display-prices-shop', selector: control('woocommerce_tax_display_shop') },
      { name: 'display-prices-cart', selector: control('woocommerce_tax_display_cart') },
      { name: 'price-display-suffix', selector: control('woocommerce_price_display_suffix') },
      { name: 'display-tax-totals', selector: control('woocommerce_tax_total_display') },
    ],
    alt: 'WooCommerce → Settings → Tax, Tax options (with links to Standard rates, Reduced rate rates and Zero rate rates): Prices entered with tax set to No, I will enter prices exclusive of tax; Calculate tax based on Customer shipping address; Shipping tax class based on cart items; Rounding not ticked; Additional tax classes Reduced rate and Zero rate; Display prices in the shop and during cart and checkout Excluding tax; an empty Price display suffix; Display tax totals Itemized.',
  },
];
