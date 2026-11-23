// WP Admin shots for versioned_docs/version-2.x/reports/reconciliation.mdx, in page order.
export const journey = 'EC';

const settings = '#woocommerce-pos-settings';
const group = (heading) => `${settings} aside div:has(> h3:text-is("${heading}"))`;

export default [
  {
    step: 1,
    slug: 'export-closures',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/export-closures',
    // The settings nav down to its Tools group (cut above Account), the title and the screen.
    crop: [group('Settings'), group('Tools'), `${settings} div:has(> h1)`, `${settings} main > div`],
    pins: [
      { name: 'nav-export-closures', selector: '[data-testid="settings-nav-export-closures"]' },
      { name: 'download-csv', selector: '[data-testid="export-closures-download"]' },
    ],
    alt: 'WP Admin, POS → Settings → Export closures: the settings menu with Tools → Export closures current, the description of the CSV (one row per closure, figures as recorded at closing) and the Download CSV button.',
  },
];
