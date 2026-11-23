// WP Admin shots for versioned_docs/version-2.x/getting-started/previous-versions.mdx (Previous Versions), in page order.
export const journey = 'PV';

const row = (file) => `#the-list tr[data-plugin="${file}"]:not(.plugin-update-tr)`;
const wcpos = row('woocommerce-pos/woocommerce-pos.php');

export default [
  {
    step: 1,
    slug: 'plugins-auto-updates',
    url: 'wp-admin/plugins.php',
    // As upgrading-to-2's Plugins shot: Pro's licence-status row and WooCommerce's update row hidden,
    // Pro's "now standalone" row under WCPOS shown; WooCommerce's secure-connection box (not a .notice) hidden.
    prepare: async (page) => {
      await page.addStyleTag({
        content: `#the-list tr.woocommerce-pos-pro-license, #the-list tr.plugin-update-tr[data-plugin="woocommerce/woocommerce.php"] { display: none !important; }
          #the-list tr.wcpos-free-plugin-notice .notice { display: block !important; }`,
      });
      await page.locator('.wrap .woocommerce-message', { hasText: 'secure connection' })
        .evaluateAll((els) => els.forEach((el) => { el.style.display = 'none'; }));
    },
    // From the Plugins heading and Add Plugin down to the WCPOS "now standalone" notice row.
    crop: ['.wrap h1.wp-heading-inline', '.wrap a.page-title-action', '#the-list tr.wcpos-free-plugin-notice'],
    padBottom: 0, // the default pad would show the top of the WooCommerce row
    pins: [
      { name: 'add-plugin', selector: '.wrap a.page-title-action' },
      { name: 'automatic-updates', selector: 'table.plugins thead th.column-auto-updates' },
      { name: 'wcpos-auto-updates', selector: `${wcpos} td.column-auto-updates a` },
    ],
    alt: 'WP Admin, Plugins: the Add Plugin button beside the heading, the filter links and the Automatic Updates column, with no link for WCPOS Pro and Disable auto-updates for WCPOS.',
  },
];
