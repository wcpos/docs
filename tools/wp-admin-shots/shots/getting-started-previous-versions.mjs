// WP Admin shots for versioned_docs/version-2.x/getting-started/previous-versions.mdx (Previous Versions), in page order.
export const journey = 'PV';

const row = (file) => `#the-list tr[data-plugin="${file}"]:not(.plugin-update-tr)`;
const wcpos = row('woocommerce-pos/woocommerce-pos.php');
const woo = row('woocommerce/woocommerce.php');

export default [
  {
    step: 1,
    slug: 'plugins-auto-updates',
    url: 'wp-admin/plugins.php',
    // As upgrading-to-2's Plugins shot: Pro's licence-status row and WooCommerce's update row hidden,
    // Pro's "now standalone" row under WCPOS shown.
    prepare: async (page) => {
      await page.addStyleTag({
        content: `#the-list tr.woocommerce-pos-pro-license, #the-list tr.plugin-update-tr[data-plugin="woocommerce/woocommerce.php"] { display: none !important; }
          #the-list tr.wcpos-free-plugin-notice .notice { display: block !important; }`,
      });
    },
    // From the Plugins heading and Add Plugin down to the WooCommerce row.
    crop: ['.wrap h1.wp-heading-inline', '.wrap a.page-title-action', woo],
    pins: [
      { name: 'add-plugin', selector: '.wrap a.page-title-action' },
      { name: 'automatic-updates', selector: 'table.plugins thead th.column-auto-updates' },
      { name: 'wcpos-auto-updates', selector: `${wcpos} td.column-auto-updates a` },
    ],
    alt: 'WP Admin, Plugins: the Add Plugin button beside the heading and the Automatic Updates column, where WCPOS reads Disable auto-updates and WCPOS Pro and WooCommerce read Enable auto-updates.',
  },
];
