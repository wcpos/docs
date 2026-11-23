// WP Admin shots for versioned_docs/version-2.x/support/troubleshooting/cloudflare.mdx, in page order.
// The callout's input is the CF-Ray request header the plugin reads (Cloudflare_Detector), sent by the browser
// with a made-up ray id. The header stays on this run's page, so this is the run's last (and only) shot.
export const journey = 'CF';

const callout = '[data-testid="cloudflare-callout"]';

export default [
  {
    step: 1,
    slug: 'general-cloudflare-notice',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/general',
    prepare: async (page) => {
      await page.setExtraHTTPHeaders({ 'CF-Ray': '8f2c4a1b3d5e6f70-SEA' });
      await page.reload({ waitUntil: 'networkidle' });
      await page.locator(callout).waitFor({ state: 'visible' });
    },
    crop: ['[data-testid="settings-nav-general"]', callout],
    pins: [
      { name: 'nav-general', selector: '[data-testid="settings-nav-general"]' },
      { name: 'callout-title', selector: `${callout} div:text-is("Your store is behind Cloudflare")` },
      { name: 'rule-link', selector: `${callout} a:text-is("How to add the rule")` },
    ],
    alt: 'WP Admin, POS → Settings → General: the settings menu with General current, and at the top of the General screen the blue callout Your store is behind Cloudflare, which says Cloudflare\'s security checks (Bot Fight Mode, Under Attack Mode and WAF challenges) can stop the WCPOS app reaching the REST API and that the fix is a WAF Skip rule for /wp-json/ or turning off Bot Fight Mode, with the link How to add the rule.',
  },
];
