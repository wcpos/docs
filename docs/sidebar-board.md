# The 2.x sidebar board (draft for Paul, roadmap#534)

**Status: draft, and far from the bar.** Structure round 1 (7 Nov 2026) was kept and is on `main` as docs#596. It scores **6.0** against a bar of **9.0, twice in a row**, and **findability is 13 of 58** real questions answered in two clicks or fewer. Paul approves or amends this board once (#526 §3); after that, tickets add, rename and nest leaves inside their own journey or area, and only a sweep's cross-page ticket moves a page between top-level sections.

Sources: the old tree is `versioned_sidebars/version-2.x-sidebars.json` before docs#596; the new tree is the same file on `main` at `4e1caa31`. Scores are from the structure-round judge (GPT-6 Astra, high effort, fresh context, blind A/B, 58 questions from the support archive, Discord, web docs questions and GitHub `question` issues). The ten IA problems are the ledger's (`docs/research/2026-11-03-docs-completeness-ledger.md` on roadmap branch `research/docs-completeness-ledger`).

## Round 1 scores

| Category | Old tree | Tree on main | Bar |
|---|---:|---:|---:|
| Findability: clear hits within two clicks | 2.5 (5/58) | 3.5 (13/58) | 9.0 |
| Naming | 5.5 | 7 | 9.0 |
| Duplication | 5.5 | 6.5 | 9.0 |
| Orphans | 5 | 6 | 9.0 |
| Order | 6 | 7 | 9.0 |
| **Average** | **4.9** | **6.0** | **9.0** |

Two caveats on the 6.0:

