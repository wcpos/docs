# RFC — Decouple error-code help content from the runtime catalogue

**Status:** Proposed · 2026-08-24
**Repos:** `monorepo-v2` (app + registry), `docs` (help site)
**Supersedes:** the `docsBody`-in-registry generation model

---

## 1. Problem

`error-registry.json` is the single source for *both* the runtime error contract *and* the help documentation. These have opposite requirements:

| | Error **contract** | Help **content** |
|---|---|---|
| Audience | runtime + machine | humans |
| Size | bounded, tiny | unbounded |
| Holds | code, enums, one-line microcopy | prose, images, wizards, video |
| Ships in | the app bundle | the docs site |
| Change cadence | app release | docs deploy |

Forcing help into a `docsBody` string: (a) caps docs at template-shaped boilerplate — the origin of the "What to do / Where to look" filler; (b) ships unused prose in the app bundle; (c) gates every doc edit on the app's byte-identity generator test; (d) **has no home for images / wizards / YouTube** — a string field can't hold them.

The generator solved a genuine problem (coverage + sync) with the wrong primitive: **content flows contract → docs**, which is what limits the docs. Invert it.

## 2. Principle

> **Sync the keys and the facts — never the content.** The error *code* is the contract; the help *page* is free.

Docs **own** the content and **pull a thin data manifest** from the contract. A coverage check enforces the join on *keys*, not content.

## 3. Architecture

### 3.1 The Catalogue — monorepo, thin, runtime-only
`error-registry.json` keeps only what the app needs:
- **identity:** `code`, `symbol`, `domain`, `severity`, `introducedIn`
- **behavior enums:** `retryPolicy`, `dataSafety`, `escalation` (drive retry logic + risk banners)
- **microcopy (app i18n):** `summary` (reason line) + **`actionHint`** (guidance line)

**Removed:** `docsBody` (docs own prose now). **Retired:** `safeAction` — its *only* runtime consumer is the guidance text in `logs/row-detail.tsx`; once `actionHint` supplies that text per-code, `safeAction` has no reader (verify no other branch/test depends on it before deleting).

**DECISION — guidance text = per-code `actionHint`.** Each code authors its own one-line hint ("Update WCPOS on the store"), translated via the app pipeline exactly as #1526 does for `summary`. This dissolves the AUTH331 bucket-gap: the 5 generic `safeAction` buckets could never say "update the plugin"; a per-code string can. Behavior enums stay; only the *text* stops being bucketed.

### 3.2 The Help pages — docs repo, rich, hand-authored
One MDX page per code, full Docusaurus power (prose, `static/` images, `<Wizard>`, YouTube embeds, `<Tabs>`, cross-links). Normal editorial workflow, normal translation wave.

**DECISION — stay in `versioned_docs/version-1.x/error-codes/`.** Error pages are keyed by code with stable URLs (`/error-codes/{code}`) and effectively never move, so the "5-part page-move" cost mostly doesn't apply. New codes are *added*, not relocated (see §5 checklist).

Migration seed: the good sections of today's generated pages (*What this means*, *Troubleshoot*) become the initial authored content; the boilerplate sections are dropped.

### 3.3 The join — manifest + coverage contract (the only coupling)
- Monorepo generates a tiny **`error-catalogue.json`** — *data only, no prose*: `code`, `symbol`, `severity`, `introducedIn`, `domain`.
- **DECISION — CI-bot file sync.** When `error-catalogue.json` changes in the monorepo, a bot opens a PR into the `docs` repo updating the committed copy. No package to publish; committed file → reproducible, no network at build. (Auth caveat: the wcpos bot-app has 404'd before on dependabot auto-merge — the sync bot's token/app permissions must be verified working, or this silently stops.)
- Docs render the "Details" box via `<ErrorMeta code="AUTH331" />` reading the committed manifest → severity / introduced-in **cannot drift** (imported, never hand-copied).
- **Coverage CI (docs repo):** assert `codes(manifest) == pages(error-codes/)` both directions. A new code with no page → red build. **The bot's sync PR is where the "write the page" gate fires** — it lands the manifest entry and fails until the page exists.
- App "Learn more" builds `docs.wcpos.com/error-codes/{code}`. Nothing else crosses.

## 4. Data flow

```
BEFORE  registry(docsBody) ──generate──▶ .mdx (capped)
                            └────────────▶ ERROR_CATALOGUE (dead prose in app bundle)

AFTER   registry(thin) ──gen──▶ error-catalogue.json ──bot PR──▶ docs/ (committed)
                                                                    │ facts only
                        docs pages (OWN prose/media/wizards) ◀──────┘
                                   ▲
                                   └── docs CI: code-set == page-set   ← sync guarantee
        app: summary + actionHint (i18n, in-app) · "Learn more" → /error-codes/{code}
```

## 5. Workflow — adding a new error code (concrete)

1. **Monorepo:** add the entry to `error-registry.json` (identity + enums + `summary` + `actionHint`); `pnpm generate:error-codes` regenerates `ERROR_CATALOGUE`, the `summary`/`actionHint` i18n switches, and `error-catalogue.json`; byte-identity test guards it. Ship in the next app release; translation pipeline draws the new `summary`/`actionHint` keys.
2. **Bot:** opens a PR into `docs` updating `error-catalogue.json`. Coverage CI fails (no page yet).
3. **Docs:** author `versioned_docs/version-1.x/error-codes/{CODE}.mdx` (+ the 11 i18n mirrors + versioned sidebar entry — the versioned-sidebar entry is the one that fails the build if missed). Coverage CI goes green; merge.

## 6. Migration (phased)

- **P0 — scaffolding (docs):** add committed `error-catalogue.json` + `<ErrorMeta>` + coverage CI. Non-breaking; runs alongside current pages.
- **P1 — adopt pages (docs):** convert the 77 generated `.mdx` to hand-authored (keep *What this means* + *Troubleshoot*, drop *What to do* / *Where to look* / boilerplate *Your data*). Stop copying generated output.
- **P2 — catalogue slimming (monorepo):** add `actionHint`; retire `safeAction`; remove `docsBody` from the registry + generator + the byte-identity test's docs artifact. App release.
- **P3 — set up the sync bot** (monorepo → docs PR on manifest change).
- Fix the AUTH331-family `actionHint`s and the 2 content gaps (SYNC311, CLIENT101 — pending your steps) as part of P1/P2.

## 7. Tradeoffs (honest)

- Adding a code is now explicitly two-part (register + author page), CI-enforced. **Right friction** — the boilerplate exists today *because* authoring was free and coupled.
- Two repos own error material, split cleanly: app owns identity + microcopy; docs own help. The bot + coverage check keep them honest.
- Sync-bot auth must actually work, or the manifest silently stalls (known bot-app 404 history).
- One-time migration cost (P0–P3).

## 8. Open items

- Confirm nothing besides the guidance text reads `safeAction` before retiring it.
- `actionHint` for the plugin-update family (AUTH331, LICENSE201) + real content for SYNC311 / CLIENT101 — need product steps.
- Decide whether `dataSafety`'s risk line also becomes per-code copy later, or stays enum (kept enum here — it's a true behavioral category).
