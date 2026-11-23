// WP Admin shots for versioned_docs/version-2.x/stores/setup.mdx (Set Up Stores), in page order.
export const journey = 'SS';

const editor = '#wcpos-store-edit';
const section = (heading) => `${editor} main > * > *:has(h3:text-is("${heading}"))`;

export default [
  {
    step: 1,
    slug: 'stores-list',
    url: 'wp-admin/edit.php?post_type=wcpos_store',
    crop: ['#toplevel_page_woocommerce-pos', '.wrap'],
    padBottom: 0, // end on the POS menu's last item, not halfway into the next menu entry
    pins: [
      { name: 'menu-stores', selector: '#toplevel_page_woocommerce-pos .wp-submenu a[href*="post_type=wcpos_store"]' },
      { name: 'add-new-store', selector: '.wrap .page-title-action' },
    ],
    alt: 'WP Admin, POS → Stores: three stores listed with their address, authorized users and registers, and the Add New Store button.',
  },
  {
    step: 2,
    slug: 'new-store',
    url: 'wp-admin/post-new.php?post_type=wcpos_store',
    // The title bar, then only the Store name section of the Details panel.
    crop: [`${editor} div:has(> h1)`, `${editor} main > * > :nth-child(1)`],
    pins: [
      { name: 'store-name', selector: `${editor} main > * > :nth-child(1) input` },
      { name: 'create', selector: `${editor} button:text-is("Create")` },
    ],
    alt: 'WP Admin, POS → Stores → Add New Store: the store editor before it is created, with an empty Store name field and the Create button.',
  },
  {
    step: 3,
    slug: 'details',
    url: 'wp-admin/admin.php?page=wcpos-store-edit&id={storeId:Harbour Street}#/details',
    crop: [`${editor} div:has(> h1)`, `${editor} aside[aria-label="Store menu"]`, `${editor} main > *`],
    maxHeight: 860, // the whole Details panel, down to Web address
    pins: [
      { name: 'store-menu', selector: `${editor} aside[aria-label="Store menu"] nav` },
      { name: 'address-1', selector: `${editor} main > * > :nth-child(2) input` },
      { name: 'contact', selector: `${editor} h3:text-is("Contact")` },
    ],
    alt: 'WP Admin, store editor for Harbour Street, Details: the store menu on the left and the store name, address and Contact fields (phone, email, web address).',
  },
  {
    step: 4,
    slug: 'registers',
    url: 'wp-admin/admin.php?page=wcpos-store-edit&id={storeId:Harbour Street}#/registers',
    crop: [section('Tills'), section('Cash drawer rules')],
    pins: [
      // The Front counter row by its name: rows sort by name, so it is not the first.
      { name: 'opening-float', selector: '[data-testid^="register-row-"]:has-text("Front counter") input' },
      { name: 'register-menu', selector: '[data-testid^="register-row-"]:has-text("Front counter") [data-testid^="register-menu-"]' },
      { name: 'register-add', selector: '[data-testid="register-add"]' },
      { name: 'customise', selector: `${section('Cash drawer rules')} button:text-is("Customise")` },
    ],
    alt: 'WP Admin, store editor for Harbour Street, Registers: the Tills table with Café till and Front counter, their opening floats and status, + Add register, and the Cash drawer rules section.',
  },
  {
    step: 5,
    slug: 'staff',
    url: 'wp-admin/admin.php?page=wcpos-store-edit&id={storeId:Harbour Street}#/staff',
    crop: [section('Staff')],
    pins: [
      { name: 'only-these', selector: `${editor} label:has(input[name="staff-mode"][value="only"])` },
      { name: 'staff-row', selector: `${editor} li label:has-text("Maya Chen")` },
    ],
    alt: 'WP Admin, store editor for Harbour Street, Staff: Only these people is chosen and Alex Morgan, Maya Chen and Leo Park are ticked.',
  },
  {
    step: 6,
    slug: 'settings-stores',
    url: 'wp-admin/admin.php?page=woocommerce-pos-settings',
    crop: ['#woocommerce-pos-settings main > div:has(h3:text-is("Stores"))'],
    pins: [
      { name: 'edit', selector: '#woocommerce-pos-settings a[href*="page=wcpos-store-edit"]' },
      { name: 'manage-stores', selector: '#woocommerce-pos-settings main > div:has(h3:text-is("Stores")) a:text-is("Manage stores")' },
    ],
    alt: 'WP Admin, POS → Settings → General, Stores section: the three stores with their addresses, an Edit link for each and the Manage stores button.',
  },
  {
    step: 7,
    slug: 'product-store-prices',
    url: 'wp-admin/post.php?post={productId:Stoneware Mug}&action=edit',
    // The whole Product data box (its tabs and the General panel), cut on the box's own border.
    crop: ['#woocommerce-product-data'],
    pad: 0,
    pins: [
      { name: 'store-prices', selector: '#general_product_data p.form-field:has(label:has-text("Harbour Street")) input[type="checkbox"]' },
      { name: 'store-regular-price', selector: '#general_product_data input[id^="_pos_regular_price_store_"]:visible' },
    ],
    alt: 'WP Admin, editing the Stoneware Mug product, General tab: Enable Harbour Street specific prices. is ticked, with its own Regular price of 16.00.',
  },
  {
    step: 8,
    slug: 'cash-drawer-rules',
    url: 'wp-admin/admin.php?page=wcpos-store-edit&id={storeId:Harbour Street}#/registers',
    // Customise only expands the rules (aria-expanded); it saves nothing, so there is nothing to undo.
    prepare: async (page) => {
      await page.locator(`${section('Cash drawer rules')} button:text-is("Customise")`).click();
      await page.locator(`${section('Cash drawer rules')} button[role="switch"]`).first().waitFor({ state: 'visible' });
    },
    crop: [section('Cash drawer rules')],
    pins: [
      { name: 'open-close-toggle', selector: `${section('Cash drawer rules')} button[role="switch"]` },
      { name: 'site-default', selector: `${section('Cash drawer rules')} span:text-is("Site default")` },
    ],
    alt: 'WP Admin, store editor for Harbour Street, Registers, Cash drawer rules after Customise: the Site defaults chip and one rule, Open and close the register each day (cashiers start with a float and count the drawer at close), switched off and marked Site default.',
  },
];
