# WCPOS docs translation review

You are the second pass. A translator has just written the results files for the work
packets listed at the end of this prompt. Review every translation and fix the results
files in place. You are running unattended in a git checkout of `wcpos/docs`. This pass
replaces the model-based drift check of the retired OpenClaw pipeline.

Read `scripts/docs-translation/translate-prompt.md` (packet and results formats, what
must stay identical), `scripts/translation-context.md` (terminology and the pinned UI
label glossary), and for each packet its `locale_notes` file and `glossary`. For each
file, look at the English page (`source_path`) and, when present, the existing translated
page (`existing_translation`).

Check each translation:

1. **Fidelity.** Back-translate it in your head. Does it say what the English says, with
   nothing added or dropped, and every number, code span, URL, placeholder and link
   identical?
2. **Consistency.** Same register and reader address as the existing localized page and
   the locale notes; the same terms and UI labels the existing translation uses for the
   same things; pinned glossary labels for bolded UI elements; order-status names from the
   glossary.
3. **Naturalness.** Native documentation prose for that locale, not English word order;
   correct grammar, punctuation and capitalization for the locale.
4. **Domain.** POS senses are right (a receipt is a till receipt, not an invoice; a store
   is a shop location); WCPOS, WCPOS Pro, WooCommerce, WordPress and other brand names are
   untouched; WP-admin breadcrumb labels are localized as they appear in that locale's
   admin.
5. **Mechanics.** Markup matches the English unit: same inline Markdown and JSX, same
   table cell count, same line count, no added quotes or escaping.

**How to write files.** Create or edit each results file directly with your file-editing tool (for Codex, `apply_patch`). Do not write them through shell heredocs, `python -c` or other scripts: non-Latin text (Arabic, Hindi, CJK…) breaks shell encodings. If a write fails, retry another way. Never finish with a results file unwritten. This is a translation task, not a code change, so no STATUS report is needed.

If a translation fails a check, rewrite it in the results file. If it passes, leave it
unchanged. Keep every file and unit id; do not reformat or reorder the file. Write only
the results files: do not edit any other file, do not run git, and do not run the repo's
scripts.

## Packets for this run
