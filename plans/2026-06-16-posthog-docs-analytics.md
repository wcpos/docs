# Implementation Plan — Migrate docs analytics from Google Analytics to PostHog

Date: 2026-06-16
Author: Paul (via Claude)
Status: **Draft for review** — implementation not yet started.

Reference: `docusaurus.config.js` (current `gtag` block), `CONTEXT.md` (IA glossary), `src/theme/DocItem` (already swizzled — feedback-widget hook).

---

## 0. Goal & context (read first)

We are consolidating all product analytics onto our **self-hosted PostHog** so we can run
experiments and measure conversions across the whole funnel instead of per-property silos.

- PostHog is **self-hosted at `https://ph.wcpos.com`** (ClickHouse stack on Hetzner; backed up
  via `wcpos-infra/services/backups`).
- It is **already live** on the plugin landing page and is being added to the new website this
  week.
- The docs site (`docs.wcpos.com`, this repo) is the **last property still on Google Analytics**
  (`@docusaurus/plugin-google-gtag`, tracking ID `G-08SJ28P1E5`).

**The single biggest win:** `docs.wcpos.com`, `wcpos.com`, and `ph.wcpos.com` all share the
`wcpos.com` root domain. PostHog stitches a visitor across subdomains via a cross-subdomain
cookie automatically, so we get **one person, one timeline** across docs → website → plugin
landing page — a cross-property funnel GA4 cannot give us cleanly. This is the reason to move,
not just feature parity.

### Current state (verified against `origin/main`)
- Docusaurus **3.10.1**, React 19, **pnpm 11.1.1** (`packageManager` pinned). Node `>=22.13 <23`.
- GA wired through the classic preset: `presets[0][1].gtag.trackingID = 'G-08SJ28P1E5'`.
- `clientModules: [require.resolve('./src/fontawesome.js')]` already exists — we extend this array.
- `src/theme/DocItem` is **already swizzled** — clean place to mount a feedback widget if we want a bespoke one.
- **12 i18n locales** (`en, es, fr, de, nl, ja, pt-BR, ko, it, ar, hi-IN, zh-CN`) — we must segment analytics by locale.
- Docs are **versioned** (`lastVersion: '1.x'`, `includeCurrentVersion: false`).
- **Algolia DocSearch** with `insights: true` (click analytics) — keep; complementary, not a conflict.
- Deployed on **Vercel**. `vercel.json` has **no CSP headers** (1033 lines, all redirects). _Confirm no CSP is injected at the Cloudflare/edge layer_ before assuming `ph.wcpos.com` + session replay are unblocked.

---

## 1. Decisions needed from reviewer (resolve before coding)

1. **PostHog project + API key.** Must be the **same project** as the website + plugin landing
   page — different projects would break the cross-property person stitching that justifies this
   work. Need the project's public API key (safe to commit, like the GA ID is today). Confirm the
   project name.
2. **Consent / GDPR posture.** GA runs today with no visible consent banner. PostHog —
   especially **session replay** — raises the privacy bar. We should **match whatever the new
   website does** for consistency. Options in §4. This is the one real product decision.
3. **Session replay: on or off for docs?** High value for finding confusing pages; also the most
   privacy-sensitive feature. Recommend **on, with input masking** (PostHog masks text inputs by
   default), gated behind consent.
4. **"Was this page helpful?" widget:** PostHog **native Surveys** (no-code, configured in the
   PostHog UI, zero repo change, instantly A/B-testable) vs a **custom swizzled component**
   (bespoke UX, structured `doc_feedback` events). Recommend native Surveys first; custom later if
   we want it inline in the page footer. See §6.

---

## 2. Integration approach — recommendation

**Recommended: a custom Docusaurus client module** that initialises `posthog-js`, rather than the
third-party `posthog-docusaurus` plugin.

Why the client module:
- We need **non-default init config** (self-hosted `api_host`, cross-subdomain persistence,
  session replay, consent gating, SPA pageview handling, super-properties for locale/version).
  The community plugin is a thin snippet-injector; we'd be fighting it for this control.
