// WP Admin shots for versioned_docs/version-2.x/getting-started/upgrading-to-2.mdx (Upgrading to 2.0), in page order.
export const journey = 'UG';

const row = (file) => `#the-list tr[data-plugin="${file}"]:not(.plugin-update-tr)`;
const pro = row('woocommerce-pos-pro/woocommerce-pos-pro.php');
const wcpos = row('woocommerce-pos/woocommerce-pos.php');
const woo = row('woocommerce/woocommerce.php');

export default [
  {
    step: 1,
    slug: 'plugins',
    url: 'wp-admin/plugins.php',
    // Hidden: Pro's licence-status row (the docs env's offline message) and WooCommerce's update row.
    // Shown: Pro's "now standalone" row under WCPOS, whose .notice the tool's hide CSS would hide.
    // Each row keeps its version line but not its description, and the table shrinks to under 800 px.
    prepare: async (page) => {
      await page.addStyleTag({
        content: `#the-list tr.woocommerce-pos-pro-license, #the-list tr.plugin-update-tr[data-plugin="woocommerce/woocommerce.php"] { display: none !important; }
          #the-list tr.wcpos-free-plugin-notice .notice { display: block !important; }
          #the-list .column-description .plugin-description { display: none !important; }
          table.plugins { width: auto !important; max-width: 780px; }`,
      });
    },
    crop: ['table.plugins thead', woo],
    pad: 0,
    pins: [
      { name: 'pro-version', selector: `${pro} .plugin-version-author-uri` },
      { name: 'standalone-notice', selector: '#the-list tr.wcpos-free-plugin-notice .notice' },
      { name: 'woocommerce-version', selector: `${woo} .plugin-version-author-uri` },
      { name: 'wcpos-auto-updates', selector: `${wcpos} td.column-auto-updates a` },
    ],
    alt: 'WP Admin, Plugins: WCPOS Pro 2.0.5 active, WCPOS 2.0.5 inactive with the notice that WooCommerce POS Pro is now standalone and the free plugin can be deactivated and deleted, WooCommerce 10.4.3 active, and Disable auto-updates in the Automatic Updates column for WCPOS.',
  },
];
