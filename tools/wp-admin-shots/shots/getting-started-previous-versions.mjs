// WP Admin shots for versioned_docs/version-2.x/getting-started/previous-versions.mdx (Previous Versions), in page order.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const journey = 'PV';

const CACHE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.cache');

const row = (file) => `#the-list tr[data-plugin="${file}"]:not(.plugin-update-tr)`;
const pro = row('woocommerce-pos-pro/woocommerce-pos-pro.php');
const wcpos = row('woocommerce-pos/woocommerce-pos.php');

// A zip of the installed free plugin with only its header Version changed to 1.11.0, rebuilt every run.
function olderZip() {
  const dir = path.join(CACHE, 'pv-older');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'woocommerce-pos'), { recursive: true });
  const main = fs.readFileSync(path.join(CACHE, 'plugins', 'woocommerce-pos', 'woocommerce-pos.php'), 'utf8');
  const older = main.replace(/^( \* Version:\s+)2\.0\.5$/m, (line, lead) => `${lead}1.11.0`);
  if (older === main) throw new Error('woocommerce-pos.php has no "Version: 2.0.5" header line');
  fs.writeFileSync(path.join(dir, 'woocommerce-pos', 'woocommerce-pos.php'), older);
  execFileSync('/usr/bin/zip', ['-qr', 'woocommerce-pos.zip', 'woocommerce-pos'], { cwd: dir });
  return path.join(dir, 'woocommerce-pos.zip');
}

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
  {
    step: 2,
    slug: 'replace-plugin',
    url: 'wp-admin/plugin-install.php?tab=upload',
    // Uploads the older zip and stops on the comparison screen. Never clicks Replace current with
    // uploaded or Cancel and go back, so the installed plugin is not changed.
    prepare: async (page) => {
      await page.setInputFiles('#pluginzip', olderZip());
      await Promise.all([page.waitForURL(/update\.php/, { waitUntil: 'networkidle', timeout: 120000 }), page.click('#install-plugin-submit')]);
      await page.getByText('This plugin is already installed.').waitFor({ state: 'visible', timeout: 60000 });
      // Narrow the screen so the full-width warning line wraps beside the comparison table.
      await page.addStyleTag({ content: '.wrap { max-width: 640px; }' });
    },
    crop: ['h2.update-from-upload-heading', 'table.update-from-upload-comparison', 'p.update-from-upload-notice', 'p.update-from-upload-actions'],
    pins: [
      { name: 'uploaded-version', selector: 'table.update-from-upload-comparison td.warning' },
      { name: 'older-warning', selector: 'p.update-from-upload-notice' },
      { name: 'replace', selector: 'a.update-from-upload-overwrite' },
    ],
    alt: 'WP Admin, This plugin is already installed: Current 2.0.5 beside Uploaded 1.11.0, the warning that you are uploading an older version, and the Replace current with uploaded button.',
  },
];
