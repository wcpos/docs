# WCPOS Docs — Content Inventory, Roadmap Signal & Gaps

_Date: 2026-05-30 · Companion to `2026-05-30-docs-ia-restructure.md`. Source: every page in
`versioned_docs/version-1.x/` + the wcpos/projects/4 Roadmap (257 items)._

## A. Current pages (what exists today)

### Getting Started (7)
- **index** — what WCPOS is; web/desktop/mobile; 5-minute setup.
- **installation** — min server/browser requirements.
- **free-vs-pro** — feature comparison Free vs Pro.
- **pro-license** — install/activate Pro, license troubleshooting.
- **connect** — desktop/mobile connection screen, multi-store, troubleshooting.
- **offline** — what works offline vs needs connectivity.
- **previous-versions** — downgrade the plugin.

### POS — the live register (13)
- **pos/index** — selling screen layout, responsive, shortcuts.
- **cart/index, line-items, discounts, open-orders, order-actions** — cart panel + editing, POS discounts, parking orders, notes/meta/void.
- **checkout/index** — payment modal, methods, coupons.
- **checkout/receipts** — post-sale receipt display/email/print/reprint. *(overlaps Templates)*
- **product-panel/index, search-filtering, barcode-scanning, variations** — browse/search/scan/variations.

### Products (3) · Orders (2) · Customers (1) · Coupons (2)
- **products/** index (Pro inventory screen), pos-only-products, sync.
- **orders/** index (Pro order history), refunds.
- **customers/** index (Pro customer DB).
- **coupons/** index (Pro coupon browse), applying-coupons (till workflow).

### Reports (2) · Stores (2)
- **reports/** index (sales + reconciliation UI), reconciliation (EOD walkthrough).
- **stores/** index (multi-store Pro), setup (per-location walkthrough).

### Settings (14)
- **settings/index** — the 3 settings types (WP-Admin / Store / per-screen Display).
- **store/** general, tax, barcode, hotkeys, theme, index *(index already lists a "Printer" tab)*.
- **wp-admin/** index, access (roles), general, checkout, customer-tax-ids, email-notifications, store-tax-ids.

### Payment (8)
- **payment/index** — built-in cash/card + Pro gateways overview.
- **custom-gateways/** index, stripe-terminal, sumup-terminal, vipps-mobilepay, email-invoice, web-checkout (setup guides) + **gateway-template** (dev scaffolding).

### Templates (6)
- **index** — engine overview (HTML / Thermal XML / Legacy PHP) + gallery.
- **customise** — pick gallery / AI tweak / hand-edit.
- **html-templates**, **thermal-templates** — engine syntax references.
- **receipt-data** — canonical data contract for templates.
- **printer-setup** — printer connection (network/BT/USB; Epson/Star/generic) + **Cash Drawers** section (kick via printer).

### Extensions (6)
- index + atum, polylang, wpml, wp-multilang, storeapps-smart-coupons.

### Support (9)
- index, logs, translations; performance/ (index, checkout, server);
  troubleshooting/ (clear-local-data, critical-error, response-error, plugin-conflicts).

### Error Codes (~65)
- index + 4 category pages (api, db, py, sy) + ~59 individual codes (API 39, DB 9, PY 6, SY 5).

### Reference (4)
- wc-rest-api, architecture, role-endpoint-access, pos-discounts. *(developer-facing)*

**Totals:** ~130 user pages + ~65 error-code pages. 12 locales mirror the tree.

## B. Roadmap signal (what's coming — reshapes the IA)

_From the Roadmap board, ~69 Backlog items. **Verbatim from the board** — features NOT
listed here (loyalty, gift cards, store credit, layaway, purchase orders, stock-take,
migration) are **not** on the roadmap; do not design around them._

- **Products / Inventory — by far the biggest growth area (~20):** create products from the
  Products page; **Product Add-Ons**, **Bundles**, **Composite Products**, **Product
  Options** (support + REST + cart-rendering UI for each); **Product Vendors**; **embedded
  barcodes** (parsing, format settings, generator); **WooCommerce Bookings** (date/time
  picker). → Mostly *richer product types flowing into the cart*. Products/Cart docs must
  scale a lot.
- **Templating / Printing / Email — confirmed shared engine (~10):** receipt template data
  overhaul; **email templates for POS orders**; **reporting templates**; **report viewer &
  printer UI**; thermal template support; ESC/POS integration. Plus order-notification
  delivery (push mechanism, UI + audio alerts). → One engine, many outputs (receipt,
  email, report). Confirms: don't scope the section to "receipts."
- **Reports (~3):** reporting templates, **report data aggregation API**, report viewer &
  printer UI. → Reports gains its own printing/template surface.
- **Hardware (~5):** **card reader integration** (HID input, encrypted SDK), thermal
  printer, and **customer-facing display** (broadcast from POS + display app).
- **Payments (~5):** **split payment** (support, sub-order handling, checkout UI); **cash
  float management** (REST + entry UI).
- **Staff (NEW, ~3):** **shift start/stop**, shift management REST + UI. No docs home today.
- **Cart/Checkout UX (several):** required fields before checkout, default fee, custom cart
  tab labels, add-to-cart sound, configurable search/sort fields, keyboard hotkeys, custom
  meta on line-item/fee/shipping modals.
- **Coupons:** core coupon support (the Coupons section is recent).

## C. Gaps (no page today, likely needed)

- **Hardware hub** — no top-level home; printer setup is buried in Templates; scanners are
  only documented as a setting; terminals only under gateways. (Addressed by the new
  Hardware section.)
- **Receipts as a destination** — content split across `templates/*` and
  `pos/checkout/receipts`; no single "Receipts" home. Email/SMS receipt delivery thinly
  covered.
- **Staff / Employees** — nothing today; shift start/stop + shift management incoming, no home.
- **Customer-facing display (CFD)** — incoming (broadcast + display app); hardware-adjacent,
  no home today.
- **Customers** — single thin page; no lookup/edit/merge/history task docs.
- **Reports** — only sales + reconciliation; reporting templates + viewer/printer + data
  aggregation incoming.
- **Rich product types** — add-ons / bundles / composites / options / bookings / vendors all
  incoming; today only simple + variable products are documented. Largest gap by volume.
- **Email / notifications** — only WP-admin email toggles today; POS email templates +
  order-notification delivery incoming.

## D2. Locked decisions (from grilling session, 2026-05-30)

- **One sidebar**, Owner/Operator-first Guides; Error Codes stays in Guides; a single
  collapsed **Developer Reference** holds REST API, architecture, role-endpoint-access,
  pos-discounts, gateway-template. No audience navbar tabs.
- **Top-level shape (9):** Getting Started · Using the POS · Managing Your Store · Receipts ·
  Hardware · Payment Gateways · Settings · Help & Troubleshooting · Developer Reference.
- **Receipts** = first-class section; shared template engine stays inside it until a second
  output type ships (ADR-0001). `printer-setup` → **Hardware**.
- **Hardware** (new) = printers + scanners as real pages; hub-pointers for card readers
  (→ Payment Gateways), cash drawers (→ Receipt Printers page, where they already live),
  tablets, CFD. Hub never duplicates setup steps.
- **Payment Gateways** = user-facing setup guides stay; only `gateway-template` → Dev Ref.
  Rename away from "Custom Gateways" (reads as build-your-own).
- **Using the POS vs Managing Your Store** = live-sale ops vs business-data/config.
  Refunds → Using the POS. Reconciliation → Using the POS. Customers → Managing Your Store.
- **Reports** stays under Managing Your Store now; **promote to top-level when reporting
  templates / report viewer ship** (sidebar-only move, no URL/i18n cost). Reconciliation
  (Using the POS) stays separate from the Reports screen (Managing Your Store), cross-linked.
- **Per-screen Display Settings** documented with each screen, not in central Settings;
  Settings = global config only.
- **Extensions** stays its own top-level section (third-party plugin integrations: ATUM,
  Polylang, WPML, WP Multilang, Smart Coupons) — sits in the lower tier above Help. Top
  level is now 10 buckets.
- **Future homes earmarked:** Staff/shift management → Managing Your Store; Customer-Facing
  Display → Hardware. No shelves built until the features ship.
- **URLs change to match the new structure** (for SEO + clarity) — not sidebar-only. Each
  rename ships with full redirect coverage so old URLs keep working.
- **Scope = the live docs + all their translations, in lockstep.** Concretely: English
  `versioned_docs/version-1.x/` **and** all 12 `i18n/<locale>/…/version-1.x/` mirrors (13
  copies total). Leave the empty/unbuilt `docs/` folder and the frozen `version-0.4.x`
  archive untouched. There is effectively one live tree; no "next version" work now.
- **Redirects → `vercel.json` as permanent 308s** (SEO-equivalent to 301), covering all 12
  locale-prefixed paths; internal links fixed at move-time too (belt and braces). See
  ADR-0002. Execution stays phased (sidebar regroup first, then per-section URL renames)
  for reviewable PRs and a green `onBrokenLinks:'throw'` build — but the end state is full
  URL alignment.

## D. IA implications (feeds the restructure plan)

1. **The engine outputs receipts, emails, and reports** (all three explicit on the board).
   So either a broad umbrella (**Templates & Printing**) or a thin **Receipts** task section
   pointing at a shared-engine area — the live open question. Naming it "Receipts" alone
   boxes out emails + report templates.
2. **Hardware as its own top-level section is justified** by the roadmap (customer-facing
   display, card readers) on top of today's printer + scanner content.
3. **Payments will grow** (split payments, cash float) → keep prominent.
4. **Reports will grow** (templates, viewer/printer, aggregation) → top-level peer, not a
   Managing-Your-Store afterthought.
5. **Plan an empty home for Staff** (shift management) and **CFD** — coming, no shelf today.
6. **Products/Cart will grow the most** (add-ons, bundles, composites, options, bookings).
   Whatever bucket holds Products must tolerate deep nesting.
7. Top level can be ~8–10 task buckets (matches Square/Loyverse) **as long as reference
   noise (Error Codes ~65, Dev Reference) stays corralled** — already decided.
