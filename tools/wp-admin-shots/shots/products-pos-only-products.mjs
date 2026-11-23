// WP Admin shots for versioned_docs/version-2.x/products/pos-only-products.mdx, in page order.
export const journey = 'PV';

const settings = '#woocommerce-pos-settings';
const products = `${settings} main > div:has(h3:text-is("Products"))`;
// The POS visibility row renders only while the general setting is on; it is switched on for each shot
// and undone after it.
const posOnlyOn = { woocommerce_pos_settings_general: { pos_only_products: true } };
const product = 'wp-admin/post.php?post={productId:Stoneware Mug}&action=edit';

// Edit beside POS visibility opens the choices; it changes nothing until Update, which is never pressed.
const openChoices = async (page) => {
  await page.locator('#pos-visibility-show').click();
  await page.locator('#pos-visibility-select').waitFor({ state: 'visible' });
};

export default [
  {
    step: 1,
    slug: 'general-products',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings#/general',
    settings: posOnlyOn,
    crop: [products],
    pins: [
      { name: 'pos-only-products', selector: `${products} div:has(> div > label:text-is("Enable POS only products")) > button[role="switch"]` },
    ],
    alt: 'WP Admin, POS → Settings → General, Products section: Enable POS only products switched on, Enable decimal quantities off, Restore stock on order delete on, and the Barcode Field set to _global_unique_id.',
  },
  {
    step: 2,
    slug: 'publish-box-choices',
    url: product,
    settings: posOnlyOn,
    prepare: openChoices,
    crop: ['#submitdiv'],
    pins: [
      { name: 'pos-visibility', selector: '#pos-visibility-display' },
      { name: 'pos-only', selector: '#pos-visibility-select label:has(input[value="pos_only"])' },
      { name: 'ok', selector: '#pos-visibility-save' },
      { name: 'update', selector: '#publish' },
    ],
    alt: 'WP Admin, editing the Stoneware Mug product, Publish box after Edit beside POS visibility: the choices POS & Online (chosen), POS Only and Online Only, with OK and Cancel, and the Update button.',
  },
  {
    step: 3,
    slug: 'publish-box-pos-only',
    url: product,
    settings: posOnlyOn,
    // POS Only and OK change the box on the page only; nothing is saved without Update.
    prepare: async (page) => {
      await openChoices(page);
      await page.locator('#pos-visibility-select input[value="pos_only"]').check();
      await page.locator('#pos-visibility-save').click();
      await page.locator('#pos-visibility-select').waitFor({ state: 'hidden' });
      await page.evaluate(() => document.activeElement?.blur());
    },
    crop: ['#submitdiv'],
    pins: [
      { name: 'pos-visibility', selector: '#pos-visibility-display' },
      { name: 'catalog-visibility', selector: '#catalog-visibility-display' },
      { name: 'catalog-note', selector: '#pos-visibility-catalog-note' },
    ],
    alt: 'WP Admin, editing the Stoneware Mug product, Publish box after choosing POS Only and OK: POS visibility: POS Only, Catalog visibility: Hidden, and the note that POS Only products are never shown in the online catalog or search.',
  },
];
