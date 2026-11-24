// WP Admin shots for versioned_docs/version-2.x/support/troubleshooting/critical-error.mdx, in page order.
// The fatal-errors entry is the seed's made-up PHP fatal, written through WooCommerce's logger (seed.php, support block).
export const journey = 'CX';

const logs = '.wrap.woocommerce';
const fatalErrorsUrl = 'wp-admin/admin.php?page=wc-status&tab=logs&source=fatal-errors';
const fileLink = `${logs} #the-list a.row-title:text-is("fatal-errors")`;
const settings = '#woocommerce-pos-settings';
const banner = `${settings} main > div > div:has(> div > a[href*="source=fatal-errors"])`;

export default [
  {
    step: 1,
    slug: 'wc-logs-fatal-errors',
    url: fatalErrorsUrl,
    crop: [`${logs} #logs-header`, `${logs} #logs-list-table-form .tablenav.top`, `${logs} table.log-files > thead`, `${logs} table.log-files #the-list`],
    padBottom: 1, // the table repeats its header in a footer row right below the file row
    pins: [{ name: 'file', selector: fileLink }],
    alt: 'WP Admin, WooCommerce → Status → Logs, Browse log files filtered to the fatal-errors source: one row, the fatal-errors log file, with its date created, date modified and file size.',
  },
  {
    step: 2,
    slug: 'wc-log-entry',
    url: fatalErrorsUrl,
    prepare: async (page) => {
      await page.locator(fileLink).click();
      await page.locator(`${logs} #logs-entries .log-entry`).first().waitFor({ state: 'visible' });
    },
    crop: [`${logs} #logs-header`, `${logs} #logs-entries`],
    pins: [
      { name: 'entry', selector: `${logs} #logs-entries .log-entry:has(.log-level--critical)` },
      { name: 'level', selector: `${logs} #logs-entries .log-level--critical` },
    ],
    alt: 'WP Admin, WooCommerce → Status → Logs, viewing a fatal-errors log file (its name ends in the date): one Critical entry, Uncaught Error: Call to undefined function hvl_points_balance() in /var/www/html/wp-content/plugins/harbour-loyalty/includes/class-points.php:87, with Additional context collapsed below it, and Download and Delete permanently buttons.',
  },
  {
    step: 3,
    slug: 'pos-settings-logs-banner',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/logs',
    crop: [`${settings} aside`, banner, `${settings} main > div > div:has(> div > button[aria-pressed])`],
    maxHeight: 460,
    pins: [
      { name: 'nav-logs', selector: '[data-testid="settings-nav-logs"]' },
      { name: 'banner', selector: banner },
      { name: 'wc-link', selector: `${banner} a:text-is("view in WooCommerce logs")` },
    ],
    alt: "WP Admin, POS → Settings → Logs: the settings menu with Logs under Tools current, the yellow notice Fatal errors detected — view in WooCommerce logs, the All, Errors and Warnings filters with Source set to All, and today's POS log entries below.",
  },
];