- The judge saw **Hardware → Customer Display** and **Hardware → Card Readers**, and scored question 10 ("supported card terminals") a hit on Card Readers. Neither page exists yet, so neither is in the sidebar on `main`: today `/customer-display` and `/hardware/card-readers` are interim redirects (docs#576), and J2 ticket 2 and J0 ticket 2 write the pages and delete the redirects (#526 §3b). On the tree as shipped, findability is 12 of 58.
- After the round, **Payment Gateways → All Gateways** (`payment/gateways/index`) was added so flattening the Gateways level did not orphan it. The judge did not see that line.

## Using the POS: the shift, in order

#522 §1 rules *Using the POS* as the cashier's shift. All twelve journey steps are now in that order, plus Keyboard Shortcuts at the end.

| # | Shift step (#522) | Sidebar on main | Page | Was |
|---:|---|---|---|---|
| 1 | Set up a device | Set Up a Device | `getting-started/connect` | Getting Started → Connect |
| 2 | Open the register | Open the Register (J1 proof) | `pos/register/index` | Using the POS → Open the Register |
| 3 | Find a product | Find a Product (J12 proof) | `pos/product-panel/index` | Product Panel |
| 4 | Sell to a guest | Sell to a Guest (J2 proof) | `pos/checkout/index` | Checkout |
| 5 | Sell to a customer | Sell to a Customer | `pos/cart/index` | Cart |
| 6 | Park and resume | Park and Resume an Order | `pos/cart/open-orders` | Cart → Open Orders |
| 7 | Discounts and coupons | Discounts and Coupons | `pos/cart/discounts` | Cart → Discounts; Coupons |
| 8 | Variations | Sell a Variation | `pos/product-panel/variations` | Product Panel → Variations |
| 9 | Refund | Refund a Sale | `pos/refunds` | Refunds |
| 10 | Offline | Work Offline | `getting-started/offline` | Getting Started → Offline Mode |
| 11 | Receipt and the Paid moment | Receipts and the Paid Screen | `receipts/at-checkout` | Receipts → Receipts (sixth of seven) |
| 12 | Close the register | Close the Register | `pos/reconciliation` | End-of-Day Reconciliation |
| — | — | Keyboard Shortcuts | `settings/store/hotkeys` | Settings → Store Settings |

## Old tree beside the tree on main

Only the sections that changed. Extensions, Integrations, Help & Troubleshooting and Developer Reference are unchanged; Receipts lost one page to *Using the POS*.

| Old tree | Tree on main |
|---|---|
| **Getting Started** | **Getting Started** |
| Is WCPOS right for you? | Is WCPOS Right for You? |
| What's new in 2.0 | Free vs Pro |
| Upgrading to 2.0 | Install WCPOS |
| Installation | Activate Your Pro Licence |
| Free vs Pro | Upgrading to 2.0 |
| WCPOS Pro | What's New |
| Previous Versions | Previous Versions |
| Connect *(→ Using the POS)* | Roadmap |
| Offline Mode *(→ Using the POS)* | |
| Roadmap | |
| **Using the POS** | **Using the POS** |
| Open the Register | Set Up a Device |
| Product Panel: Search & Filtering, Barcode Scanning, Variations, Meta Data Keys, Display Settings | Open the Register |
| Cart: Line Items, Discounts, Open Orders, Order Actions | Find a Product: Search and Filters, Scan a Barcode, Product Display Settings, Custom Fields |
| Checkout: The Tender Pane, Payment Methods, Taking a Payment, Split Payments, Tips, Cancelling a Payment, The Legacy Tab, Troubleshooting | Sell to a Guest: The Tender Screen, Payment Methods, Take a Payment, Split a Payment, Tips, Cancel a Payment, The Legacy Tab, Checkout Problems |
| Coupons: Applying Coupons | Sell to a Customer: Edit Cart Lines |
| Refunds | Park and Resume an Order: Order Actions |
| End-of-Day Reconciliation | Discounts and Coupons: Apply a Coupon |
| | Sell a Variation |
| | Refund a Sale |
| | Work Offline |
| | Receipts and the Paid Screen |
| | Close the Register |
| | Keyboard Shortcuts |
| **Managing Your Store** | **Managing Your Store** |
| Products: POS Only Products, Download & Sync | Orders: Refunds from Orders |
| Orders: Refunds | Products: POS-Only Products, Product Sync |
| Customers | Customers |
| Stores: Setup Walkthrough; Stores, Registers and Devices | Coupons *(was under Using the POS)* |
| Reports: Reconciliation Walkthrough | Reports: Register Closures |
| | Stores: Set Up a Store; Registers and Devices |
| **Settings** | **Settings** *(now before Receipts)* |
| WordPress Admin: General, Store Tax IDs, Customer Tax IDs, Access, Checkout, Email Notifications, Sessions, Register | POS Settings: General, Tax, Barcode Scanning, Theme |
| Store Settings: General, Tax, Barcode, Keyboard Shortcuts, Theme | WordPress Admin: General, Store Tax IDs, Customer Tax IDs, Access and Roles, Checkout, Email Notifications, Sessions, Registers |
| **Receipts**: Customise Your Receipt, HTML Templates, Thermal Templates, Receipt Data, Cloud Printing, Receipts, Online Store Receipts | **Receipts**: the same, without Receipts (now *Receipts and the Paid Screen*) |
| **Hardware**: Receipt Printers (16 leaves), Barcode Scanners | **Hardware**: unchanged on `main`; Customer Display and Card Readers wait for their pages |
| **Payment Gateways** → Gateways → eleven gateways | **Payment Gateways** → All Gateways, then the eleven gateways one level up |

## The ten IA problems in the ledger

| # | Ledger problem | Round 1 answer | State |
|---:|---|---|---|
| 1 | The cashier's first task is filed under Reports; one task, five homes. | Open the Register and Close the Register sit in *Using the POS* in shift order; Reports keeps only Register Closures. | **Partly.** The J1 page covers counting and closing too, so *Close the Register* (`pos/reconciliation`) overlaps it. Register setup still has three homes: Set Up a Store, Registers and Devices, WordPress Admin → Registers. |
| 2 | Split homes: refunds, reconciliation, closures CSV, the store picker. | Renamed apart: Refund a Sale / Refunds from Orders; Close the Register / Register Closures. | **Partly.** Question 53 still ties the two refund pages. The closures CSV still lives in WordPress Admin; the store picker every cashier sees is still only on the Pro page Set Up a Store. |
| 3 | The Settings section is 1.x-shaped. | Store Settings → POS Settings; Barcode → Barcode Scanning; Keyboard Shortcuts moved out (it is a POS input mode). | **Partly.** The app's seven POS settings pages include Printing, Card readers and Customer display; none has a page under POS Settings. `settings/wp-admin/index` still lists non-screens and omits Cloud Print, Extensions, Export closures, Logs and License (page content). |
| 4 | The *Using the POS* landing describes the 1.x shell. | Not a tree change. | **Open.** `pos/index` needs the J-ticket rewrite. |
| 5 | Till behaviour parked on pages a cashier does not open (19 misfiled rows). | Not a tree change. | **Open.** Each misfiled row moves to its journey's task page or leaf in sweep 1. |
| 6 | Checkout is one leaf; the Paid moment is under Receipts. | Sell to a Guest has eight leaves; Receipts and the Paid Screen is step 11 of the shift. | **Mostly answered.** The card-reader cashier flow is still per vendor under Payment Gateways until Hardware → Card Readers exists; the template and printer switchers are explained only on `hardware/printers/index`. |
| 7 | Coupons under *Using the POS* is the management page. | *Discounts and Coupons* → *Apply a Coupon* at the till; Coupons (`coupons/index`) moved to *Managing Your Store*. | **Mostly answered.** `coupons/index` still has to describe the Pro back-office Coupons screen. |
| 8 | J0 is scattered; Getting Started has ten pages before selling. | Install and Activate moved up; Set Up a Device is the shift's first step; Getting Started has eight pages. | **Partly.** Set Up a Store and the printer Setup Wizard are still in other sections, and no page walks a new till from install to first sale. Questions 17–24 (accounts, licence limits, trials, billing) miss on both trees. |
| 9 | Screenshots are pre-2.0 everywhere. | Not a tree change. | **Open,** except the three proof pages. |
| 10 | Label drift between app and docs. | Plainer task names throughout. | **Open, and one new drift:** the sidebar says *Product Display Settings* where the app says *Product settings*. |

## What is still open

- **The bar is far off.** 6.0 against 9.0; 13 of 58 (12 as shipped). Rounds alternate with page rounds (RULINGS amendment, 7 Nov).
- **The judge's three findings on the tree now on main,** not yet tried: one destination for *Pro accounts, licence terms and billing* (questions 17–24); rename *Sell to a Guest* to *Checkout*, since payment methods, split payments and checkout problems are not guest-only and J2 now follows the **Default POS Customer** setting; move *Fiscal Compliance* from Developer Reference to *Managing Your Store*.
- **Overlaps:** *Open the Register* and *Close the Register*; *All Gateways* and the Payment Gateways landing page.
- **Missing destinations** the questions hit: catalogue size and performance, bundles and subscriptions, stock limits, location stock, brand reports, shipping and pickup, UI extension points, update or reinstall problems.
- **Pages the tree names but `main` lacks:** Hardware → Customer Display and Card Readers.

## Questions for Paul

1. Approve the shift order and section order as on `main`, or steer them.
2. *Sell to a Guest* or *Checkout* for the J2 task page?
3. Should *Close the Register* fold into *Open the Register*, or should J1 split its count-and-close half into it?
