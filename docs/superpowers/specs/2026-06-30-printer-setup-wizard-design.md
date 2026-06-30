# Printer Setup Wizard — Design Spec

- **Date:** 2026-06-30
- **Status:** Draft for review (rev. 2 — post adversarial review)
- **Author:** kilbot (with Claude)
- **Repo:** wcpos/docs (Docusaurus docs site)
- **Tracking:** new interactive wizard at `hardware/printer-setup-wizard.mdx`

> **Rev. 2 note:** A 4-way adversarial review (translation, decision-graph, Docusaurus integration, real-world fidelity) hardened this spec. Key fixes folded in: `scheme` is now an explicitly collected answer (§7.0); the escalation model is a defined global troubleshooting budget, not per-gate (§6.4); the figure caption prop is `summary` everywhere (no `caption=`); the validity matrix is a precedence-ordered, deterministic function with the Generic-WebUSB exception (§6.5); the support summary captures self-test + endpoint evidence (§6.7); vitest needs a config change for `src/` (§10); and the new real-world failure modes require a parallel `printers.mdx` update so the wizard isn't the sole source of truth (§12.1).

---

## 1. Problem

WCPOS supports a large printer matrix — 3 vendors (Epson / Star / Generic) × 3 connections (Network / Bluetooth / USB) × 4 platforms (Web / Desktop / iOS / Android), plus 4 cloud providers, plus paper widths, command languages, templates, and routing. The average user has little understanding of IP addresses, ports, HTTP vs HTTPS, ESC/POS, or print servers. They expect to plug in a receipt printer and print.

The maintainer is a solo developer and cannot hand-hold every user. Real support threads (§3) show single issues consuming a **week** across multiple app versions, ending in refund threats — with the user re-typing the same diagnostic report each round.

**Goal:** a guided, branching wizard that collects the user's setup, gives tailored step-by-step instructions with the *why*, gates each key step with a "did it work?" check, and **loops into targeted troubleshooting until a test print succeeds** — or, when fixes are exhausted, produces a **copy-paste support summary** that replaces the manual report. Works across all 12 site locales from day one.

## 2. Non-goals (YAGNI)

- **No live hardware access.** The docs site never connects to the printer/network. Pure guidance; the WCPOS app does the real probing. (The wizard *does* instruct the user to run their own pure-guidance checks, e.g. "open `http://<printer-ip>/` in your browser.")
- **No in-wizard editing** of per-store rules, auto-print rules, or templates — link out.
- **No template builder** — link to the receipts/templates docs.
- The wizard *guides*; the app *does*.

## 3. Evidence base (real support threads)

### 3a. Star MCP31LB, Web app, HTTPS site (user "Toshi", ~1 week, refund threat)
- Web + network + Star + an **HTTPS-served POS** is effectively doomed. The browser forces HTTPS to the printer; the printer's self-test showed `<< SSL/TLS >> Self-Signed Certificate: Not exist` — **no certificate exists**, so port 443 can't work, and HTTP (80) is blocked as mixed content.
- App scheme/port forcing: user enters 80/9100, endpoint rewrites to `https://…:443` ("port 443 is selected"). One screenshot showed the endpoint preview `http://…:80` while the actual attempt was `https://…:80` — confusing display mismatch (candidate app bug, separate issue).
- `"Sent successfully" / "Sent to printer"` shown but **nothing prints** (web fire-and-forget). The success message hides the failure.
- Resolution that always worked but was found late: **the desktop app** (raw TCP 9100; self-test showed `TCP#9100 ENABLE`).
- ESL user (Japanese) re-pasted the same "BT… / LAN 80 / 443 / 9100…" report across 1.9.4 → 1.9.6.

