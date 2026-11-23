// WP Admin shots for versioned_docs/version-2.x/getting-started/pro-license.mdx (Pro License), in page order.
// Nothing here clicks Activate or Deactivate: the WCPOS licence server is never called.
export const journey = 'LK';

const app = '#woocommerce-pos-settings';
const licenseUrl = 'wp-admin/admin.php?page=woocommerce-pos-settings#/license';
// The activated card's text column; its lines are full-column blocks, shrunk to their text in prepare.
const thanks = `${app} main .wcpos\\:col-span-2`;
// The License screen's settings request, as /wp-json/… or ?rest_route=… (apiFetch uses either).
const isLicenseGet = (url) => decodeURIComponent(url.href).includes('wcpos/v2/settings/license');

export default [
  {
    step: 1,
    slug: 'upload-plugin',
    url: 'wp-admin/plugin-install.php?tab=upload',
    // The heading row (its toggle reads Browse Plugins here), then the upload box's help line and form.
    crop: ['.wrap.plugin-install-tab-upload > h1', '.upload-plugin .install-help', '.upload-plugin .wp-upload-form'],
    pins: [
      { name: 'choose-file', selector: '#pluginzip' },
      { name: 'install-now', selector: '#install-plugin-submit' },
    ],
    alt: 'WP Admin, Add Plugins heading with the Browse Plugins button above the box for a plugin in .zip format, its Choose File field and the Install Now button.',
  },
  {
    step: 2,
    slug: 'license-active',
    url: licenseUrl,
    // The docs env's licence is fake; its key is masked to the shape of a shortened real key.
    prepare: async (page) => {
      await page.getByText('Thank You!').waitFor({ state: 'visible' });
      await page.locator(`${app} main code`).evaluate((el) => { el.textContent = 'XXXXXXXXX...XXXXXXXX'; });
      await page.addStyleTag({ content: `${thanks} > * { width: fit-content; }` });
    },
    // The content card only: the confetti, Thank You!, the activated and support lines, Deactivate.
    crop: [`${app} main img.emoji`, `${thanks} > h3`, `${thanks} > p:has(> code)`,
      `${thanks} > p:last-of-type`, `${thanks} > button`],
    pad: 24,
    pins: [
      { name: 'license-key', selector: `${app} main code` },
      { name: 'deactivate', selector: `${app} main button:text-is("Deactivate")` },
    ],
    alt: 'WP Admin, POS → Settings → License with the licence active: Thank You!, License XXXXXXXXX...XXXXXXXX has been activated, and the Deactivate button.',
  },
  {
    step: 3,
    slug: 'license-key',
    url: licenseUrl,
    // The same screen as a site whose licence is not activated: the license GET is answered with the
    // real response, activated false and the key emptied, for one reload only.
    prepare: async (page) => {
      await page.route(isLicenseGet, async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        const response = await route.fetch();
        const json = { ...(await response.json()), activated: false, key: '' };
        return route.fulfill({ response, json });
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.addStyleTag({ content: '.notice, .update-nag, #wpfooter { display: none !important; }' });
      await page.locator('#license-key').waitFor({ state: 'visible' });
      await page.unroute(isLicenseGet);
    },
    // The form row only: the License Key label, the field and the Activate button.
    crop: [`${app} main .wcpos\\:sm\\:justify-end > div`, '#license-key', `${app} main button:text-is("Activate")`],
    pad: 24,
    pins: [
      { name: 'license-key-field', selector: '#license-key' },
      { name: 'activate', selector: `${app} main button:text-is("Activate")` },
    ],
    alt: 'WP Admin, POS → Settings → License before a key is activated: an empty License Key field and the Activate button, greyed out until a key is entered.',
  },
];
