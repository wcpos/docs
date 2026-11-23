// WP Admin shots for versioned_docs/version-2.x/getting-started/previous-versions.mdx (Previous Versions), in page order.
export const journey = 'PV';

const row = (file) => `#the-list tr[data-plugin="${file}"]:not(.plugin-update-tr)`;
const pro = row('woocommerce-pos-pro/woocommerce-pos-pro.php');
const wcpos = row('woocommerce-pos/woocommerce-pos.php');

export default [
  {
    step: 1,
    slug: 'plugins-auto-updates',
    url: 'wp-admin/plugins.php',
    // Only the header row and the WCPOS Pro and WCPOS rows: the Description column, Pro's licence-status
    // row, the "now standalone" row and WooCommerce's update row are hidden, and the table shrinks to its
    // content so the Plugin and Automatic Updates columns sit close together.
    prepare: async (page) => {
      await page.addStyleTag({
        content: `#the-list tr.woocommerce-pos-pro-license, #the-list tr.wcpos-free-plugin-notice,
          #the-list tr.plugin-update-tr[data-plugin="woocommerce/woocommerce.php"],
          table.plugins .column-description { display: none !important; }
          table.plugins { width: auto !important; }`,
      });
    },
    crop: ['table.plugins thead tr', pro, wcpos],
    pad: 0, // the default pad would show the bulk-actions bar above and the WooCommerce row below
    pins: [
      { name: 'automatic-updates', selector: 'table.plugins thead th.column-auto-updates' },
      { name: 'wcpos-auto-updates', selector: `${wcpos} td.column-auto-updates a` },
    ],
    alt: 'WP Admin, Plugins: the Automatic Updates column, empty for WCPOS Pro and reading Disable auto-updates for WCPOS.',
  },
];
