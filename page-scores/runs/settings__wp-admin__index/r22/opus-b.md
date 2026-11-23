<!-- page-scores run: doc=settings/wp-admin/index climb=settings__wp-admin__index round=22 judge=opus-b -->
I've read all seven sets and compared the anchors before scoring the page.

| Category | WP Admin Settings (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 8.5 | 8.5 | 8 | 6 | 7.5 |
| Language | 5.5 | 6 | 7.5 | 8 | 8 | 6 | 7 |
| Visuals | 6 | 3.5 | 8.5 | 8.5 | 9 | 3 | 3.5 |
| Structure | 6.5 | 6.5 | 8 | 8.5 | 8 | 6.5 | 7.5 |
| Layering | 7 | 7.5 | 8.5 | 8.5 | 8.5 | 7 | 5.5 |
| Consistency with approved pages | 6.5 | 6 | 9 | 9 | 9 | 4 | 4.5 |
| Accuracy signals | 7 | 7.5 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| **Average** | **6.43** | **6.21** | **8.36** | **8.50** | **8.43** | **5.71** | **6.14** |

**1. Find a setting, the settings menu screenshot (Visuals and Accuracy signals)**
- **What's wrong:** The shot has three markers, and they sit on the group headings (Settings, Tools, Account). The things a reader actually clicks have no markers: General, Checkout, Cloud Print, Access, Sessions, Extensions, Export closures, Logs and License. The approved pages put a marker on every control (Product Panel has 10). On a phone the markers also cover the headings they point to (`page/page-phone-02.png`).
- **Second problem:** The shot comes from a Pro site with three stores. The page needs a whole paragraph to explain that ("This shot is from a site with WCPOS Pro…"). The Store details shot a few lines further down comes from the free plugin, so the page shows two versions of General.
- **Smallest fix:** Move the markers from the three headings to the nine menu items and give each one a one-line legend entry. Swap in a free-plugin shot of the same menu so the explaining paragraph can go.

**2. Page title and opening lines (Language and Consistency)**
- **What's wrong:** The baseline title "Settings in the WordPress Admin" has become "WP Admin Settings". The page now opens on a code-styled path, `WP admin: WP Admin → POS → Settings`. The approved pages all open with a plain sentence about why you're here ("A customer walks up with something to buy…").
- **Inconsistent paths:** The page writes the same path two ways: `→` in code style at the top, then **POS > Settings** and **WP Admin > POS > Settings > General** in bold further down.
- **Unexplained terms:** Words like "Force SSL", "HTTPS" and "HOST121" appear without explanation.
- **Smallest fix:** Put back the plain title. Replace the opening line with one sentence, for example "These are the settings your manager changes once for every till, in WordPress under POS → Settings." Use the `>` style everywhere.

**3. If something goes wrong, and In This Section (Structure and Layering)**
- **Troubleshooting:** Some problems are open, with a bold lead-in (no POS menu, Stores instead of Store details, Cloudflare). Four others are hidden in collapsed boxes that look the same as the "What's on…" boxes higher up (receipt fonts ×2, checkout slower, "Help us make WCPOS better"). The approved pages show every problem openly with a bold lead-in, so each one can be found at a glance. Here, a reader skimming for their error message misses four of them.
- **In This Section cards:** The card descriptions have been cut down from the baseline's. Store Tax IDs no longer says "VAT, ABN, GSTIN, EIN"; Access no longer mentions the Cashier defaults or till permissions; Sessions no longer mentions signing out a departed cashier. Those words are what tell a reader which card holds their answer.
- **Left-hand menu:** The menu now lists **General** twice.
- **Smallest fix:** Turn the four troubleshooting boxes into bold-lead paragraphs like the ones around them, with any long detail in a box underneath. Restore the baseline's card descriptions. Remove the duplicate General entry from the menu.
