# Docs Information-Architecture Restructure — Implementation Plan

_Date: 2026-05-30 · Status: agreed (post-grilling). Authoritative plan — supersedes the
earlier audit draft. Companions: `2026-05-30-docs-inventory.md` (page inventory + roadmap),
`/CONTEXT.md` (glossary), `docs/adr/0001` (Receipts), `docs/adr/0002` (redirects)._

## 0. What we're doing & why

The live sidebar is **15 flat top-level categories** (thin singletons + a ~65-page Error
Codes dump at the top level). It's hard for the **Owner/Operator** — our single primary
reader — to scan, and it grows a new top-level row with every feature. We regroup into
**10 task-oriented buckets**, realign URLs where the current path is jargon/misleading
(for SEO + clarity), and keep every old URL working via permanent redirects.

**Two independent levers** (keep them straight):
- **Sidebar grouping** — edit the hand-authored sidebar JSON. No file moves, no URL change,
  no redirects, no i18n work. A doc can sit under any sidebar category regardless of its
  URL. This does most of the visible work.
- **URL renames** — move files so the path matches the new name. Each move = EN file + its
  ≤12 locale mirrors + internal-link rewrites + a permanent redirect. Used **only** where
  the URL is genuinely wrong (jargon), not merely to mirror a bucket.

**SEO principle:** short, keyword-rich, stable URLs. We do **not** prefix URLs with bucket
names (`/products`, `/orders` are already good SEO — don't bury them under
`/managing-your-store/`). We rename only `templates`→`receipts`, pull `printer-setup` into
`hardware`, and de-jargon `custom-gateways`→`gateways`.

## 1. Scope (read this before touching anything)

- **In scope:** the **live** English docs `versioned_docs/version-1.x/` **and all 12
  translation mirrors** `i18n/<locale>/docusaurus-plugin-content-docs/version-1.x/`, moved
  in lockstep. The hand-authored sidebar `versioned_sidebars/version-1.x-sidebars.json`.
- **Out of scope:** `versioned_docs/version-0.4.x/` (frozen archive — leave it). The bare
  `docs/` folder (empty/unbuilt — `includeCurrentVersion:false`; nothing to restructure).
- **Guardrails:** `onBrokenLinks:'throw'` (a stale internal link fails the build — this is
  our safety net). 12 locales. Hosted on Vercel.

## 2. Target structure — 10 top-level buckets

One sidebar, Owner/Operator-first, ordered as a lifecycle. Buckets are **sidebar grouping**;
the "URL" column shows what actually changes.

