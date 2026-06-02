# Docs Growth Plan — gaps in shipped features + structure for the roadmap

Date: 2026-06-02
Author: audit across `../wiki`, `../monorepo-v2`, `../woocommerce-pos` (free), `../woocommerce-pos-pro` (pro), and the public Roadmap board (github.com/orgs/wcpos/projects/4, 259 items).

Reference: `CONTEXT.md` (IA glossary), `docs/adr/0001-receipts-section-and-deferred-engine-split.md`.

---

## 0. State of play (read first)

- **Live IA = the new 16-bucket structure** on `origin/main` (PR #237 + follow-ups). The local `main` checkout is **225 commits behind** — `git pull origin main` before any work. The `versioned_docs/version-1.x` in the stale local tree still shows the *old* buckets (`templates/`, `payment/custom-gateways/`); ignore it. Authoritative current tree is in the `docs-redirect-fix` worktree / origin-main.
- Current live buckets: `getting-started, pos, products, coupons, customers, orders, payment, receipts, hardware, stores, settings, reports, extensions, support, reference, error-codes`.
- The IA is deliberately **one blended Owner/Operator path** with a tucked-away Developer Reference and Error Codes kept inside the guides. Boundary rule: "done during a live sale?" → *Using the POS*; "editing business data/config?" → *Managing Your Store*; device/output/payment **setup** → its own top-level section.

---

## 1. Gaps in docs for ALREADY-SHIPPED features

Consolidated + deduped from the three repo audits. Confidence: **[V]** = verified missing page in the tree; **[C]** = needs a content check against the live page (wiki audit inferred coverage from structure only).

### 1a. Net-new pages needed (high confidence)

| Page | Why | Bucket / path | Free/Pro | Pri |
|---|---|---|---|---|
| **PayPal Reader (Zettle) gateway** | Shipped catalog extension (`../paypal-reader-for-woocommerce`), no docs page; every other gateway has one | `payment/gateways/paypal-reader` | Pro | **High** [V] |
| **Sessions / device management** | `POS → Settings → Sessions` (master/detail) lists active logins per device, revoke one/all. Zero docs | `settings/wp-admin/sessions` | Free | **High** [V] |
| **In-app Notification Center (bell)** | Always-present header bell (Novu): unread dots, mark-all-read, real-time. Undocumented | `support/notifications` (consolidate w/ roadmap #8 order alerts) | Free | **High** [V] |
| **Hosting & server requirements** | Specs (4+ cores, 4GB, PHP 7.4+, MySQL8/MariaDB11, SSD), "503 = server-side", host-specific fixes (GoDaddy WAF, WP Engine, Cloudflare, WP.com 9-10 products). #1 support theme | expand `support/performance/server` or new `support/hosting` | n/a | **P0** [C] |
| **Plugin-conflict catalog** | Wiki has a large specific catalog (Wordfence/security, WP Rocket/optimizers, LiteSpeed, Elementor, JWT-auth, etc.); public page is thin | expand `support/troubleshooting/plugin-conflicts` into a table | n/a | **P0** [C] |
| **Fiscal / certification limitations** | NOT certified for FR NF525, ES VERIFACTU (2027), NO, CL SII; EU OSS not native. Affects purchase viability | `reference/fiscal-compliance` + note in `getting-started` | n/a | **P0 (region)** [C] |
| **App login-failure troubleshooting** | X-Frame-Options is the #1 desktop/web login failure; plus offline capability matrix | `support/troubleshooting/` + `getting-started/connect` | n/a | **P0** [C] |
| **WooCommerce version-compatibility warnings** | WC 10.5.0 breaks product loading (roll back 10.4.3); Stripe v9.7.0+ guest-checkout break; "WC update can break POS" | `getting-started/installation` or `support/troubleshooting/` | n/a | **P0** [C] |
| **Privacy / telemetry** | GDPR consent prompt + tri-state opt-out (Settings→General→Privacy); PostHog gating. No public home | `support/privacy` or `getting-started/installation` note | Free | Low [V] |

### 1b. Thin / stale pages (exist, miss a shipped sub-feature) — all [V] unless noted

- `settings/wp-admin/checkout.mdx` — "Order Status" is **stale**: status is now **per-gateway** (column + per-gateway modal), not one global default. (Free)
- `settings/wp-admin/general.mdx` — missing **Restore stock on order delete** toggle (default ON) and **Force SSL** toggle. (Free)
- `extensions/index.mdx` — missing **per-extension auto-update** toggle / auto-enable-on-install / update badge. (Pro)
- `reports/index.mdx` — missing Pro **WP-Admin Analytics "POS vs Online" segment + Store/Cashier/Gateway filters**; and the **report-template / Z-report selector** + Cashier/Store totals + refunds panels. (Pro / app)
- `receipts/cloud-printing` — missing **per-store (per-outlet) printer routing** (Pro; falls back to global). (Pro)
- `getting-started/connect.mdx` — missing the connect-hardening errors ("REST API requires authentication / security plugin blocking", outdated-plugin gating). (app)
- `settings/store/barcode.mdx` — missing the **scanner Test tool** (live keypress/detected-barcode panel) and **avg-time-input threshold** setting. (app)
- **Error-codes** — audit the public set against the wiki's full list (SY02002, `wcpos_rest_insufficient_permissions`, Stripe Terminal ER400/S700 family, HTTP 414, etc.). [C]

### 1c. Known-limitation notes to add to existing pages (verify first — [C])

Split/partial payments unsupported (`pos/checkout`); refunds need live connection (`orders/refunds` + `offline`); no managed-till/shift feature today (`reports/reconciliation`); search tokenization + CJK limit (`products/sync`); one barcode per product / `_global_unique_id` (`settings/store/barcode`); card-reader compatibility matrix incl. Bluetooth-only/SumUp-unsupported (`hardware` + gateway pages); thermal constraints (web = Epson ePOS + Star WebPRNT only; 58mm can't render HTML; RTL codepage); coupon stacking is sequential math (`coupons`); per-store currency/locale is display-only not multi-currency (`stores`); license 2-domain limit + expiry behavior + WAF/404 gotchas (`getting-started/pro-license`); WPML doesn't carry POS custom fields (`extensions/wpml`).

> **Caveat:** the wiki audit inferred "covered" from the IA structure, not page contents. Spot-check each [C] item against the live page before writing — several may already be partly covered.

---

## 2. Structure for upcoming features (roadmap)

> **Board hygiene note:** the board's *Backlog* still contains already-shipped epics (Coupon support, Thermal printer template support, Card-reader items partially). "Receipt template data contract" is *In Progress*. Treat Up Next + genuinely-future Backlog as the planning set, not the literal column.

### 2.1 THE pivot — trigger ADR-0001 engine extraction (Reporting + Email templates)

The roadmap has **Reporting templates (#9, epic)** and **Email templates for POS orders (epic)** — these are exactly the "second output type" ADR-0001 names as the trigger to factor the shared template-engine pages out of Receipts.

Plan (execute *when the 2nd output type ships*, per ADR — not before):
- New section **"Templates & Printing"** (working name) hosting the shared engine: `customise`, `html-templates`, `thermal-templates`, `receipt-data` (the data contract), the gallery.
- **Receipts** keeps receipt-specific content (`index`, `at-checkout`, `cloud-printing`) and *references* the engine section.
- New output types become siblings that reference the same engine: **Reports/Z-report templates**, **Email templates**, later **labels / packing slips / kitchen tickets / customer-display layouts** (all named in CONTEXT.md).
- This is **additive**: "Receipts" is never renamed; only deep low-traffic engine URLs move, with cheap redirects.

The *in-progress* data-contract standardization lands in `receipts/receipt-data` now and becomes the shared contract page after extraction.

### 2.2 Register operations / cash management cluster ("Using the POS")

Coherent session-lifecycle theme, all "during a live sale": **Cash float (#6)** → **Shift start/stop (#7)** → end-of-day **reconciliation** (shipped) → **Z-report (#9)**.

Proposal: group under *Using the POS* —
- `pos/cash-float` (float entry at session start)
- `pos/shifts` (open/close, active-shift indicator, history)
- `pos/reconciliation` (exists)
- Z-report output → `reports/z-reports` (data + print) and its *template* under the engine section (2.1).

This finally lets the "no managed-till/shift feature" limitation note (1c) flip to real docs.

### 2.3 Product types & WooCommerce-extension compatibility (largest cluster, ~8 epics)

Add-Ons (#5), Add-Ons Ultimate (#18), Product Options (#19), Bundles (#11), Composite Products (#12), Bookings (#15), Vendors (#16), embedded barcodes (#13).

Two axes, keep them separate:
- **Per-plugin compatibility pages** under `extensions/` — matches the existing convention (`atum`, `storeapps-smart-coupons`). Add: `extensions/product-add-ons`, `extensions/product-bundles`, `extensions/composite-products`, `extensions/bookings`, `extensions/product-vendors`, `extensions/product-options`. Turn `extensions/index` into a **compatibility matrix** hub.
- **Cart-rendering behavior** (how add-on/bundle/composite fields appear when adding to cart) → short cross-links from `pos/cart` / `pos/product-panel`, not duplicated.

Embedded barcodes (#13, scales) → `settings/store/barcode` (format config) + `pos/product-panel/barcode-scanning` (parse → price/qty).

### 2.4 Hardware grows (hub was designed for this)

CONTEXT.md hardware hub already lists scanners, card readers, cash drawers, tablets, customer displays. Add:
- `hardware/barcode-scanners` (device setup; the *settings* stay in `settings/store/barcode`, the *scanning workflow* in `pos/product-panel` — hub-and-spoke, no dupes)
- `hardware/cash-drawers` (ESC/POS kick; Star mPOP combo unit)
- `hardware/card-readers` — **one-line pointer** to Payment Gateways per the hub-and-spoke rule (account+pairing lives on the gateway page). Covers #20 HID + encrypted.
- `hardware/customer-display` (#21) — device side; "what shows" config under settings.

### 2.5 Payment grows

- **Split payments (#3)** → checkout-flow feature: `pos/checkout` split-payment section + note on `payment/index` (sub-order model). Flip the "split payments unsupported" limitation note when it ships.
- **Card reader integration (#20)** → gateway page(s) + hardware pointer (2.4).
- **PayPal Reader** page (gap 1a) slots in now.

### 2.6 Checkout / cart UX + settings features (mostly inline / settings-co-located)

Per CONTEXT.md "co-locate per-screen config with the task": **Checkout conditions system** (Up Next) + **Required fields before checkout** → `pos/checkout` (+ a settings section); **Custom cart tab labels**, **Add-to-cart sound**, **Quick filter buttons**, **Order total rounding**, **Default fee**, **Custom meta fields on line items**, **Customer display settings**, **POS keyboard hotkeys for actions** → documented on their screen / under `settings`. **Create products from Products page** + **Barcode generator** → `products/`. **Order notifications (#8)** → consolidate with the Notification Center page (`support/notifications`).

### 2.7 Developer Reference grows

Receipt **data contract** (in progress) → `reference` + `receipts/receipt-data`. **Configurable search fields (#10)** / **configurable sort (#17)** → `reference/wc-rest-api` or new reference pages. **Checkout-conditions** pluggable-rules extension point → `reference`.

---

## 3. Placeholder / "coming soon" strategy

Publishing "coming soon" on a live site sets expectations and ages badly. Recommended balance:

1. **Reserve IA slots in *this plan*, not in the live tree.** Do **not** pre-create the long-tail Backlog epics (vendors, composites, bookings, …) — that's structure churn + stale-content risk. Create each page when the work starts.
2. **One public "Roadmap / What's coming" page** (e.g. `getting-started/roadmap` or `support/roadmap`) that links to the public GitHub project — single source of truth for "is X coming?", instead of scattering stubs.
3. **Targeted `:::info Coming soon` admonitions only on the handful of pages where users hit a known limitation *today*** and are actively searching — so the stub captures that traffic and shows momentum. Candidates (all Up Next / longest-standing):
   - **Overselling / stock control** (#1, Up Next, longest-standing request) → `pos/cart` or `products/stock-control` stub.
   - **Split payments** (#3, known limitation users hit) → `pos/checkout` stub.
   - **Cash float + Shift management** (#6/#7) → `pos/` register-sessions stub.
   - **Checkout conditions** (Up Next) → `pos/checkout` note.
4. **Establish a reusable convention** — a small `ComingSoon` component or a standard `:::info` block + roadmap link — so every stub is consistent and trivially greppable/removable later. (No "coming soon" convention exists today; theme.mdx / performance/index.mdx have ad-hoc mentions only.)

---

## 4. Suggested sequence

1. `git pull origin main` (225 behind).
2. **Fill verified High/P0 gaps** (§1a): PayPal Reader, Sessions, Notification Center, hosting/requirements, plugin-conflict catalog, fiscal limitations, login troubleshooting, WC-version warnings.
3. **Fix thin/stale pages** (§1b) — small, high-value edits.
4. **Verify + add [C] limitation notes** (§1c) against live pages.
5. **Add the Roadmap page + 3-4 targeted coming-soon stubs** (§3) and the reusable convention.
6. **Hold** the §2.1 engine extraction until Reporting/Email templates actually ship; everything else in §2 is created page-by-page as work lands, into the slots reserved here.
</content>
</invoke>
