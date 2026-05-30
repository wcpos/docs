# Redirects live in vercel.json as permanent (308) edge redirects, not the Docusaurus client plugin

Status: accepted (2026-05-30)

## Context

The IA restructure renames many URLs (e.g. `/templates/* → /receipts/*`). Old URLs must
keep working, and SEO link-equity must transfer to the new URLs. The repo currently routes
all redirects through `@docusaurus/plugin-client-redirects`, which generates **client-side
meta-refresh** redirects (an HTML page that JS-bounces). Those work for users but are weak
for SEO — they are not true HTTP permanent redirects and pass ranking signal poorly.

The site is hosted on Vercel. The current `vercel.json` is minimal — only `$schema` and an
`ignoreCommand` build guard; it has **no** `redirects`, `cleanUrls`, or `trailingSlash`.
`trailingSlash` is also unset in `docusaurus.config.js`, so the Docusaurus default applies
and pages build in directory style (`/templates/customise/` → `index.html`).

## Decision

- **`vercel.json` `redirects` is the single source of truth** for old→new URL mappings,
  using `"permanent": true` (Vercel emits **HTTP 308**, SEO-equivalent to 301 — both
  consolidate link-equity; 308 additionally preserves method, irrelevant for GET docs).
- **Pin `trailingSlash` explicitly** (in `docusaurus.config.js`) before moving URLs, so the
  built URL shape is deterministic and redirect `source`/`destination` paths match what the
  site actually serves. (Exact value — with vs without trailing slash — to be set when
  implementing; the point is it must be pinned, not left to the default.)
- **Every URL move ships its redirect(s) in the same PR**, and must cover **all 12
  locale-prefixed paths** (a move of `/templates/x` also needs `/es/templates/x`,
  `/fr/templates/x`, … → the corresponding new locale path).
- **Internal doc links are fixed at move-time** in the same PR (the build's
  `onBrokenLinks: 'throw'` enforces this). Redirects are the safety net for *external*
  inbound links (search engines, bookmarks, the WP plugin's "Docs" links), not a substitute
  for updating internal links — belt and braces.
- The `plugin-client-redirects` rules are migrated into `vercel.json`; the plugin is not
  used for new redirects.

## Consequences

- True permanent (308) redirects → best-practice SEO; link-equity transfers; faster (edge,
  no JS bounce).
- Redirects become host-specific (Vercel). If hosting ever changes, the redirect list must
  be re-expressed for the new host — accepted trade-off for SEO correctness.
- The redirect list carries a 12× locale fan-out per moved path; generate it mechanically.
- Trailing-slash mismatches are a classic redirect-loop / 404 source; pinning the setting
  removes that class of bug.
