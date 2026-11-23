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
  {
    step: 4,
    slug: 'bulk-edit',
    url: 'wp-admin/edit.php?post_type=product',
    settings: posOnlyOn,
    // Ticks two rows by title and opens Bulk Edit; nothing changes until Update, which is never pressed.
    prepare: async (page) => {
      for (const title of ['Stoneware Mug', 'Linen Tea Towel']) {
        await page.locator(`#the-list tr:has(a.row-title:text-is("${title}")) input[name="post[]"]`).check();
      }
      await page.locator('#bulk-action-selector-top').selectOption('edit');
      await page.locator('#doaction').click();
      await page.locator('#bulk-edit').waitFor({ state: 'visible' });
      // Opening the panel scrolls the page with a jQuery animation; let it finish before the crop is measured.
      await page.waitForFunction(() => !window.jQuery || window.jQuery(':animated').length === 0);
      await page.evaluate(() => document.activeElement?.blur());
    },
    // The panel is taller than 720px, so the crop ends just past the POS visibility row (Update is left out).
    crop: ['.tablenav.top', '#bulk-titles', '#bulk-edit label:has(select[name="_pos_visibility"])'],
    pins: [
      { name: 'bulk-actions', selector: '#bulk-action-selector-top' },
      { name: 'pos-visibility', selector: '#bulk-edit select[name="_pos_visibility"]' },
    ],
    alt: 'WP Admin, Products list with Stoneware Mug and Linen Tea Towel ticked and Bulk actions set to Bulk edit: the top of the Bulk Edit panel with the two products and POS visibility set to — No Change —.',
  },
  {
    step: 5,
    slug: 'variation-pos-visibility',
    url: 'wp-admin/post.php?post={productId:Linen Apron}&action=edit',
    settings: posOnlyOn,
    // Opens the Variations tab and the first variation only; nothing is saved without Save changes, which is never pressed.
    prepare: async (page) => {
      await page.locator('li.variations_tab a').click();
      await page.locator('#variable_product_options .woocommerce_variation').first().waitFor({ state: 'visible' });
      await page.waitForFunction(() => !window.jQuery || window.jQuery(':animated').length === 0);
      await page.locator('#variable_product_options .woocommerce_variation').first().locator('h3').click();
      await page.locator('#variable_product_options .woocommerce_variation').first().locator('.woocommerce_variable_attributes').waitFor({ state: 'visible' });
      await page.waitForFunction(() => !window.jQuery || window.jQuery(':animated').length === 0);
      await page.evaluate(() => document.activeElement?.blur());
    },
    // The open variation is about 1,170px from its header to POS visibility, so the crop starts at its Shipping class
    // row ("Same as parent") and ends with the next variation's header and Save changes; the header pin is left out.
    crop: [
      '#variable_product_options .woocommerce_variation >> nth=0 >> p.form-row:has(select[name^="variable_shipping_class"])',
      '#variable_product_options .woocommerce_variation >> nth=1 >> h3',
      '#variable_product_options .toolbar:has(button.save-variation-changes)',
    ],
    pad: 12,
    maxHeight: 720,
    pins: [
      { name: 'pos-visibility', selector: '#variable_product_options select[name^="variable_pos_visibility"] >> nth=0' },
      { name: 'save', selector: '#variable_product_options button.save-variation-changes' },
    ],
    alt: 'WP Admin, editing the Linen Apron product, Variations tab with the Natural variation open: the end of its fields, from Shipping class and Tax class (Same as parent) and Description to POS visibility set to POS & Online, then the Charcoal variation closed below it and the Save changes button.',
  },
];
