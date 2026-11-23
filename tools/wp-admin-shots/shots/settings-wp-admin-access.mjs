// WP Admin shots for versioned_docs/version-2.x/settings/wp-admin/access.mdx, in page order.
// The seed grants Editor "Use the POS", so Editor differs from the WCPOS defaults.
export const journey = 'AC';

const settings = '#woocommerce-pos-settings';
const url = 'wp-admin/admin.php?page=woocommerce-pos-settings#/access';
const role = (slug) => `[data-testid="access-role-${slug}"]`;
const dialog = '[role="dialog"]:has([data-testid="access-restore-confirm"])';
const advanced = '[data-testid="access-advanced"]';

export default [
  {
    step: 1,
    slug: 'screen',
    url,
    prepare: async (page) => {
      await page.click(role('shop_manager'));
      await page.locator(`${settings} main h2:text-is("What the Shop manager role can do")`).waitFor({ state: 'visible' });
    },
    // The role list and the task panel only: no Settings sidebar, no notice.
    crop: [`${settings} main ul:has(> [data-testid^="access-role-"])`, `${settings} main h2`, '[data-testid="access-restore-defaults"]', advanced],
    pins: [
      { name: 'role-shop-manager', selector: role('shop_manager') },
      { name: 'changed-dot', selector: `${role('editor')} span[title="Changed from the WCPOS defaults"]` },
      { name: 'heading', selector: `${settings} main h2` },
      { name: 'task-use-pos', selector: '[data-testid="access-task-use_pos"]' },
      { name: 'partial-badge', selector: `${settings} span[title^="2 of the 3"]` },
      { name: 'review', selector: `${settings} [data-testid="access-task-groups"] button:text-is("Review")` },
      { name: 'restore-defaults', selector: '[data-testid="access-restore-defaults"]' },
      { name: 'advanced', selector: '[data-testid="access-advanced-summary"]' },
    ],
    alt: 'WP Admin, POS → Settings → Access, the role list and its tasks: the roles Administrator to Cashier on the left, Shop manager selected and Editor marked with an amber dot. What the Shop manager role can do, using the WCPOS defaults: every task ticked except Manage customers, which shows a dash, a 2 of 3 badge and Review. Restore defaults is greyed out, and the Advanced individual capabilities bar is at the foot.',
  },
  {
    step: 2,
    slug: 'restore-dialog',
    url,
    prepare: async (page) => {
      await page.click(role('editor'));
      await page.click('[data-testid="access-restore-defaults"]');
      await page.locator(dialog).waitFor({ state: 'visible' });
    },
    crop: [dialog],
    pins: [
      { name: 'dialog-title', selector: `${dialog} h2` },
      { name: 'change-row', selector: `${dialog} p:has(> span)` },
      { name: 'confirm', selector: '[data-testid="access-restore-confirm"]' },
      { name: 'cancel', selector: `${dialog} button:text-is("Cancel")` },
    ],
    alt: 'WP Admin, POS → Settings → Access: the Remove POS privileges from Editor? dialog. WCPOS gives this role no POS access by default; permissions added by other plugins are left alone. What will change: Remove Use the POS. Cancel and Restore defaults buttons.',
  },
  {
    step: 3,
    slug: 'advanced',
    url,
    prepare: async (page) => {
      // The same URL is a same-document navigation: close step 2's dialog (Cancel is never the confirm).
      await page.keyboard.press('Escape');
      await page.locator(dialog).waitFor({ state: 'hidden' });
      await page.click(role('cashier'));
      await page.click('[data-testid="access-advanced-summary"]');
      await page.locator('[data-testid="access-capability-group-wcpos"]').waitFor({ state: 'visible' });
    },
    crop: [role('customer'), role('cashier'), '[data-testid="access-advanced-summary"]', `${advanced} div:has(> [data-testid="access-capability-group-wcpos"])`],
    pad: 8, // a 16 px pad slices the Manage customers row above Manage categories & tags
    maxHeight: 520,
    pins: [
      { name: 'advanced-heading', selector: '[data-testid="access-advanced-summary"]' },
      { name: 'group-wcpos', selector: '[data-testid="access-capability-group-wcpos"]' },
      { name: 'cap-cash', selector: `${advanced} div:has(> label:text-is("manage_woocommerce_pos_cash"))` },
      { name: 'cap-reports', selector: `${advanced} div:has(> label:text-is("view_woocommerce_pos_reports"))` },
      { name: 'cap-closures', selector: `${advanced} div:has(> label:text-is("manage_woocommerce_pos_closures"))` },
      { name: 'cap-reassign', selector: `${advanced} div:has(> label:text-is("reassign_woocommerce_pos_sales"))` },
    ],
    alt: 'WP Admin, POS → Settings → Access with Cashier selected and Advanced open: the note that each task is a set of these capabilities, and the WCPOS group with access_woocommerce_pos, manage_woocommerce_pos_cash and view_woocommerce_pos_reports ticked, and manage_woocommerce_pos, manage_woocommerce_pos_closures and reassign_woocommerce_pos_sales not ticked.',
  },
];