- We already use the `clientModules` pattern (`fontawesome.js`) — no new conceptual surface.
- One fewer third-party plugin to track across Docusaurus majors. `posthog-js` is the only new dep.
- The client-module lifecycle (`onRouteDidUpdate`) is exactly what we need for clean SPA pageviews
  (Docusaurus is a SPA; naive snippet injection under-counts or double-counts route changes).

Alternative (documented, not recommended): `posthog-docusaurus` plugin — faster to drop in, but
hides the init config we specifically need to customise. If the reviewer prefers a maintained
plugin over ~40 lines of our own client module, it's a viable fallback; we'd lose fine-grained
control over pageview timing and consent.

---

## 3. Implementation steps

### Phase 1 — Core PostHog integration (replaces GA capability)

**3.1 Add dependency**
```bash
pnpm add posthog-js
```

**3.2 Create `src/posthog.js` client module** (SSR-safe). Responsibilities:
- Guard for browser only (`import siteConfig`/`ExecutionEnvironment.canUseDOM`; client modules run
  client-side, but keep `posthog.init` out of any SSR path and avoid top-level browser globals).
- Initialise:
  ```js
  posthog.init('<PROJECT_API_KEY>', {
    api_host: 'https://ph.wcpos.com',
    persistence: 'localStorage+cookie',
    cross_subdomain_cookie: true,        // default true for shared root; set explicitly + document why
    capture_pageview: false,             // we capture manually on route change (see below)
    capture_pageleave: true,             // for time-on-page / bounce
    autocapture: true,                   // clicks/links without per-element instrumentation
    session_recording: { maskAllInputs: true },
    // consent: see §4 — likely opt_out_capturing_by_default: true until consent given
  });
  ```
- **Register super properties** so every event is segmentable:
  ```js
  posthog.register({
    docs_locale: document.documentElement.lang || 'en',
    docs_version: /* parse from path or DOM, e.g. '1.x' */,
    property: 'docs',                    // distinguishes docs events from website/plugin in shared project
  });
  ```
- Export `onRouteDidUpdate({ location, previousLocation })` to fire a clean SPA pageview:
  ```js
  export function onRouteDidUpdate({ location, previousLocation }) {
    if (previousLocation && location.pathname !== previousLocation.pathname) {
      posthog.capture('$pageview');
    }
  }
  ```
  (PostHog client modules can export the same lifecycle hooks Docusaurus theme modules use.)

**3.3 Wire into `docusaurus.config.js`**
```js
clientModules: [
  require.resolve('./src/fontawesome.js'),
  require.resolve('./src/posthog.js'),
],
```

**3.4 Decide hardcoded key vs env var.** The PostHog **project API key is public** (same trust
level as the committed GA ID and the committed Algolia keys above it), so hardcoding is consistent
with this repo's existing pattern. If the team prefers env injection, use
`process.env.POSTHOG_KEY` via Docusaurus `customFields` + Vercel env var. Recommend hardcoding for
parity and to avoid a build-time env dependency.

**3.5 Verify cross-subdomain ingest.** Confirm `ph.wcpos.com` accepts events from the
`docs.wcpos.com` origin (CORS / reverse-proxy on the PostHog side). Confirm no edge CSP blocks it.

### Phase 2 — High-value events & funnels (the "get value" part)

**3.6 Conversion events.** Autocapture already records clicks on the navbar/footer links to
`wcpos.com`, `/pro`, `wordpress.org`, Discord, GitHub. Build the **docs → website → download/signup
funnel in the PostHog UI** (no repo change) once stitching is verified. Optionally tag the top CTAs
with explicit `cta_click` events for cleaner funnels if autocapture selectors prove brittle.

