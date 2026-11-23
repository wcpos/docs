// WP Admin shots for versioned_docs/version-2.x/coupons/applying-coupons.mdx (WooCommerce coupons), in page order.
// Admin notices are hidden by capture.mjs and the crops start below them.
export const journey = 'CW';

const form = '#mainform';
const box = '#woocommerce-coupon-data';
const loyal5 = 'wp-admin/post.php?post={couponId:loyal5}&action=edit';
// Opens a Coupon data tab (view only, nothing is saved) and parks the pointer and focus away from it.
const openTab = (panel) => async (page) => {
  await page.locator(`${box} a[href="#${panel}"]`).click();
  await page.mouse.move(1, 1);
  await page.evaluate(() => document.activeElement?.blur());
};

export default [
  {
    step: 1,
    slug: 'coupon-list',
    url: 'wp-admin/edit.php?post_type=shop_coupon',
    // WooCommerce's HTTPS banner (an .updated message, not a .notice) and the Screen Options / Help tabs are hidden.
    prepare: (page) => page.addStyleTag({ content: '#message.woocommerce-message, #screen-meta-links { display: none !important; }' }),
    padBottom: 1,
    crop: ['.wrap h1.wp-heading-inline', '.wrap .page-title-action', 'table.wp-list-table'],
    pins: [
      { name: 'add-coupon', selector: '.wrap .page-title-action' },
      { name: 'mgr10', selector: 'table.wp-list-table a.row-title:text-is("mgr10")' },
    ],
    alt: 'WooCommerce coupons list: the Coupons heading with Add new coupon, All (2) and Published (2), and a table with columns Code, Coupon type, Coupon amount, Description, Product IDs, Usage / Limit and Expiry date; mgr10 is a Percentage discount of 10 (Manager discount) and loyal5 a Fixed cart discount of 5 (Loyalty reward), both used 0 times with no limit and no expiry date.',
  },
  {
    step: 2,
    slug: 'coupon-general',
    url: 'wp-admin/post.php?post={couponId:mgr10}&action=edit',
    crop: ['#titlediv', '#woocommerce-coupon-description', box],
    pins: [
      { name: 'code', selector: '#title' },
      { name: 'description', selector: '#woocommerce-coupon-description' },
      { name: 'discount-type', selector: '#discount_type' },
      { name: 'coupon-amount', selector: '#coupon_amount' },
      { name: 'expiry-date', selector: '#expiry_date' },
    ],
    alt: 'Edit coupon mgr10: the coupon code mgr10 with Generate coupon code, the description Manager discount, and Coupon data on its General tab with Discount type Percentage discount, Coupon amount 10, Allow free shipping unticked and an empty Coupon expiry date (YYYY-MM-DD).',
  },
  {
    step: 3,
    slug: 'coupon-usage-restriction',
    url: loyal5,
    prepare: openTab('usage_restriction_coupon_data'),
    // The Coupon data box down to its first group (spend limits and the two checkboxes); the product and category rows below are left out.
    crop: [`${box} .postbox-header`, `${box} ul.coupon_data_tabs`, '#usage_restriction_coupon_data > .options_group:first-child'],
    pins: [
      { name: 'tab', selector: `${box} li.usage_restriction_tab` },
      { name: 'minimum-spend', selector: '#minimum_amount' },
      { name: 'maximum-spend', selector: '#maximum_amount' },
      { name: 'individual-use', selector: '#individual_use' },
      { name: 'exclude-sale-items', selector: '#exclude_sale_items' },
    ],
    alt: 'Coupon data for loyal5 on the Usage restriction tab: Minimum spend 25, an empty Maximum spend (No maximum), and Individual use only and Exclude sale items both unticked.',
  },
  {
    step: 4,
    slug: 'coupon-usage-limits',
    url: loyal5,
    prepare: openTab('usage_limit_coupon_data'),
    crop: [box],
    pins: [
      { name: 'tab', selector: `${box} li.usage_limit_tab` },
      { name: 'limit-per-coupon', selector: '#usage_limit' },
      { name: 'limit-per-user', selector: '#usage_limit_per_user' },
    ],
    alt: 'Coupon data for loyal5 on the Usage limits tab: an empty Usage limit per coupon (Unlimited usage) and Usage limit per user 1.',
  },
  {
    step: 5,
    slug: 'coupon-settings',
    url: 'wp-admin/admin.php?page=wc-settings&tab=general',
    crop: [`${form} h2:text-is("Taxes and coupons")`, `${form} h2:text-is("Taxes and coupons") + div`, `${form} h2:text-is("Taxes and coupons") + div + table.form-table`],
    pins: [
      { name: 'enable-coupons', selector: `${form} label:has(#woocommerce_enable_coupons)` },
      { name: 'sequential', selector: `${form} label:has(#woocommerce_calc_discounts_sequentially)` },
    ],
    alt: 'WooCommerce → Settings → General, Taxes and coupons: Enable taxes with Enable tax rates and calculations ticked, and Enable coupons with Enable the use of coupon codes ticked (coupons can be applied from the cart and checkout pages) and Calculate coupon discounts sequentially unticked.',
  },
];