| # | Bucket (sidebar label) | Contents (doc ids) | URLs |
|---|---|---|---|
| 1 | **Getting Started** | getting-started/* | unchanged (`/`, `/getting-started/*`) |
| 2 | **Using the POS** | pos/* ; coupons/* ; orders/refunds ; reports/reconciliation | unchanged (cross-listed by id) |
| 3 | **Managing Your Store** | products/* ; orders/index ; customers/* ; stores/* ; **reports/*** | unchanged |
| 4 | **Receipts** | receipts/* (was templates/*, minus printer-setup) + merged checkout receipts | **`/templates/* → /receipts/*`** |
| 5 | **Hardware** _(new)_ | hardware/index (hub) ; hardware/printers ; barcode scanners ; pointers | **`/templates/printer-setup → /hardware/printers`** + new hub |
| 6 | **Payment Gateways** | payment/index ; payment/gateways/* (setup guides) | **`/payment/custom-gateways/* → /payment/gateways/*`** |
| 7 | **Settings** | settings/* (wp-admin + store) — global config only | unchanged |
| 8 | **Extensions** | extensions/* | unchanged |
| 9 | **Help & Troubleshooting** | support/* ; **error-codes/*** (nested here) | unchanged |
| 10 | **Developer Reference** _(collapsed)_ | reference/* + gateway-template | **`/payment/custom-gateways/gateway-template → /reference/gateway-template`** |

Notes on placement decisions (full rationale in CONTEXT.md / ADRs):
- **Cross-listing, not moving:** `orders/refunds` and `reports/reconciliation` are live-sale
  ops → listed under **Using the POS** in the sidebar, but keep their `/orders/*` and
  `/reports/*` URLs (a doc id can appear under any category). No file move, no redirect.
- **Reports** stays under Managing Your Store **now**; promote to its own top-level bucket
  when reporting templates / the report viewer ship (sidebar-only move, no URL cost).
- **Error Codes** (~65 pages) becomes a child of **Help & Troubleshooting** in the sidebar —
  keeps `/error-codes/*` URLs. Pure regroup.
- **Developer Reference** is the only "tuck-away," collapsed by default. `/reference/*` URLs
  stay; only `gateway-template` moves in.
- **Per-screen Display Settings** stay documented on each screen (not in Settings).

## 3. The URL changes (exhaustive) + redirects

Redirects go in **`vercel.json` as permanent (308)** redirects — true SEO redirects, edge,
per ADR-0002. **Every rule fans out across all 12 locale prefixes** (`/x`, `/es/x`,
`/fr/x`, … → new path). Pin `trailingSlash` in `docusaurus.config.js` first so source/dest
shapes match the served URLs (build is directory-style today: `/receipts/customise/`).

### 3a. Templates → Receipts (5 content pages)
`templates/{index, customise, html-templates, thermal-templates, receipt-data}` →
`receipts/{…}`. Redirects: `/templates → /receipts`, `/templates/customise →
/receipts/customise`, +html-templates, +thermal-templates, +receipt-data. Re-point the
existing `/templates/receipt-templates → /templates` rule to `/receipts`.
**i18n:** ~5 translated files per locale (printer-setup is the untranslated one). ~18 internal
`/templates*` links to rewrite.

### 3b. printer-setup → Hardware
`templates/printer-setup → hardware/printers`. New `hardware/index` hub page.
Redirect `/templates/printer-setup → /hardware/printers`. (Cash-drawer content already lives
inside this page — stays with it.) printer-setup has little/no translation today — move what
exists.

### 3c. Custom Gateways → Gateways (de-jargon)
`payment/custom-gateways/{index, stripe-terminal, sumup-terminal, vipps-mobilepay,
email-invoice, web-checkout} → payment/gateways/{…}`. Redirect each old→new.
**i18n:** fully translated — **7 files × 12 locales** move in lockstep. ~18 internal
`/payment/custom-gateways*` links to rewrite. `payment/index` keeps `/payment`.

### 3d. gateway-template → Developer Reference
`payment/custom-gateways/gateway-template → reference/gateway-template`. Redirect old→new.
`reference/*` is currently **untranslated** (0 locale copies) — EN-only move.

### 3e. Checkout receipts consolidation
Merge `pos/checkout/receipts` content into the Receipts section; redirect
`/pos/checkout/receipts → /receipts` (or the specific new subpage). ~9 internal links to
update. Keep `pos/checkout/index` for "completing the sale."

**Everything else = sidebar-only. No other URLs change.**

## 4. Prerequisite: redirect infrastructure (do once, first)

1. **Pin `trailingSlash`** explicitly in `docusaurus.config.js` (match current
   directory-style output) so redirect paths are deterministic. Verify `pnpm build`.
2. **Migrate existing `plugin-client-redirects` rules into `vercel.json`** as permanent
   redirects; stop using the plugin for new rules (ADR-0002). Keep behaviour identical for
   the ~23 existing rules during the move.
3. Add a small helper/script to **expand one logical redirect into its 12 locale variants**
   (the redirect list is mechanical fan-out; generate it, don't hand-type 12×).

## 5. Phasing (each phase = one reviewable PR, green build)

- **Phase 0 — Sidebar regroup (no URL changes).** Rewrite
  `version-1.x-sidebars.json` into the 10 buckets; cross-list refunds/reconciliation; nest
  Error Codes under Help; collapse Developer Reference; enable `autoCollapseCategories` +
  `hideable` in config; add bucket landing pages (use `generated-index` where no index doc
  exists). **Zero file moves, zero redirects.** Delivers the entire visible "smaller
  sidebar" win at near-zero risk. Ship and gather feedback on labels.
- **Phase 0.5 — Redirect infrastructure** (§4). Small, no content change.
- **Phase 1 — Receipts + Hardware** (§3a, §3b, §3e). Highest-value renames; introduces the
  new Hardware section. Files + i18n + 308s + link rewrites.
- **Phase 2 — Payment Gateways** (§3c, §3d). The 7×12 fully-translated move + gateway-template
  to Developer Reference.
- **Phase 3 — Polish / gap-fill (optional, ongoing).** Flesh out the Hardware hub
  (barcode-scanners page pointing at existing scanning + barcode-settings docs; pointers for
  card readers → Gateways, cash drawers → printers, tablets/CFD). Begin filling the content
  gaps catalogued in the inventory (Staff, richer product types, email templates) as those
  features ship.

## 6. Per-move checklist (apply to every URL rename in Phases 1–2)

1. Confirm locale coverage for the folder (already measured: templates ~5/locale,
   custom-gateways 7/locale fully, reference 0/locale).
2. `git mv` the EN file **and** each existing `i18n/<locale>/…/version-1.x/<path>` mirror
   together (use repo scripts `translations:sync` / `validate-frontmatter`).
3. Update `sidebar_label`/`title`/`slug` front matter as needed; update the doc ids in
   `version-1.x-sidebars.json`.
4. Rewrite **all** internal links to the moved pages (build throws on misses — belt).
5. Add the **308 redirect(s)** to `vercel.json`, fanned out across 12 locales (braces).
6. `pnpm build` green; spot-check old URLs 308 to new; spot-check a couple of locale paths.

## 7. Risks / watch-list

- **i18n lockstep.** Moving an EN file without its locale mirrors → silent English fallback +
  orphaned translations. The checklist step 2 is the guard.
- **`onBrokenLinks:'throw'`.** Good — it catches stale internal links. Budget the grep+fix
  sweep each phase.
- **Trailing-slash mismatch** = redirect loops / 404s. Pinned in Phase 0.5 before any move.
- **Algolia** re-crawls on its own schedule; expect stale search hits to old URLs briefly —
  the 308s cover users meanwhile.
- **Host lock-in.** Redirects now live in `vercel.json` (accepted trade-off for real 301/308;
  ADR-0002). If hosting changes, re-express them.

## 8. Decisions locked (pointers)

Persona (Owner/Operator), the Using-the-POS vs Managing-Your-Store boundary, Payment Gateway
naming, global vs per-screen Settings, the Hardware hub-and-spoke rule, Template Engine vs
Receipt, Error Codes vs Developer Reference → **`/CONTEXT.md`**. Why we rejected the simple
Templates→Receipts rename and the deferred engine-split trigger → **ADR-0001**. Redirect
mechanism → **ADR-0002**.