**3.7 Docs search analytics.** Capture the Algolia DocSearch query as a `docs_search` event
(query + locale + results-or-no-results). Surfaces content gaps ("what do people search that we
don't have?"). Moderate effort — hooks DocSearch; keep in Phase 2. Algolia's own `insights` stays
on in parallel.

**3.8 (Optional) `code_copy` event** on code-block copy buttons (autocapture may already catch it;
otherwise swizzle `CodeBlock`). Low priority.

### Phase 3 — Feedback & experiments

**3.9 "Was this page helpful?"** — start with **PostHog native Surveys** targeting docs pages
(no repo change; A/B-able; results land beside everything else). If we want it inline in the page
footer with bespoke styling, add a small component to the already-swizzled `src/theme/DocItem`
that fires `doc_feedback { helpful, path, locale, version }`. Route low scores into a content
backlog.

**3.10 Experiments scaffolding.** With `posthog-js` initialised, PostHog **feature flags +
experiments** are available for docs A/B tests (CTA copy, layout, which install path we push).
No extra code beyond reading a flag where we want to vary content.

### Phase 4 — Cutover & GA removal

**3.11 Run GA and PostHog in parallel for ~2–4 weeks.** Validate PostHog pageviews/uniques look
sane vs GA before trusting it. (Note: running both means two analytics scripts + cookies during
this window — relevant to the consent decision in §4.)

**3.12 Remove GA.** Delete the `gtag` block from `docusaurus.config.js` and
`@docusaurus/plugin-google-gtag` from `package.json`; `pnpm install` to update the lockfile.
Historical GA data does **not** migrate — treat the PostHog cutover as a clean baseline; no backfill.

---

## 4. Consent / GDPR (the one real decision)

Match the website for a consistent cross-property experience. Realistic options, simplest → strictest:

- **A. Capture by default (current GA-equivalent behaviour).** Lowest friction, weakest compliance
  posture — and session replay makes "no consent" harder to defend in the EU. _Not recommended as-is._
- **B. Consent-gated (recommended).** `opt_out_capturing_by_default: true`; start capturing only
  after consent. Reuse the **same consent mechanism as the new website** (a shared banner or
  PostHog's consent helpers) so a visitor consents once across `*.wcpos.com`. Session replay only
  runs post-consent.
- **C. Cookieless / memory-only until consent.** `persistence: 'memory'` pre-consent — no cookies,
  anonymous, upgrade to full persistence on consent. Strictest; slightly more wiring.

Recommend **B**, mirroring the website. Confirm what the website shipped so docs matches exactly —
the whole point is one coherent system.

---

## 5. Testing & verification (before PR is "ready")

- `pnpm start` — PostHog loads; Network tab shows requests to `ph.wcpos.com`; events appear in
  PostHog **Live Events**.
- `pnpm build && pnpm serve` — **production build must succeed** (SSR-safe: no browser globals at
  module top level). This is the main regression risk with a client module.
- **SPA navigation** fires exactly one `$pageview` per route change (no double-count, no misses).
- **Cross-subdomain stitching:** load docs, then `wcpos.com`; confirm the **same `distinct_id`**
  (one PostHog person, not two).
- **Consent gating** works: nothing captured pre-consent under option B/C.
- **i18n:** events carry the correct `docs_locale`; spot-check a non-English locale (e.g. `/de/`).
- No console errors; confirm no edge CSP blocks `ph.wcpos.com` or session-replay assets.
- **Do not touch `i18n/**`** content (translation-pipeline-owned per `AGENTS.md`).

---

## 6. Scope / file summary

| File | Change |
|---|---|
| `package.json` | + `posthog-js`; (Phase 4) − `@docusaurus/plugin-google-gtag` |
| `src/posthog.js` | **new** — init + super-properties + `onRouteDidUpdate` pageview |
| `docusaurus.config.js` | + `posthog.js` to `clientModules`; (Phase 4) − `gtag` block |
| `src/theme/DocItem/*` | **optional** (Phase 3) — inline feedback widget |
| PostHog UI (no repo change) | funnels, surveys, dashboards, experiments, consent config |

**Out of scope:** the website's and plugin's PostHog setup (already done/in progress); migrating GA
history; Algolia changes (insights stays on).

---

## 7. Risks & notes

- **SSR build break** — the top risk with a client module; mitigated by browser-guarding init and
  testing `pnpm build`.
- **Wrong PostHog project** — would silently break cross-property stitching. Verify §1.1 first.
- **Consent mismatch with website** — would create an inconsistent banner experience across
  `*.wcpos.com`. Align before shipping.
- **Edge CSP** (Cloudflare) — if one exists, must allowlist `ph.wcpos.com` (`connect-src`,
  `script-src`, and replay). `vercel.json` has none; confirm the edge layer.
- **Pre-existing oddity:** repo has both `package-lock.json` and `pnpm-lock.yaml`; pnpm is the
  pinned/authoritative manager — update only `pnpm-lock.yaml`.
