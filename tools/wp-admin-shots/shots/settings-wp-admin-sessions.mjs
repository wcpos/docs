// WP Admin shots for versioned_docs/version-2.x/settings/wp-admin/sessions.mdx, in page order.
export const journey = 'SN';

const S = '#woocommerce-pos-settings';

export default [
  {
    step: 1,
    slug: 'people-and-sessions',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/sessions',
    crop: [`${S} main > div > div:nth-child(2)`],
    pad: 8,
    pins: [
      { name: 'filter-users', selector: `${S} main input[aria-label="Filter users"]` },
      { name: 'person', selector: `${S} main aside button[aria-pressed="true"]` },
      { name: 'logout-all', selector: `${S} main section button:text-is("Logout All")` },
      { name: 'terminate', selector: `${S} main section button:text-is("Terminate")` },
    ],
    alt: 'WP Admin, POS → Settings → Sessions: Maya Chen, Leo Park and Priya Nair on the left with their session counts, and Maya Chen selected on the right with Logout All and her desktop app and web browser sessions.',
  },
  {
    step: 2,
    slug: 'session-card',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/sessions',
    crop: [`${S} main section div:has(> div > details)`],
    pins: [
      { name: 'application', selector: `${S} main section h4` },
      { name: 'last-active', selector: `${S} main section span:text-is("Last active")` },
      { name: 'ip', selector: `${S} main section span:text-is("IP")` },
      { name: 'created', selector: `${S} main section span:text-is("Created")` },
      { name: 'user-agent', selector: `${S} main section summary` },
    ],
    alt: 'One session card: Desktop Application 1.8.6 on macOS, last active 2 minutes ago, its IP address, Created and Expires dates, the User Agent toggle and the Terminate button.',
  },
];
