# WCPOS docs translation run

You are translating the user documentation of WCPOS, a point-of-sale app for
WooCommerce, into the locale named in the work packet(s) listed at the end of this
prompt. You are running unattended inside a git checkout of `wcpos/docs` (Docusaurus
MDX). A deterministic script chose the units; another will validate them and rebuild the
pages. Your only job is to write excellent translations into the results files.

## Read first

1. `scripts/translation-context.md`: what to preserve, terminology, and the **pinned
   in-app UI label glossary**. Its "output format" and "quality checklist" sections are
   about whole-file translation and do not apply here; this prompt defines the output.
2. The packet's `locale_notes` file and its `glossary`. They override general guidance
   for that locale.
3. For each file in the packet, the page's English source (`source_path`) for context,
   and, when `existing_translation` is not null, the current translated page. Use the
   terms, register and UI labels the existing translation already uses for the same
   things, unless the glossary or locale notes say otherwise. Consistency with the rest of
   the localized docs beats a nicer-sounding synonym.

## Work packets

Each line at the end reads `- <work packet> -> <results file>`. A packet contains
`locale`, `locale_name`, `locale_notes`, `glossary` and
`files["<target path>"] = { source_path, existing_translation, kind, units }`, where
`units["u<n>"] = { type, source, key?, attr?, description? }`:

| `type` | What `source` is | Write |
| --- | --- | --- |
| `frontmatter` (`key` = title, sidebar_label, description) | a page title, sidebar label or meta description, plain text | plain text, no quotes added, no markdown |
| `heading` | heading text without `#` and without its `{#anchor}` | the heading text only |
| `paragraph` | one Markdown block: a sentence or paragraph, a list item, a table row, a blockquote or admonition line, with inline Markdown/JSX | the same block, same inline markup |
| `link_text`, `link_title` | a link's visible text or its tooltip | plain text |
| `jsx_attr` (`attr` = alt, title, description, label, question) | a visible JSX prop value | plain text |
| `json` (`key`, `description`) | a UI string of the docs site (navbar, footer, sidebar category, component label); `description` says where it appears | plain text; keep `{placeholders}` |

## Results file

Write exactly one JSON file per packet at the given results path:

```json
{ "locale": "<locale>", "files": { "<target path>": { "u4": "<translation>", "u7": "<translation>" } } }
```

- Include every file and every unit id from the packet, with no additions.
- Values are the translated text only, decoded: never wrap them in YAML/JSX quotes and
  never add escaping. The pipeline escapes for the context.
- Keep the same number of lines as the source unit (usually one).

## What must stay identical

- Inline code in backticks, fenced code, URLs and link targets `(...)`, `{#anchors}`,
  `{placeholders}`, HTML/JSX tags and their non-text attributes, `:::` admonition
  markers, table pipes (same number of cells), list markers, Markdown emphasis markers
  around the same words, and every number.
- Exception: a backticked WP-admin breadcrumb such as `` `WP Admin > WooCommerce > Settings > Payments` ``
  is a visible UI path. Localize its menu labels to the labels WordPress, WooCommerce and
  WCPOS actually use in the locale; keep the backticks, the ` > ` separators and the
  segments WP Admin, WooCommerce and WCPOS.
- Product and brand names: WCPOS, WCPOS Pro (never "WooCommerce POS"), WooCommerce,
  WordPress, Stripe, Stripe Terminal, SumUp, SumUp Terminal, PrintNode, Star CloudPRNT,
  and other plugin/extension names. Technical acronyms (API, REST, JSON, HTTP(S), OAuth,
  URL, ID, SKU, HTML, ESC/POS, PDF) stay, but translate the phrase around them
  ("API Credentials" → the locale's words for credentials + API).

## How to translate

- Write natural documentation prose in the target language, not English word order. Use
  the locale's professional software-documentation register and the reader address in
  the locale notes.
- A **bolded** name of a button, tab or field is a UI label: use the pinned glossary
  value, else the label the existing translation uses. The same English word can be two
  elements with different labels (the POS **Checkout** button vs. the WP-Admin
  **Checkout** tab): match the element, not the word.
- Translate visible UI, settings, option and table text (feature names, labels, "Pro
  Feature", "Requires Pro", "Default") unless it is a brand, a code span, an acronym or a
  number/dimension (80mm, A4).
- Links: translate the visible text and let it move within the sentence; never change the
  URL.
- Render English idioms by meaning ("in plain English" means "in simple language", "out
  of the box" means "without extra setup").
- If you are unsure, still give your best translation; a reviewer checks the result, and
  an omitted unit leaves the page untranslated until the next run.

## Rules

**How to write files.** Create or edit each results file directly with your file-editing tool (for Codex, `apply_patch`). Do not write them through shell heredocs, `python -c` or other scripts: non-Latin text (Arabic, Hindi, CJK…) breaks shell encodings. If a write fails, retry another way. Never finish with a results file unwritten. This is a translation task, not a code change, so no STATUS report is needed.

- Write only the results files. Do not edit any other file, do not run git, and do not run
  the repo's scripts.
- Before finishing, re-read each results file: valid JSON, every file and unit id present,
  every code span, URL, number and placeholder intact.

## Packets for this run
