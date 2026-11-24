// WP Admin shots for versioned_docs/version-2.x/support/troubleshooting/response-error.mdx, in page order.
// The orders are the seed's three POS orders (seed.php, support block); steps 2 and 3 are critical-error's own shots.
import criticalError from './support-troubleshooting-critical-error.mjs';

export const journey = 'RX';

const list = '#posts-filter table.wp-list-table';
const status = (name) => `${list} #the-list tr.status-wc-${name} td.column-order_status mark`;
const shot = (slug) => criticalError.find((s) => s.slug === slug);

export default [
  {
    step: 1,
    slug: 'wc-orders',
    // This env stores orders as posts (HPOS off), so admin.php?page=wc-orders redirects here.
    url: 'wp-admin/edit.php?post_type=shop_order',
    crop: ['#posts-filter .search-box', '#posts-filter .tablenav.top', `${list} > thead`, `${list} #the-list`],
    padBottom: 1, // the table repeats its header in a footer row right below the last order
    pins: [
      { name: 'completed', selector: status('completed') },
      { name: 'processing', selector: status('processing') },
      { name: 'pending', selector: status('pending') },
    ],
    alt: 'WP Admin, WooCommerce → Orders: the status links All (3), Pending payment (1), Processing (1) and Completed (1), the search box, the bulk actions and filters row, then three POS orders, each with the POS order icon: #22 Hannah Brooks, Completed, $41.50; #26 Grace Lindqvist, Pending payment, $40.00; #24 Omar Haddad, Processing, $22.00.',
  },
  { ...shot('wc-log-entry'), step: 2 },
  { ...shot('pos-settings-logs-banner'), step: 3 },
];
