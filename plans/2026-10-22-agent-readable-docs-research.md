# Agent-readable docs — how answer engines decide what WCPOS is (GEO / AEO research)

Date: 2026-10-22
Scope: primary sources only (vendor docs, specs, peer-reviewed / arXiv papers). Live probes of wcpos.com, docs.wcpos.com, wordpress.org, GitHub and Wikidata on 2026-10-22.
Labels: **Observed** = read on the cited primary page or seen in a command's output · **Inferred** = my reasoning from observed facts · **Unverified** = widely repeated, no primary source found.

---

## Question

When someone asks ChatGPT, Claude, Perplexity, Google AI Overviews / AI Mode or Copilot *"what POS should I use with WooCommerce?"*, what decides whether the answer names WCPOS and describes it correctly, and what can the docs (and the surfaces around them) do about it?

Verification: the load-bearing citations ([G2], [G4], [B2], [R1]) were re-fetched and quoted by a second pass on 2026-10-22; the numbers and quotes below match the sources. [G5] (Search Console Gen AI report) could not be re-read (page body not returned by the fetcher) and stays as the first pass reported it.

## TL;DR

1. **Every engine answers from a search index, not from llms.txt.** Google, Bing/Copilot, ChatGPT, Perplexity and Claude each pull pages through their own (or a partner's) search index at query time. Getting crawled, indexed and ranked is still the whole game (F1–F6). Observed.
2. **Google says GEO is just SEO.** No special files, markup, Markdown or "chunking" are needed for AI Overviews / AI Mode, and Google Search ignores llms.txt (F2). Observed.
3. **llms.txt / `.md` twins help agents that fetch a site directly** (coding agents, browser agents, Chrome Lighthouse's experimental "Agentic Browsing" audit). No answer-engine vendor says it reads them (F7). We already ship both.
4. **What the measured evidence supports:** content edits that add quotations, statistics and cited sources raised a source's share of a generated answer by about 30–40% in a lab setting. That effect only applies once the page has already been retrieved (F9, F10). Third-party ("earned") coverage dominates AI answers for commercial queries (F11). Observational evidence only.
5. **The biggest WCPOS risk is inconsistency, not missing tech.** The five surfaces give five different one-line descriptions, and two claims contradict the docs (offline selling, mobile availability) (F13). Fixing that is cheap and goes straight to "recommends it correctly".

---

## Findings

### A. How each engine gets content (crawler tokens)

| Engine | Index it answers from | Search / index bot | Live user fetch | Training bot | Source |
|---|---|---|---|---|---|
| Google AI Overviews / AI Mode | Google Search index; "query fan-out" issues several related searches per answer | Googlebot | — | `Google-Extended` (a robots token only, no crawler of its own; "does not impact a site's inclusion in Google Search nor is it used as a ranking signal") | [G1][G3] |
| ChatGPT search | "third-party search providers" + partner content (launch post, Oct 2024); Bing has been publicly named as one of those providers; OpenAI also keeps its own "indexed and cached web content" (used for offline workspace search) | `OAI-SearchBot`. Blocking it removes you from answers (navigational links only); robots changes take effect in about 24 h | `ChatGPT-User` ("robots.txt rules may not apply"; not used for Search eligibility) | `GPTBot` | [O1][O2][O3] |
| Claude | Brave Search is listed as a sub-processor for web search (Mar 2025), per third-party reporting; not read on Anthropic's page, so **Inferred** | `Claude-SearchBot` | `Claude-User` | `ClaudeBot`; all honour robots.txt and Crawl-delay | [A1][A2] |
| Perplexity | Its own index | `PerplexityBot` ("not used to crawl content for AI foundation models") | `Perplexity-User` ("generally ignores robots.txt") | none declared | [P1] |
| Bing / Copilot | Bing index; guidelines cover "Bing search, Copilot, and grounding API results" | `bingbot`; IndexNow recommended to reduce outdated URLs in Copilot | — | `NOCACHE` / `NOARCHIVE` meta controls Copilot use | [B1] (search-index excerpt; the page is JS-rendered and WebFetch could not render it) |
| Apple (Siri/Spotlight) | Applebot | `Applebot` | — | `Applebot-Extended` (no crawler of its own; "not considered in ranking for Search") | [AP1] |

- **F1 (Observed):** Each vendor separates *training*, *search indexing* and *user-initiated fetch*. The bot that matters for being **cited** is the search bot (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, bingbot). The training bots affect only what a model "knows" without searching. Inferred: allowing them helps the model answer even when search is off, which suits our goal.
- **F1b (Observed):** Cloudflare Content Signals (`Content-Signal: search=yes, ai-input=…, ai-train=…`) is a robots.txt *preference statement*. Cloudflare's own post says "some companies might simply ignore them" and names no vendor that has committed to honour them [CF1]. docs.wcpos.com is served by Vercel, not Cloudflare, so pay-per-crawl does not apply. **Not relevant** unless we start blocking.

### B. What the engines say they reward

- **F2 Google (Observed):** "There are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary". "You don't need to create new machine readable files, AI text files, or markup" [G1]. The May 2026 *AI optimization guide* has a "Mythbusting" list: llms.txt / Markdown (Search "ignores them"), chunking ("no ideal page length"), rewriting for AI, seeking inauthentic mentions, and over-focusing on structured data. It asks for "unique" first-hand content, not "commodity" content, and says creating pages for every fan-out variation can violate the scaled-content-abuse policy [G2]. The June 2026 changelog adds that llms.txt files "won't negatively or positively impact your visibility" [G4].
- **F3 Microsoft/Bing (Observed):** The Oct 2025 Bing PM post [B2] recommends descriptive H2/H3 headings, Q&A pairs, "one- to two-sentence responses that directly address a question", "sentences that make sense even when pulled out of context", comparison tables, and JSON-LD schema (product, review, FAQ, event). It warns that hidden tab content may be skipped ("AI systems may not render hidden content") and that vague claims ("innovative") mean little. The Bing guidelines say GEO "does not guarantee grounding or citations" [B1].
- **F4 OpenAI (Observed via search-index excerpts; help.openai.com returns 403 to fetchers):** "Any public website can appear in ChatGPT search". To appear, allow OAI-SearchBot and OpenAI's IP ranges. ChatGPT referrals carry `utm_source=chatgpt.com` [O1][O3]. OpenAI publishes no ranking criteria.
- **F5 Perplexity (Observed):** It searches "authoritative sources like articles, websites, and journals". Some domains get Government/Academic/Trusted labels, which partnerships do not affect. It publishes no ranking criteria [P2][P3].
- **F6 Measurement exists now (Observed):** Google Search Console has a *Generative AI performance report* (impressions in AI Overviews / AI Mode by page, country and device), live for all sites since 2026-08-31 [G5]. Bing Webmaster Tools *AI Performance* (Feb 2026; Citation Share / Intents added June 2026) shows Copilot citations **and the grounding queries** that retrieved your pages [B3][B4].

### C. llms.txt and Markdown twins: status

- **F7 (Observed):** llmstxt.org (Jeremy Howard, v2 updated 2026-08-10) is a *proposal*. It "mainly" targets inference-time use by agents, makes no claim that any LLM vendor consumes it, and v2 adds discovery via `<link rel="alternate" type="text/markdown">` and `rel="describedby"` → llms.txt [L1]. OpenAI, Anthropic and Google publish llms.txt files for their *own* developer docs, which shows publishing practice, not consumption. Cloudflare's docs publish llms.txt, per-product llms.txt, `/index.md` twins and `Accept: text/markdown` negotiation. Markdown cut one guide from 15,229 to 2,110 tokens [CF2][CF3].
- **F8 (Observed):** Chrome Lighthouse has an **experimental** "Agentic Browsing" category (Chrome 150+). Its llms.txt audit passes a well-formed file, marks a 404 as N/A and flags server errors [LH1][LH2]. The category frames llms.txt as agent readiness, not search ranking. Google Search's "ignore it" and Lighthouse's "audit it" are both Observed and do not conflict.
- **Unverified / folklore:** "ChatGPT/Claude/Perplexity read llms.txt when answering." No vendor statement found. John Mueller's "like the keywords meta tag" remark circulates only via secondary blogs (not cited). Google's own doc [G2] makes the same point for Search.

### D. Structured data (schema.org)

- **F12 (Observed):** For Google, structured data is "not required" for AI features and there is no special AI schema [G2]. It must match visible text [G1]. FAQ rich results stopped showing 2026-05-07 and the docs were removed 2026-06-15; HowTo went in Sept 2023 [G4][G6]. Software-app rich results need `name`, `offers.price` (0 if free) and `aggregateRating` **or** `review`. `applicationCategory` and `operatingSystem` are recommended [G7]. Google's review rules: "Don't aggregate reviews or ratings from other websites" and the rating must be visible on the page [G8]. Organization markup on the home or about page helps Google "disambiguate your organization"; `sameAs` lists your profiles [G9]. Bing still names FAQ / Product / Review schema as useful for AI answers [B2]. **Net (Inferred): low-to-moderate value. Useful for entity disambiguation and for Bing; it will not move Google AI Overviews by itself.**

### E. Research evidence

- **F9 GEO paper (Aggarwal et al., KDD 2024) [R1] (Observed, Table 1, GEO-bench, baseline PAWC 19.5):** Quotation Addition 27.8 (+43%), Statistics Addition 25.9 (+33%), Fluency 25.1 (+29%), Cite Sources 24.9 (+28%). Keyword Stuffing scored 17.8, below baseline. On Perplexity.ai the gains were "up to 37%". Lower-ranked sources gain most: Cite Sources gave +115% visibility for the rank-5 source and −30% for rank-1 (Table 2). Caveats: GPT-3.5 setup, and sources were *already in the context window*.
- **F10 Critical survey, 45 studies (arXiv 2607.14035) [R3] (Observed, abstract):** No tactic shows a "stable, longitudinal, cross-platform causal effect on organic discoverability". The only causal lever is how *already-retrieved* content gets cited. Topical relevance is the most reproducible factor. Rewriting purely for citations "can hurt retrieval". **Inferred:** GEO edits are a second step; being retrieved (indexing, relevance, authority) comes first.
- **F11 Earned media (Chen et al., arXiv 2509.08919) [R2] (Observed, abstract; observational):** AI search shows a "systematic and overwhelming bias towards Earned media" over brand-owned content. Engines differ in domain diversity and freshness. Niche brands must work against a big-brand preference. **Inferred:** for "best POS for WooCommerce" queries, third-party pages (reviews, listicles, the wordpress.org listing, Reddit/forums) weigh more than our own docs.

### F. "Answerability" patterns: source status

| Pattern | Primary support | Label |
|---|---|---|
| Direct answer in the first 1–2 sentences; self-contained sections | Bing [B2] | Observed (Bing). Google says no special phrasing is needed [G2] |
| Key info in main flow, not only in tabs / collapsed blocks | Bing [B2]; Cloudflare style guide [CF3] | Observed |
| Comparison tables, "what sets it apart", honest drawbacks | Bing [B2]; Google review guidance ("Explain what sets something apart from its competitors", "benefits and drawbacks") [G10] | Observed (guidance aimed at reviewers; applying it to vendor pages is Inferred) |
| Statistics, quotations, cited sources | GEO paper [R1] | Observed (lab) |
| Unique / first-hand content, no thin variant pages | Google [G2] | Observed |
| One question per page; FAQ blocks | No primary source for "one question per page"; Q&A pairs from Bing [B2] | Practitioner consensus / partly Observed |
| Canonical "What is X" page; consistent naming everywhere | Google Organization disambiguation [G9]; Cloudflare "fix naming inconsistencies" [CF3]; structured data must match visible text [G1] | Inferred from Observed |
| Plain pricing/limits; dated, versioned content | Freshness: Bing "fresh" [B2], IndexNow [B1]; engines differ on freshness [R2] | Partly Observed; "dates boost citation" is Unverified |
| Avoid marketing language | Bing on vague claims [B2]; GEO "Authoritative" tone only +12% PAWC [R1] | Observed (weak) |
| Third-party corroboration (reviews, directories, forums) | Earned-media bias [R2]; Google warns against *inauthentic* mentions [G2] | Observed (observational) |
| Wikipedia / Wikidata presence | Wikidata accepts items for entities "described using serious and publicly available references" [W1]. Wikipedia COI: financially connected editors are "strongly discouraged from editing affected articles directly" and must disclose [W2]. Effect on AI answers: no primary source | Eligibility Observed; impact Unverified |

### G. Current state of WCPOS surfaces (probed 2026-10-22)

- **Done (Observed):** docs robots.txt `Allow: /` for `*` plus 12 locale sitemaps. Probes with the main AI bot user-agents (OAI-SearchBot, GPTBot, ClaudeBot, Claude-SearchBot, PerplexityBot, bingbot, Googlebot) on docs.wcpos.com and wcpos.com return 200; this tests the UA string only, not IP-verified bot rules. Also live: `/llms.txt` (1,412 lines), `/llms-full.txt` (1.17 MB), `.md` twins (`text/markdown`), `<link rel="alternate" type="text/markdown">` on every doc page, the copy/open-in-LLM button, and quoted `description` frontmatter. wcpos.com robots.txt has explicit allow groups for OAI-SearchBot, ChatGPT-User, GPTBot, PerplexityBot, Claude-*, Google-Extended and Bingbot, and serves its own llms.txt.
- **Correction to the brief (Observed):** docs pages *do* emit JSON-LD: Docusaurus's default `BreadcrumbList`. wcpos.com emits `Organization` (sameAs: GitHub, wordpress.org) and `SoftwareApplication` (price 0, `operatingSystem: "Windows, macOS, Linux, iOS, Android"`, no rating). Without `aggregateRating` / `review` it is ineligible for Google's software-app rich result [G7].
- **F13 Inconsistent product definition (Observed):**
  - docs llms.txt: "free, open-source POS application … fully-featured retail POS system"
  - docs intro: "free open-source Point of Sale for WooCommerce. Available on web, desktop, and mobile" (body: mobile "Currently in beta testing")
  - wcpos.com meta: "Sync your products, **sell offline**, … native apps for iOS, Android, and desktop"
  - wordpress.org: "WCPOS – Point of Sale (POS) plugin for WooCommerce" / "turns any device into a point of sale" / "formerly known as WooCommerce POS"; 5,000+ installs, 3.7★ from 84 reviews
  - GitHub org: "🏪 A simple front-end for taking WooCommerce orders at the Point of Sale."; repo: "A WordPress plugin for taking WooCommerce orders…", homepage → wordpress.org

  **Contradictions (Observed):** the docs offline page says "Taking payment … can't be finished offline", which conflicts with "sell offline". The docs call mobile beta, which conflicts with the iOS/Android claims in the JSON-LD and meta. Inferred: an agent stitching these together can tell a merchant WCPOS completes sales fully offline.

  **Update (Paul, 2026-10-22):** version 2 is about to ship with offline cash payments, so wcpos.com's "sell offline" describes the imminent release, not a wrong claim. Two consequences (Observed): the `versioned_docs/version-2.x/getting-started/offline.mdx` page still says the payment step "can't be finished offline" and that completing a sale offline "is on the roadmap", so the 2.x docs are behind the product and will contradict wcpos.com the moment 2.x becomes `lastVersion`; and until launch the public 1.x docs are the ones agents read, so for a few weeks the live docs and the marketing site will disagree whichever way it is written. Fix: update the 2.x offline page (and anything else in 2.x that says "on the roadmap") before the launch flip, and phrase the canonical definition (#1) so that it is true for the version actually served at the root.
- **llms.txt quality (Observed):** section headings are slugs ("## category", "### developer-reference"), links are root-relative (`/index.md`), and the blockquote has no facts (editions, price, platforms, requirements, limits). There is no `rel="describedby"` link to llms.txt [L1]. llms-full.txt at 1.17 MB is roughly 300k tokens (Inferred at about 4 chars/token), which is beyond many context windows.
- **No Wikidata item** for WCPOS or "WooCommerce POS", and no Wikipedia article (Observed via the Wikidata/Wikipedia search APIs).
- Docs already have `getting-started/free-vs-pro`, `pro-license` (prices), `offline`, `reference/fiscal-compliance` and `support/performance/server` (Observed). There is no single page answering "is WCPOS right for my store / how does it compare". Not checked: any comparison content on wcpos.com.

---

## Recommendations for docs.wcpos.com

Ranked by expected impact ÷ effort. Each recommendation names the finding it rests on.

| # | Recommendation | Why (finding) | Impact / effort | Where |
|---|---|---|---|---|
| 1 | **Write one canonical 2–3 sentence definition of WCPOS** (what it is, who it's for, Free vs Pro, platforms with honest status, needs a connection to take payment) and use it verbatim on: docs intro + llms.txt `siteDescription`, wcpos.com meta + JSON-LD `description`, wordpress.org short description, GitHub org + repo descriptions. Fix the two contradictions ("sell offline" is true only from 2.x, so the 2.x offline page must say so before launch; iOS/Android vs beta). | F13, F12 (markup must match visible text), F3 (vague claims), F11 | **High / Low** | docs + wcpos.com + wp.org + GitHub (outside this repo) |
| 2 | **Add a canonical "Is WCPOS right for you?" page** (or rewrite `getting-started/index`): first sentence answers "what is it". Then: who it suits and who it doesn't; what it does *not* do (link fiscal-compliance, offline limits, unsupported cases); requirements; pricing stated plainly with a link to `pro-license`; a factual table of WooCommerce POS approaches (WCPOS, other WooCommerce POS plugins/apps), stating our drawbacks honestly. Verify every competitor fact against that vendor's own page before writing. One page, not per-competitor variants. | F3, F9, Google review guidance [G10], F2 (no scaled variant pages), F11 | **High / Medium** | docs (new or rewritten page, all locales via pipeline) |
| 3 | **Turn on measurement before tuning content:** verify docs.wcpos.com (and wcpos.com) in Bing Webmaster Tools (AI Performance → *grounding queries* shows what agents actually ask) and Google Search Console (Gen AI report). Segment `utm_source=chatgpt.com` in PostHog. | F6, F4 | **High / Low** | accounts (Paul) + PostHog |
| 4 | **Earn third-party corroboration:** keep the wordpress.org listing current and answer its reviews (it is the most-cited third-party page we control the copy of). Pursue genuine reviews and listings on independent sites. Create a Wikidata item only if independent references exist. Do not write a Wikipedia article ourselves (COI). | F11, [W1][W2], F2 (no inauthentic mentions) | **High / High (slow, mostly outside docs)** | marketing |
| 5 | **Upgrade llms.txt from an index to a briefing:** human section titles instead of slugs; a "Key facts" body (the definition from #1, editions, platforms, requirements, top limitations, pricing link); Free-vs-Pro and the #2 page listed first; absolute URLs; move error-codes / developer reference under `## Optional`; add `<link rel="describedby" href="/llms.txt">`. Consider per-section llms.txt instead of relying on a 1.17 MB llms-full. Payoff is limited to agents that fetch the site directly, not search answers. | F7, F8, G (llms.txt quality), CF2 | **Medium / Low** | `docusaurus.config.js` plugin options + `DocItem/Layout` |
| 6 | **Writing rules for every page** (add to the docs style guide): answer in the first sentence under each H2; put critical facts in the main flow, not only in tabs or `<details>`; state numbers (limits, versions, requirements) plainly; cite WooCommerce or gateway docs where we rely on them; avoid "powerful / fully-featured" adjectives (the llms.txt blurb uses one). | F3, F9, CF3 | **Medium / Low per page** | style guide + gradual edits |
| 7 | **IndexNow ping on deploy** for changed URLs, so Bing/Copilot (and Bing-fed answers) pick up corrections faster. | F1 / [B1] | **Medium / Low–Medium** | CI step after Vercel deploy |
| 8 | **JSON-LD, modest:** add `SoftwareApplication` (matching #1; `offers` for Free + Pro; accurate `operatingSystem`; `featureList`) to the canonical page only. Do **not** add `aggregateRating` copied from wordpress.org, which Google forbids. Do not add FAQPage expecting Google rich results (removed May 2026); Bing still values it, so it is optional where a page already has real Q&A. Organization markup stays on wcpos.com (done). | F12 | **Low–Medium / Low** | docs theme |
| 9 | **Keep doing (done):** allow all bots including training bots (F1). Keep shipping llms.txt, `.md` twins and rel=alternate (F7). Keep versioned and 0.4.x docs out of llms.txt (stale answers). Keep `description` frontmatter. | F1, F7 | done | — |

**Don't do (folklore or explicitly discouraged):** LLM-only pages or "chunking" content for AI (F2); keyword-stuffed variants (F9: below baseline); paid or fake mentions (F2); FAQ schema for Google rich results (F12); Cloudflare Content Signals / pay-per-crawl (F1b, not applicable); expecting llms.txt to move Google AI Overviews (F2, F7).

**Needs Paul's call:** wordpress.org says "formerly known as WooCommerce POS". Inferred: that alias helps models link old training data to WCPOS, but it sits against the legal naming rule. Should the canonical definition (#1) include it?

---

## Sources

- [G1] Google, *AI features and your website* (updated 2025-12-10): https://developers.google.com/search/docs/appearance/ai-features
- [G2] Google, *Optimizing your website for generative AI features on Google Search* (updated 2026-07-10): https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- [G3] Google, *Google's common crawlers* (Google-Extended): https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
- [G4] Google Search documentation updates (FAQ deprecation 2026-05-08, removal 2026-06-15; llms.txt note 2026-06-15; AI guide 2026-05-15): https://developers.google.com/search/updates
- [G5] Google, *Introducing Search Generative AI performance reports in Search Console* (2026-06-03): https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports
- [G6] Google, *Changes to HowTo and FAQ rich results* (2023-08): https://developers.google.com/search/blog/2023/08/howto-faq-changes
- [G7] Google, *Software app structured data* (updated 2026-09-08): https://developers.google.com/search/docs/appearance/structured-data/software-app
- [G8] Google, *Review snippet structured data*: https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- [G9] Google, *Organization structured data* (updated 2026-09-08): https://developers.google.com/search/docs/appearance/structured-data/organization
- [G10] Google, *Write high quality reviews* (updated 2025-12-10): https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews
- [O1] OpenAI, *Overview of OpenAI Crawlers*: https://developers.openai.com/api/docs/bots
- [O2] OpenAI, *Introducing ChatGPT search* (2024-10-31; 403 to fetchers, quote via search index): https://openai.com/index/introducing-chatgpt-search/
- [O3] OpenAI Help, *Publishers and Developers – FAQ* and *Offline web search for ChatGPT workspaces* (403 to fetchers; via search index): https://help.openai.com/en/articles/12627856 · https://help.openai.com/en/articles/20001203-offline-web-search-for-chatgpt-workspaces
- [A1] Anthropic, *Does Anthropic crawl data from the web…* (2026-04-07): https://support.claude.com/en/articles/8896518
- [A2] Brave as Claude search provider: Anthropic sub-processor list (not fetched; reported by https://simonwillison.net/2025/Mar/21/anthropic-use-brave/). **Inferred**
- [P1] Perplexity, *Perplexity Crawlers*: https://docs.perplexity.ai/guides/bots
- [P2] Perplexity Help, *How does Perplexity work?*: https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work
- [P3] Perplexity Help, *Understanding source labels*: https://www.perplexity.ai/help-center/en/articles/20260806-understanding-source-labels
- [B1] Bing Webmaster Guidelines (JS-rendered; content via search index): https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- [B2] Microsoft Advertising blog (K. Madhavan, Bing), *Optimizing Your Content for Inclusion in AI Search Answers* (2025-10-08): https://about.ads.microsoft.com/en/blog/post/october-2025/optimizing-your-content-for-inclusion-in-ai-search-answers
- [B3] Bing Webmaster blog, *Introducing AI Performance in Bing Webmaster Tools Public Preview* (2026-02): https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview
- [B4] Bing blog, *New AI Visibility Insights… Citation Share* (2026-06): https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare
- [AP1] Apple, *About Applebot*: https://support.apple.com/en-us/119829
- [L1] llmstxt.org (J. Howard, v2, modified 2026-08-10): https://llmstxt.org/
- [LH1] Chrome for Developers, *Lighthouse agentic browsing scoring* (2026-05-05): https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring
- [LH2] Chrome for Developers, *llms.txt audit*: https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt
- [CF1] Cloudflare, *Content Signals Policy* (2025-09-24): https://blog.cloudflare.com/content-signals-policy/
- [CF2] Cloudflare, *Introducing Markdown for Agents* (2026-02-12): https://blog.cloudflare.com/markdown-for-agents/
- [CF3] Cloudflare Style Guide, *AI consumability*: https://developers.cloudflare.com/style-guide/how-we-docs/ai-consumability/
- [R1] Aggarwal et al., *GEO: Generative Engine Optimization*, KDD 2024: https://arxiv.org/abs/2311.09735 (tables from https://arxiv.org/html/2311.09735v3)
- [R2] Chen et al., *Generative Engine Optimization: How to Dominate AI Search* (2025-09): https://arxiv.org/abs/2509.08919
- [R3] *A Critical Survey of Generative Engine Optimization* (2026-07): https://arxiv.org/abs/2607.14035
- [S1] schema.org SoftwareApplication: https://schema.org/SoftwareApplication
- [W1] Wikidata:Notability: https://www.wikidata.org/wiki/Wikidata:Notability
- [W2] Wikipedia:Conflict of interest: https://en.wikipedia.org/wiki/Wikipedia:Conflict_of_interest
