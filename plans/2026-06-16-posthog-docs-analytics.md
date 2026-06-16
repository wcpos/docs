# Migrate docs analytics from Google Analytics to PostHog

Date: 2026-06-16
Author: Paul (via Claude)
Status: **Implemented in this PR** — consent-gated PostHog replaces Google Analytics. Needs a
human browser verification pass (checklist in §5) and the optional follow-ups in §7.

Reference: the website's analytics module (`wcpos-com/src/lib/analytics/*`, `consent.ts`,
`posthog-browser.ts`, `middleware.ts`) — docs deliberately mirror it so all `*.wcpos.com`
properties behave as one system. CONTEXT.md (IA glossary). `AGENTS.md` (do not touch `i18n/**`).

---

## 0. Goal

Consolidate the docs site onto our **self-hosted PostHog** so analytics, experiments and
conversion funnels live in one place with the plugin landing page and the new website — instead of
the docs being a Google Analytics island. GA is removed.

**The payoff:** `docs.wcpos.com`, `wcpos.com` and the PostHog project all share the `wcpos.com`
root, so PostHog stitches a visitor into **one person across docs → website** automatically. A
docs→download→signup funnel becomes a single connected path — which GA4 cannot do cleanly across
properties.

---

## 1. Verified facts (these drove the implementation)

- **Same PostHog project as website + plugin.** Public project key
  `phc_BhTJzZ7fXMqcD4MiaUJQsQqPkEpu94yoSAthXFBWemvd` — the exact key used by
  `wp-admin-landing` (plugin landing page) and the WooCommerce plugin's `Analytics.php`. Using the
  same key is what makes cross-property person-stitching work. The key is public (same trust level
  as the old committed GA ID and the committed Algolia keys), so it is hardcoded, matching repo
  convention.
- **Ingest host is `analytics.wcpos.com`, NOT `ph.wcpos.com`.** Confirmed in the website's CSP
  (`wcpos-com/next.config.ts`: `connect-src ... https://analytics.wcpos.com`, with a comment that
  the browser talks to the self-hosted origin directly, no `/ingest` proxy). `ph.wcpos.com` is the
  dashboard UI only — wired as `ui_host` so the PostHog toolbar links resolve.
- **The system is consent-gated (GDPR).** The website captures **nothing** until the visitor sets
  `wcpos-analytics-consent=granted` (a real cookie, `granted`/`denied`, CNIL-aware ~6-month
  re-ask). Docs reuse the same cookie name and the same model.
- **Deterministic events, not autocapture.** The website runs `autocapture: false` +
  `capture_pageview: false` on purpose ("explicit funnel events to keep the data deterministic").
  Docs match this — explicit `$pageview` on route change and `cta_click` on funnel links.
- **No session replay.** The website does not enable it; docs don't either, to keep the system
  consistent and the privacy surface minimal. It can be turned on later (PostHog project setting +
  client config) if we decide we want it for docs specifically.
- **Cross-subdomain stitching is automatic.** posthog-js's `cross_subdomain_cookie` defaults to
  `true`, so the `ph_<key>_*` cookie is written on `.wcpos.com`. Same project key on docs + website
  ⇒ same cookie ⇒ same `distinct_id` for client events. No extra wiring needed. (The website's
  separate `wcpos-distinct-id` cookie is only for its *server-side* events; docs is a static SPA
  with no server-side capture, so it is not relevant here.)
- **Docusaurus 3.10.1, deployed on Vercel.** No CSP in `vercel.json`. Existing `clientModules`
  pattern (`src/fontawesome.js`) extended. `src/theme/Root` was not previously swizzled.
- **Committed lockfile is `package-lock.json` (npm).** `pnpm-lock.yaml` is **gitignored** despite
  `packageManager: pnpm`. So `package-lock.json` was regenerated to add `posthog-js` — otherwise an
  `npm ci` deploy would break against the changed `package.json`.

---

## 2. What was implemented