### 3b. VINUM / DISTILLERS (multi-store FR, "Al. K", every connection type)
- **ESC/POS vs HTML print dialog is a visual tell:** blurry/photocopy-like fonts ⇒ system/HTML print dialog; crisp ⇒ ESC/POS (maintainer's verbatim diagnosis).
- **Misaligned columns ⇒ wrong Printer Text Width.** The test print's `COLUMN RULER (42 CPL) … Ruler must end flush with the right edge` is the gate.
- Epson TM-m30 self-test `Ethernet IP Address: (NONE)` ⇒ printer not on the network; a long sub-saga was caused by entering the **wrong IP (a different printer's)** before finding the right one.
- Generic **Jolimark USB on desktop Windows** → `LIBUSB_ERROR_NOT_SUPPORTED` (driver/WinUSB).
- iOS/Android **network Epson**: test ticket prints but **app crashes and printer isn't saved** (known bug → "update").
- **A Generic (Jolimark) printer DID print over USB in the browser (Chrome)** — "works perfectly via usb with the browser" — but **not always in the app** (version-dependent). *(This contradicts a naive "Generic-on-web = impossible" rule; see §6.5.)*
- "Try different templates" fixed the Generic printer.
- Heavy recurring burden around **app/plugin versions** (TestFlight, Apple review delay, APKs, which version has network/BT/USB). Maintainer's first move every time: *"click the version number."*

### 3c. Confirmed heuristics
- **Garbled / not-crisp text ⇒ likely the system/HTML print dialog instead of ESC/POS.**
- **Misaligned / wrapping columns ⇒ wrong Printer Text Width.**

Real screenshots become annotated diagnostic art (§8): crisp-vs-blurry receipts, the 42-CPL column ruler, both vendors' self-tests.

## 4. Locked decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **MDX-driven embedded wizard** — branching *logic* in a React component; all *prose + images* authored as translatable MDX. | Only path that rides the live MDX→Aide pipeline (§5). `printers.mdx` is already a linear version. |
| D2 | **New page** `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`; `printers.mdx` stays as reference. | Clean front-door; sidebar/search for free. |
| D3 | **Pure guidance** — no hardware calls. | Reliability everywhere; the app probes. |
| D4 | **Goal-oriented loop** + **support summary** escape hatch after a defined troubleshooting budget. | Matches real failure mode. |
| D5 | **Translated day one** via MDX→Aide. Component prose-free; visible props use gate-recognized `TEXT_PROPS` only, **double-quoted**. | The `<Translate>`/`code.json` path is dead in this repo (§5). |
| D6 | **Cloud printing in scope** — all 4 providers. | User requirement. |
| D7 | **Self-test decoding is a core feature** (Star + Epson). | Real root causes hide in the self-test. |
| D8 | **Use real screenshots, annotated** (redact business names / SIRET / emails / IPs). | Fast, convincing visuals. |

## 5. Translation: why MDX content, not `<Translate>` (load-bearing)

Verified against the repo:
- The pipeline (`scripts/detect-doc-translation-changes.js`, `forward-docs-translations-to-aide.yml`) globs **only** `versioned_docs/**/*.{md,mdx}`, `i18n/en/**/*.json`, `versioned_sidebars/**`, `sidebars.js`, `docusaurus.config.js`. `src/**` is never swept.
- The completeness gate (`scripts/check-translation-completeness.js`) enforces translation of MDX prose **and** the JSX text-props `TEXT_PROPS = ['alt','title','description','label','question','summary','placeholder']` (line 41 — exact).
- The `<Translate>` / `code.json` path is **dead in practice**: `ConsentBanner`'s shipped `consent.text` ID is absent from **every** `code.json` incl. `i18n/en/code.json`; locale files frozen 2026-01-16, 9/12 at 319 vs 588 lines. MDX translations are current (last Aide update 2026-06-08).

### 5.1 Authoring rules (each is a silent-English landmine if broken)
1. **Every user-visible string** is either MDX `children` or a value of one of the seven `TEXT_PROPS`. A visible label on any other prop name (e.g. `heading=`, **`caption=`**) ships English-only with **no gate warning** — the gate only reads the literal attribute name in the source.
2. **The gate is a static text scan of the `.mdx` source.** It does **not** see rendered output. So a component that forwards `caption=` → `summary` internally is invisible to the gate — the *authored* attribute name must already be a `TEXT_PROPS` name. **`WizardFigure`'s caption prop is literally `summary`** (no `caption` attribute exists).
3. **All translatable props must be double-quoted.** The gate's regex matches `prop="..."` only — **single-quoted props are invisible** and ship English-only. If a value embeds a `"` (likely for self-test strings, `"Sent successfully"`, etc.), put it in `children` prose or rephrase — never single-quote a `TEXT_PROPS` value.
4. **Machine props never carry visible prose.** `id`, `value`, `showWhen`, `goTo`, `branch`, `src`, `escalateTo` are ignored by the gate (correct), so any prose mistakenly placed there ships untranslated with no coverage. Conditionally-rendered (`showWhen`) children **are** still extracted/translated (the gate reads static text, never executes `showWhen`) — verified.
5. **Brand/proper-noun allowlist.** The gate only flags **multi-word** identical values (≥2 words). Single-word brands (`PrintNode`, `ePOS`, `WebPRNT`, `StarPRNT`, `ESC/POS`, `WinUSB`, `Zadig`, `TestFlight`) pass automatically — do **not** allowlist them. **Multi-word** brand strings used as `title=`/`label=`/etc. **must** be added to `UNTRANSLATED_PROP_ALLOWLIST` in `check-translation-completeness.js`, or the gate fails the PR and the self-healing sweep loops forever. Audit before each phase; at minimum this design introduces: `Star Line Mode`, `Web Bluetooth`, `Star CloudPRNT`, `Epson Server Direct Print`, `Star Online`, and any multi-word printer model names used as labels (e.g. `Star MCP31LB`). (`Star CloudPRNT` etc. are already allowlisted; verify exact casing.)
6. **Frontmatter `description` double-quoted** (`canonicalizeDescriptionQuoting` + `validate-frontmatter --check --changed`).
7. **Explicit `{#anchor}` on every heading** (gate stale-detection compares anchors).
8. **One open `aide/docs-translations-*` PR at a time** — land the English page, let the single translation PR carry it.

## 6. Architecture

### 6.1 File layout

```
src/components/PrinterWizard/
  index.js            # <PrinterWizard>: builds registry from children, runs reducer, renders active node
  reducer.js          # pure state machine: SELECT / BACK / RESTART / HYDRATE_FROM_URL
  buildGraph.js       # pure: introspect children → node registry (by imported identity)
  validity.js         # pure: precedence-ordered validity(vendor, connection, platform, browser)
  urlState.js         # pure: encode/decode wizard state ↔ compact URL-safe hash token
  summary.js          # pure: derive support-summary text from answers + history
  nodes/              # prose-free node components: WizardQuestion, WizardChoice, WizardStep,
                      #   WizardGate, WizardFix, WizardInvalid, WizardTerminal, WizardFigure
  styles.module.css   # wizard chrome (selected states, progress, summary); logical CSS for RTL
  __tests__/          # vitest: reducer, buildGraph, validity (all combos), urlState, summary

versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx   # authored tree (all prose + images)
static/img/printer-wizard/                                      # annotated diagnostic images
```

Pure modules (`reducer`, `buildGraph`, `validity`, `urlState`, `summary`) must have **no `@site` imports and no JSX**, so they run under the existing node test environment. The component lives in version-independent `src/`; only the thin MDX wrapper is versioned. `printers.mdx` already imports `@site/src/components/...`, so a versioned MDX importing `PrinterWizard` works; sidebar autogeneration (`{type:'autogenerated', dirName:'.'}`) picks the page up with no `sidebars.js` change — **set `sidebar_position` in frontmatter** or it sorts by filename.

### 6.2 MDX-as-source-of-truth + the children contract

The MDX authors the whole tree declaratively; `PrinterWizard` introspects its children into a node registry. Two verified facts make this safe, and two contracts make it correct:

- **Verified:** because the MDX explicitly `import`s the node components, MDX emits **direct component references**, so `child.type === WizardStep` matches by identity (compiled against the repo's `@mdx-js/mdx` 3.1.1). Nested `WizardStep > WizardGate > WizardChoice` walks fine.
- **Contract A — identity, not strings.** `PrinterWizard` and the MDX must import the node components from the **same `nodes` module**; the registry matches on imported identity, never `displayName`/string.
- **Contract B — nodes render their own children; the engine only reads edges.** Inline prose compiles to themed elements (`<p>`, `<ul>`, admonitions), so a `WizardStep`'s `children` is a mixed array like `[<p/>, <Steps/>, <WizardFigure/>, <WizardGate/>]`. **The engine does not re-derive prose.** A `WizardStep` renders its own subtree exactly as authored (including reused `<Steps>`, admonitions, `<WizardFigure>`); the engine only locates the single descendant `WizardGate` (and its `WizardChoice` edges) for routing. `buildGraph` registers only elements whose `.type` is a known node reference, recurses to flatten, and passes everything else through untouched.

```mdx
import PrinterWizard from '@site/src/components/PrinterWizard';
import { WizardQuestion, WizardChoice, WizardStep, WizardGate, WizardFix, WizardInvalid, WizardTerminal, WizardFigure } from '@site/src/components/PrinterWizard/nodes';

<PrinterWizard>
  <WizardQuestion id="platform" title="Which app are you using WCPOS in?">
    <WizardChoice value="web"     label="Web browser" goTo="web-browser" />
    <WizardChoice value="desktop" label="Desktop app (Windows/Mac)" goTo="connection" />
    <WizardChoice value="ios"     label="iPhone / iPad" goTo="connection" />
    <WizardChoice value="android" label="Android" goTo="connection" />
  </WizardQuestion>

  <WizardStep id="web-network-epson-https" showWhen="platform=web & connection=network & vendor=epson & scheme=https" title="Print a self-test and check for a certificate">
    Your POS runs over HTTPS, so the browser will only talk to the printer over HTTPS too…
    <WizardFigure src="/img/printer-wizard/epson-selftest-annotated.png" alt="Epson self-test with the SSL/TLS section highlighted" summary="Find the SSL/TLS block — if no certificate exists, web HTTPS printing can't work." />
    <WizardGate id="g-testprint-web-epson" question="Did the test print succeed?" escalateTo="support">
      <WizardChoice value="yes" label="Yes, it printed" goTo="g-width" />
      <WizardChoice value="no"  label="No / it errored"  goTo="fix-web-https-cert" />
    </WizardGate>
  </WizardStep>
</PrinterWizard>
```

### 6.3 Node kinds

| Kind | Purpose | Translatable | Machine props |
|---|---|---|---|
| `WizardQuestion` | Collect an answer | `title`, choice `label`s | `id`, choice `value`/`goTo` |
| `WizardChoice` | One option | `label` | `value`, `goTo` |
| `WizardStep` | Instructions (+ `<Steps>`, `<WizardFigure>`, admonitions) → gate; renders its own subtree | children, `title` | `id`, `showWhen` |
| `WizardGate` | "Did it work?" branch | `question`, choice `label`s | `id`, `escalateTo`, choice `value`/`goTo` |
| `WizardFix` | A specific fix; loops back | children, `title` | `id`, `goTo` |
| `WizardInvalid` | Dead-end combo: why + valid alternative | children, `title` | `id` |
| `WizardFigure` | Annotated image | `alt`, `summary` (caption) | `src` |
| `WizardTerminal` | `success` next-steps or `support` summary | children | `kind` |

### 6.4 Reducer, looping & escalation (resolved — was the §13 gap)

- **State:** `{ currentId, answers: {questionId: value}, history: [nodeId, …], fixCycles: number, visitedFixes: Set }`
- **Actions:** `SELECT(value)`, `BACK`, `RESTART`, `HYDRATE_FROM_URL(payload)`.
- **`SELECT`** records the answer for the current question/gate, pushes to `history`, advances to the chosen `goTo`.
- **Looping** is an edge that points back to an earlier `WizardStep`/`WizardGate`.
- **Escalation (global, not per-gate).** Entering any `WizardFix` increments `fixCycles` and adds the fix id to `visitedFixes`. The reducer routes to the `support` terminal when **any** of:
  1. `fixCycles >= 3` (global troubleshooting budget — survives loops that cycle through *different* gates, the §3a/§3b reality), or
  2. the user picks a `WizardChoice value="still-broken"` (every troubleshooting branch offers one), or
  3. a fix's `goTo` resolves to a gate already in `visitedFixes`'s recent cycle (no-progress cycle detection).
  The support target is the gate's `escalateTo` if present, else the single well-known `support` terminal. Authors never hand-wire escalation per choice; they only set `escalateTo` to override the default.
- **`BACK`** pops `history`, **clears the answer of the question being left** (so `showWhen` recomputes correctly on the way forward), and decrements `fixCycles` if backing out of a fix. `RESTART` clears all state to the start node.
- All of `reducer`, `buildGraph`, `validity`, `urlState`, `summary` are **pure** and unit-tested (§10), including: escalate-after-3-cycles, multi-gate loop termination, no-progress cycle detection, and BACK-clears-answer.

### 6.5 Validity matrix — precedence-ordered, deterministic, with the WebUSB exception

`validity(vendor, connection, platform, browser?)` returns `valid | uncertain(note) | invalid(reasonKey)`. Evaluate **in order; first match wins** (this removes the §6.5-rev1 overlap where Generic+Network+Web matched two reasons):

1. `platform=ios & connection=usb` → **invalid `ios-usb`** (iOS has no general USB peripheral support).
2. `platform=web & connection in {bt,usb} & browser in {safari,firefox}` → **invalid `web-btusb-browser`** (WebUSB / Web Bluetooth are Chrome/Edge only — and even in Chrome/Edge, BT requires Epson/Star; USB-Generic is the exception below).
3. `platform=web & connection=network & vendor=generic` → **invalid `web-generic-network`** (browsers can't open raw TCP; no built-in web server to reach).
4. `platform=web & connection=bt & vendor=generic` → **invalid `web-generic-bt`** (the app's Web Bluetooth path supports Epson/Star only).
5. `platform=web & connection=usb & vendor=generic & browser in {chrome,edge}` → **`uncertain` (WebUSB)** — *real evidence (§3b) shows a Generic printer printed over WebUSB in Chrome.* Treat as **attempt-then-fallback**: walk the WebUSB setup, and if it fails, route to the desktop-app recommendation. **Verify exact app support before locking.**
6. `platform in {ios,android} & connection in {bt,usb} & vendor=generic` → **invalid `mobile-generic-btusb`** (mobile BT/USB go through Epson/Star native SDKs; Generic is network-only on mobile).
7. `platform=desktop & connection in {bt,usb} & vendor=generic` → **invalid `desktop-generic-btusb`** (Generic is network-only / raw TCP 9100; desktop BT/USB are the vendor SDK paths).
8. Otherwise → **valid**, with one hedge: `platform=desktop & connection in {bt,usb} & vendor in {epson,star}` is valid but **version-dependent** (§3b) — don't present desktop BT/USB as guaranteed; offer network 9100 as the reliable fallback.

The full enumerated cell→reasonKey table (3×3×4, plus the web×browser split) lives in `validity.js` and is unit-tested (§10). Each `reasonKey` maps to one `WizardInvalid` node with translatable prose + a valid alternative (Desktop app for Generic; Chrome/Edge for web BT/USB; Network instead of BT/USB for Generic on mobile; or cloud printing).

**Vendor-bound network ports** (never offer the wrong pair): **Epson ePOS 8008 (HTTP) / 8043 (HTTPS)**; **Star WebPRNT 80 (HTTP) / 443 (HTTPS)**; **Generic raw TCP 9100** (desktop/mobile only). Default the port from the detected/declared vendor.

### 6.6 URL hash state (resume, share, SSR-safe)

- Encode `answers` into a **compact, URL-safe opaque token** in the **URL hash** (`#wiz=<token>`) — never raw `platform=web&...` (the locale switcher concatenates `${finalSearch}${hash}` naively, so `&`/`=`/spaces must be encoded). Never query/path (stays out of the `trailingSlash` blast radius; `vercel.json` sets `trailingSlash:false` + `cleanUrls:true`).
- **Cross-locale resume depends entirely on hash hydration.** A locale switch is a **full reload** (separate build per locale); there is no in-memory carryover. The swizzled `LocaleDropdownNavbarItem` preserves the hash, and the engine rehydrates from it on mount. If hydration is buggy/deferred, cross-locale resume silently breaks — cover it in tests.
- **SSR-safe (single highest-risk line):** `useReducer`'s initial state is the **static start node**. **Never** read `window`/`location` in render or in the reducer initializer (keep `urlState.decode` out of the initializer entirely). Dispatch `HYDRATE_FROM_URL` only inside `useEffect` after mount (the `ConsentBanner` pattern). Write back with `history.replaceState`. A render-count / SSR-CSR snapshot test guards against someone moving decode into the initializer.

### 6.7 Support summary (captures what enabled remote diagnosis)

Derived from `answers` + `history`, rendered as **copy-to-clipboard plain text + the resumable link**. Fields:
- Platform + **app/plugin version** (§7.0)
- Connection, vendor, browser (web), printer model
- POS scheme (HTTP/HTTPS), IP/port(s) tried
- **Self-test findings** (from §7.3, captured into `answers`): certificate present? `TCP#9100` enabled? DHCP on? printed IP
- **Observed app endpoint/scheme/port** — what the app showed vs what the user entered (the §3a mismatch that pinpointed root cause)
- Paper width / template type
- The specific symptom, which troubleshooting branches were tried, and the terminal node id where they stalled

A support agent pastes the resumable link and lands on the same state. *(These are exactly what "Toshi" hand-typed each round — plus the self-test/endpoint evidence the rev-1 summary dropped.)*

### 6.8 Analytics (optional, phase 3, consent-gated)

Route events through the **existing analytics module's consent-respecting capture helper** (in `src/analytics/`), **not** a `window.posthog` global — in this repo PostHog is held in a module-local handle behind `startPostHog()`, so `window.posthog` may be `undefined` even after consent. Never import posthog directly (breaks consent + SSR). **v1 events (coarse):** `wizard_started`, `wizard_completed`, `wizard_summary_copied`, `wizard_loop`. Defer per-node `wizard_step` (high-cardinality) until drop-off data shows it's needed.

## 7. Content: the decision graph

Authoritative node list = Appendix A. Highlights and the real-world additions:

### 7.0 Step 0 — platform, browser, version, scheme
First questions establish the gating variables every downstream `showWhen` needs:
- **Platform** (Web / Desktop / iOS / Android).
- **Browser** (web only): Chrome/Edge vs Safari/Firefox — gates WebUSB/Web Bluetooth validity (§6.5 rule 2).
- **POS scheme** (web only): *"Look at your POS address bar — does it start with `https://` or `http://`?"* → `answers.scheme = https|http`. **This is the variable the entire §3a redirect keys on; it must be collected, not assumed.** (We can't read it client-side — the docs site is a different origin.)
- **Version:** *"click the version number in the sidebar — are you on the latest?"* Many real issues were "fixed in a newer build." Feeds the summary; if clearly outdated → "update first" branch (Apple/TestFlight review delay for iOS; APK link for Android; in-app for desktop/web).

### 7.1 Local branch
`platform → (browser + scheme, if web) → connection → vendor`, gated by the validity matrix. Setup spine (S1–S6 from `printers.mdx`): open Printer Settings → choose connection → identify printer (IP / scan / device chooser) → advanced (language, width, raster, vendor, vendor-bound port) → options (auto-cut, drawer, default) → **Save & Test** (test print first, save on success).

**Proactive steering (now wired — fires on the collected `scheme`):** when `platform=web & connection=network & vendor in {epson,star} & scheme=https`, lead with: *web network printing here is unreliable (no raw TCP; HTTPS forces 443/8043; needs a printer SSL cert) → use the **Desktop app** (raw TCP 9100).* This early redirect resolves the §3a class before the user touches ports/certs.

### 7.2 Verify gates (loop points)
- `G-detect` — printer detected / "Detected: Epson/Star" shown? No → FM-1.
- `G-testprint` — test print succeeded (Save completed)? No → diagnose by symptom.
- `G-width` — **column ruler ends flush with the right edge?** No → FM-4 (wrong width). *Real 42-CPL ruler image.*
- `G-crisp` — **is the text crisp, or blurry/photocopy-like?** Blurry → FM-dialog (printing via system/HTML print dialog; switch to ESC/POS). *Real crisp-vs-blurry image.*
- `G-chars` — legible, correct script? No → **two sub-branches:** (a) **Latin-script garble** → command-language switch (FM-3); (b) **non-Latin / RTL script** → Full receipt raster / matching code page (N-RASTER). *Don't loop an Arabic user through language-switching first.*
- `G-drawer` — cash drawer kicked? No → FM-7.
- All pass → success leaf (set default / routing).

### 7.3 Self-test decoding (core feature, D7)
First-class node: "Print your printer's self-test" (Star: hold FEED 5s while powered on; Epson: hold FEED while powering on) with **annotated images** and decode rules. Each decode pairs with its figure (don't ship decode prose that needs the user to parse raw self-test text unaided), and each conclusion leads with the simplest action:
- **Star:** `Self-Signed Certificate: Not exist` ⇒ HTTPS printing impossible until a cert is generated → **use the desktop app** (no cert needed — lead with this, not "generate a cert"). `DHCP ENABLE` ⇒ address may change; the durable fix is again the desktop app or a router DHCP reservation (link, since setting a static IP is itself non-trivial). `TCP#9100 ENABLE` ⇒ desktop/mobile raw TCP will work. Read **Current IP Parameters** for the real IP.
- **Epson:** `Ethernet IP Address: (NONE)` ⇒ not on the network (check cable/Wi-Fi). **Confirm the printed IP matches what you're entering** — multiple printers cause wrong-IP failures.
- The wizard captures the user's answers to these into `answers` so the **support summary** (§6.7) includes them.

### 7.4 Failure-mode catalogue
From `printers.mdx#troubleshooting` plus real-world additions (the latter **also require a parallel `printers.mdx` update**, §12.1, so the wizard can deep-link a stable anchor and isn't the sole source of truth):
- FM-1 not detected; FM-2 detected-but-nothing; FM-3 garbled (wrong language, Latin); FM-4 misaligned (width); FM-5 web can't connect (Generic/raw not supported in browser); FM-6 mixed content (HTTP printer + HTTPS POS); FM-7 cash drawer; FM-8 BT won't connect (mobile).
- **FM-dialog (new):** blurry / not crisp ⇒ printing via system/HTML print dialog ⇒ route the thermal template to the ESC/POS printer profile.
- **FM-web-silent (new):** "Sent successfully / Sent to printer" but nothing prints ⇒ web fire-and-forget over wrong scheme/port/cert ⇒ desktop app, or fix scheme/port, or accept the printer's self-signed cert by visiting `https://<ip>` first.
- **FM-web-https-cert (new):** Star/Epson web + HTTPS + no printer cert ⇒ (a) generate + trust a self-signed cert (visit `https://<ip>`, accept), or (c) **use desktop** (recommended). **Drop the rev-1 option "(b) HTTP printer on port 80 + Chrome local-network permission" for an HTTPS POS** — `printers.mdx` is explicit that an HTTP printer on an HTTPS POS is blocked as **mixed content** and both must share a scheme; option (b) only applies if the **POS itself is served over HTTP**, so present it solely under that condition.
- **FM-generic-usb-win (new):** desktop Windows Generic USB `LIBUSB_ERROR_NOT_SUPPORTED`. **Lead with "use network (port 9100) instead."** The WinUSB/Zadig driver-swap is gated behind an explicit *"advanced — at your own risk"* disclosure (Zadig can disrupt other USB devices).
- **FM-usb-app-version (new):** USB prints in the browser (Chrome) but not in the app ⇒ keyed off the §7.0 version answer ⇒ update the app, or keep using the browser meanwhile.
- **FM-crash-on-save (new):** iOS/Android network printer prints test but app crashes / not saved ⇒ known bug → update to latest.
- **FM-wrong-ip (new):** can't reach the IP ⇒ confirm via self-test it's *this* printer's IP (multiple-printer mix-up).

Pure-guidance diagnostic the wizard instructs: **"Open `http://<printer-ip>/` in your browser — do you see the printer's page?"** Yes → reachable, issue is WCPOS scheme/port. No → network/IP problem.

### 7.5 Cloud branch (D6) — tightened against the docs
Provider fork → per-provider sub-tree + troubleshooting:
- **Star CloudPRNT / Epson SDP (polling):** generate poll URL + one-time token → paste into firmware → status **Waiting→Connected** → assign thermal template → test. CFM-1 stuck-on-Waiting. *Render site differs: Star CloudPRNT renders **on the device**; Epson SDP renders **on the server** — a "job never prints" diagnosis routes to the device vs the server/template-render layer accordingly.*
- **PrintNode (relay):** install client + API key → select printer → status **Online / Offline** → test. Any template (PDF, server render). CFM-PN (client offline / wrong printer / revoked key). Add an **Offline** branch.
- **Star Online (relay):** copy the **CloudPRNT URL** (note region: `device.stario.online` vs `eu-device.stario.online` — wrong region → 401) + API key with **all four permissions: EnumDevices (fetch list), ViewDevice (status), PrintToDevice (print), ViewDeviceGroups (group lookup/diagnostics)** → Fetch my devices → select → status **Online / Offline / Unknown** → test (server render). CFM-SO: 401 (auth / wrong account or region), 403 (missing permission), empty-group, Offline/Unknown.

### 7.6 Cross-cutting nodes
- **Template selection:** raw thermal hardware ⇒ Thermal (ESC/POS) template; system dialog / PDF / PrintNode ⇒ HTML/any. Engine fixed at creation.
- **Width:** prefer `width="*"`; for hard-coded columns, budget to the **selected Printer Text Width** (32 / 42 / 48), with **42 as the default when unknown** (not universally 42 — an 80mm-wide 48-col printer would waste 6 columns). The `G-width` gate reconciles the chosen width with the template's columns.
- **Print routing:** per-job → settings → auto-match; mismatch warning ties to FM-dialog.

## 8. Imagery (D8)
- Per-node `<WizardFigure src alt summary>`; `alt` and `summary` (the caption) are translatable. **No `caption` attribute exists.**
- Host our own under `static/img/printer-wizard/`. **Redact** business names, SIRET, emails, phones, real IPs.
- Initial set (annotated from real screenshots; mostly language-neutral): Star self-test (SSL/TLS + DHCP + TCP ports); Epson self-test (`IP (NONE)`); 42-CPL column ruler; crisp-vs-blurry receipt pair; Add Printer form (port/scheme + endpoint preview); web HTTPS cert error state.
- Where an image embeds UI text, prefer a translatable `summary` callout over 12 localized image variants.

## 9. i18n checklist (authoring)
- [ ] Every visible string in `children` or a `TEXT_PROPS` prop, **double-quoted**.
- [ ] No `caption=`, `heading=`, or other non-`TEXT_PROPS` name for visible text.
- [ ] No single-quoted translatable props; no visible prose in machine props.
- [ ] Frontmatter `description` double-quoted; `sidebar_position` set.
- [ ] Multi-word brand strings added to `UNTRANSLATED_PROP_ALLOWLIST` (blocking — see §12).
- [ ] Explicit `{#anchors}` on headings; all internal links resolve in every locale (`onBrokenLinks:'throw'`).
- [ ] RTL (`ar`): logical CSS (`inset-inline`, `margin-inline`); flipping chevrons/icons.
- [ ] Land English page → single open `aide/docs-translations-*` PR carries translations (locales fall back to English until the sweep — acceptable).

## 10. Testing
- **vitest config change required.** `vitest.config.js` currently globs only `**/scripts/__tests__/**` with no jsdom/`@site` alias — `src` tests would silently not run. Extend `include` to `src/**/__tests__/**/*.test.js`; keep pure modules JSX/`@site`-free so they run under node; if any test renders a component, add `environment:'jsdom'` (+ the `jsdom` devDep) and a `resolve.alias['@site']` → repo root.
- **Pure-function units:** `buildGraph(children)` (incl. a themed-`<p>` sibling fixture), `reducer` (SELECT/BACK-clears-answer; escalate-after-3-cycles; multi-gate-loop termination; no-progress cycle), `validity` for **all** combos incl. the web×browser split → expected node, `urlState` encode/decode round-trip (URL-safe), `summary` derivation (incl. self-test fields).
- **Full 12-locale `pnpm build`** in CI (the repo already runs it on PRs) — `onBrokenLinks:'throw'`, so every wizard link must resolve in every locale.

## 11. Risks & gotchas
- **SSR hydration:** start node on server + first paint; hydrate hash in `useEffect`; never decode in the reducer initializer (§6.6). React 19 throws on mismatch.
- **trailingSlash:** hash only, URL-safe token; no new query-param scheme.
- **Icons:** `Icon.js` `iconMap` is **missing** copy/clipboard/chevron-left/chevron-down/circle-check/circle-xmark/rotate-left/share. It `console.warn`s + renders nothing for unknown names (won't break the build, but the glyph is silently absent). Add needed glyphs up front, or use the CSS-module chrome for wizard controls.
- **Button:** defaults `external=true` (target=_blank) and ignores children. For internal links pass **`external={false}`** (or use Docusaurus `<Link>`) and **`label=`**.
- **Links:** keep wizard link targets a small reviewed constant set; prefer page roots over deep anchors; the full build is the gate.
- **Advanced leaves** (Zadig/WinUSB, self-signed certs) marked advanced/optional; the simple "use the desktop app" escape always leads.
- **Versioning:** component shared, MDX wrapper versioned; node graph tracks current product.

## 12. Build order
1. **Engine + local branch** (Step-0 platform/browser/scheme/version, validity matrix, setup spine, gates incl. width + crisp + split-garble + self-test decode, real images, support summary). Covers the bulk of support pain.
2. **Cloud branch** (4 providers) — **blocking checklist item: add the 4 cloud brand strings to `UNTRANSLATED_PROP_ALLOWLIST` in the same PR** (multi-word; un-allowlisted → sweep loops corpus-wide). Cannot be a follow-up.
3. **Analytics drop-off** (coarse events) + polish.

Each phase is a mergeable increment; the engine is built once; translation happens automatically per merge.

### 12.1 Documentation dependency (parallel `printers.mdx` update)
The new real-world failure modes (FM-dialog, FM-web-silent, FM-web-https-cert, FM-generic-usb-win, FM-usb-app-version, FM-crash-on-save, FM-wrong-ip) currently have **no published reference anchor**. Before/with phase 1, add them to `printers.mdx#troubleshooting` (or a new section) so the wizard deep-links a stable anchor rather than being the sole source of truth. This MDX edit is itself translated by the pipeline — a bonus improvement to the reference page.

## 13. Open questions (genuinely deferred — cosmetic only)
- Exact global troubleshooting budget (default 3 cycles) — tune after real use. *(The escalation **mechanism** is resolved in §6.4.)*
- "How to update" link granularity: one canonical section vs per-platform anchors.
- Verify the **Generic + Web + USB (WebUSB)** cell against actual app behavior before locking §6.5 rule 5.

---

## Appendix A — Full decision & troubleshooting graph

> Source: `hardware/printers.mdx`, `receipts/cloud-printing.mdx`, `receipts/{thermal-templates,html-templates,index,customise}.mdx`. No printer content in `support/troubleshooting/*` or `error-codes/*`.

### Root
- **N0:** attached to this till (Local, N1) vs remote/shared/another-network (Cloud, N100).
- Recommendations: remote/shared ⇒ cloud; thermal next to a desktop ⇒ Local via Desktop app (raw TCP); behind an uncontrolled router ⇒ polling cloud (outbound-only).

### Local (N1–N6)
- N1 platform · (web: browser + scheme) · N2 connection · N3 vendor (auto-detected on network probe / device pick).
- **Validity** — precedence-ordered function, §6.5. Summary by platform:
  - **Web:** Epson/Star Network need built-in web server (Epson ePOS 8008/8043; Star WebPRNT 80/443); Web BT/USB Chrome/Edge only; Generic Network ❌, Generic BT ❌, **Generic USB = uncertain (WebUSB in Chrome/Edge; verify)**.
  - **Desktop:** Epson/Star Network ✅; Epson/Star BT/USB ✅ but version-dependent; Generic Network ✅ (raw TCP 9100), Generic BT/USB ❌.
  - **iOS:** Epson/Star Network/BT ✅, USB ❌; Generic Network ✅ only.
  - **Android:** Epson/Star Network/BT/USB ✅; Generic Network ✅ only.
- Setup spine S1–S6; advanced (Language ESC/POS | StarPRNT | Star Line Mode; Width 58mm=32 / 80mm=42 / 80mm-wide=48; Full receipt raster; Vendor; vendor-bound Port). Options: auto-cut, drawer kick (DK port), set default.
- Gates: G-detect, G-testprint, G-width, G-crisp, G-chars(Latin→language / non-Latin→raster), G-drawer → success L-LOCAL-OK.
- Failure modes FM-1…FM-8 + FM-dialog, FM-web-silent, FM-web-https-cert, FM-generic-usb-win, FM-usb-app-version, FM-crash-on-save, FM-wrong-ip (§7.4).
- N-RASTER: non-Latin/RTL ⇒ Full receipt raster (slower; image) or matching code page (CP864/Windows-1256). N-ROUTING: per-job → settings → auto-match; mismatch warning.

### Cloud (N100+)
- Provider fork. Star CloudPRNT (polling, thermal, **device render**). Epson SDP (polling, thermal, server render). PrintNode (relay, PDF, any template, server render). Star Online (relay, Star Document Markup, thermal, server render).
- Sub-trees with gates (Waiting→Connected; Online/Offline; Online/Offline/Unknown; Fetch-my-devices) and CFM-1 / CFM-PN / CFM-SO (401/403/empty/region/Offline-Unknown) / CFM-template.
- Star Online permissions: **EnumDevices, ViewDevice, PrintToDevice, ViewDeviceGroups.** CloudPRNT URL region: `device` (US) vs `eu-device` (EU).
- Auto-print rules (scope × printer × template), manual print (render site differs), per-store (Pro) — link out.

### Cross-cutting
- C — template selection (thermal vs HTML; engine fixed at creation; `width="*"` or budget to selected width).

## Appendix B — Key source files
- `versioned_docs/version-1.x/hardware/printers.mdx`; `receipts/{cloud-printing,thermal-templates,html-templates,index,customise}.mdx`
- `src/components/ConsentBanner/index.js` (+ `styles.module.css`) — SSR mount-guard precedent
- `src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js` — hash preservation + trailingSlash
- `scripts/{detect-doc-translation-changes,check-translation-completeness,translate-docs,validate-frontmatter}.js`
- `src/components/{Steps,StepCard,Accordion,AccordionItem,LinkCard,PlatformBadge,Icon,Button}.js` — reuse (mind `Icon` iconMap + `Button` external/label)
- `src/analytics/{posthog,consent}.js` — consent-gated capture
- `vitest.config.js` — needs `include` + alias change for `src` tests; `docusaurus.config.js` (i18n, onBrokenLinks); `vercel.json` (trailingSlash)