| File | Change |
|---|---|
| `src/analytics/posthog.js` | **new** — client module: lazy-loads `posthog-js` (SSR-safe), inits against `analytics.wcpos.com` consent-gated, registers super-properties (`property: 'docs'`, `docs_locale`), captures `$pageview` via the `onRouteDidUpdate` lifecycle, and `cta_click` on outbound links to `wcpos.com` / `wordpress.org`. |
| `src/analytics/consent.js` | **new** — read/write the `wcpos-analytics-consent` cookie; ported 1:1 from the website's `consent.ts`. |
| `src/components/ConsentBanner/` | **new** — GDPR banner (same copy/model as the website), `<Translate>`-wrapped for i18n, links to `wcpos.com/privacy`. Renders nothing until a decision is needed; starts PostHog the moment consent is granted. |
| `src/theme/Root.js` | **new swizzle** — mounts `<ConsentBanner/>` on every page. |
| `docusaurus.config.js` | + `posthog.js` to `clientModules`; **removed the `gtag` block**. |
| `package.json` / `package-lock.json` | + `posthog-js@^1.386.8` (matches the website's `^1.386.6`); − the explicit `@docusaurus/plugin-google-gtag` dependency. |

GA is gone: the build output contains **no** `G-08SJ28P1E5`, `gtag/js`, or `googletagmanager`
references. (The gtag plugin remains as a *transitive* dep of `preset-classic`; it is never wired,
so it is inert.)

**Funnel events available day one:** `$pageview` (per route) and `cta_click` (clicks to
`wcpos.com`, e.g. the navbar logo / `/pro` / footer, and the WordPress.org plugin link). The
docs→website funnel is then built in the PostHog UI — no further code.

---

## 3. Build verification (done)

- `pnpm docusaurus build --locale en` → **success**, both client and server compiled (the real SSR
  risk with a client module + `Root` swizzle — passes because `posthog-js` is lazy-imported in the
  browser only).
- Grep of `build/` confirms `analytics.wcpos.com` + the project key are present and all GA markers
  are absent.

> Only the `en` locale was built locally for speed; CI builds all 12. No locale-specific code was
> added beyond `<Translate>` strings, so this is low-risk.

---

## 4. GA cutover decision

This PR does a **clean cutover** (GA removed now) rather than a parallel run, because:
- PostHog is already proven on two other WCPOS properties.
- Docs analytics is low-stakes (pageviews/funnels, no revenue path) — a brief data gap if anything
  needs fixing is acceptable.
- Keeping ungated GA alongside consent-gated PostHog would be a **GDPR inconsistency** (today GA on
  docs runs with no consent gate at all).

GA history stays in the GA property for comparison; PostHog is a clean baseline (no backfill).

---

## 5. Manual verification checklist (review gate — needs a browser)

Could not be automated here. Reviewer to confirm against `pnpm start` / a preview deploy:

- [ ] Banner appears on first visit; **nothing** is sent to `analytics.wcpos.com` before clicking Accept.
- [ ] After **Accept**: a single `$pageview` per navigation (no double-count, no misses) in PostHog Live Events.
- [ ] After **Decline**: no events; no `ph_*` cookie set.
- [ ] Clicking the navbar logo / a `wcpos.com` link fires one `cta_click` with `target_host`, `link_text`, `from_path`.
- [ ] **Cross-property:** visit docs (consented), then `wcpos.com` — same PostHog `distinct_id` (one person).
- [ ] Events carry `property: 'docs'` and the right `docs_locale` (spot-check a non-EN locale, e.g. `/de/`).
- [ ] No console errors; no CSP block (none expected — `vercel.json` has none; confirm no Cloudflare-edge CSP).

---

## 6. Out of scope

Website/plugin PostHog setup (already live); migrating GA history; Algolia (its `insights` click
analytics stays on, complementary).

---

## 7. Recommended follow-ups (not in this PR)

1. **"Was this page helpful?" → PostHog native Surveys.** No-code, configured in the PostHog UI,
   instantly A/B-testable, zero docs-repo maintenance, and segmentable by page/locale. Recommended
   over a custom swizzled widget. (Needs a PostHog **personal** API key or dashboard access to set
   up — not doable from the project key alone.)
2. **`docs_search` event.** Hook Algolia DocSearch to capture query + results-or-not → content-gap
   dashboard. Moderate effort; Algolia `insights` covers click-through in the meantime.
3. **Unified cross-subdomain *consent*.** Today the consent cookie is host-scoped (matches the
   website), so a visitor consents once per property. To consent **once across `*.wcpos.com`**, set
   `Domain=.wcpos.com` on the `wcpos-analytics-consent` cookie on **both** docs and the website
   (a coordinated change in `wcpos-com/src/lib/analytics/consent.ts`). Person-stitching already
   works without this; it's purely a consent-UX nicety.
4. **Experiments.** `posthog-js` is initialised, so feature flags / experiments are available for
   docs A/B tests (CTA copy, layout) with no extra code beyond reading a flag where we vary content.
