#!/usr/bin/env node

/**
 * Translation Completeness Gate
 *
 * A fast, API-free CI guard that fails when a translation ships untranslated
 * English. It exists because the translation pipeline had two silent failure
 * modes that shipped English to non-English readers undetected:
 *
 *   1. User-facing JSX prop values (question=, title=, alt=, label=, ...) were
 *      never translated — the translator was told to "keep props".
 *   2. Whole prose blocks (and entire files) were left in English when a
 *      translation step failed, because the block merger falls back to the
 *      English source with no completeness check.
 *   3. A translation can be fully localized and the right length, yet be a
 *      faithful render of an OLDER revision of the source — missing whole
 *      sections that were added to English later. The prose checks above all
 *      pass (it is not English, not a stub), so the drift is silent. We catch
 *      it by comparing heading anchors ({#slug}): an anchor the source has and
 *      the translation lacks means a section went missing — a "stale" file.
 *
 * This script compares each translated .mdx against its English source and
 * flags content that is byte-identical English where it should be localized, or
 * structurally behind the source.
 *
 * Usage:
 *   node scripts/check-translation-completeness.js --changed   # files changed vs BASE_REF (default origin/main)
 *   node scripts/check-translation-completeness.js --all       # every translation
 *   node scripts/check-translation-completeness.js i18n/de/.../file.mdx [...]
 *
 * Exits non-zero when violations are found (so it can gate a PR / translation run).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const LOCALES = ['es', 'fr', 'de', 'nl', 'ja', 'pt-BR', 'ko', 'it', 'ar', 'hi-IN', 'zh-CN'];
const CJK = new Set(['zh-CN', 'ja', 'ko']);
// JSX attributes whose values render as visible UI text and MUST be translated.
const TEXT_PROPS = ['alt', 'title', 'description', 'label', 'question', 'summary', 'placeholder'];
// A translation shorter than this fraction of its source (when the source is
// substantial) is almost certainly a stub / truncated.
const STUB_MIN_RATIO = { default: 0.35, cjk: 0.25 };
const STUB_MIN_SOURCE_CHARS = 600;
// Tolerate up to this many incidental identical prose lines (e.g. a language
// name that is spelled the same in both languages) before failing a file.
const PROSE_FAIL_THRESHOLD = 3;
// A translation missing at least this many heading anchors that its source has
// is stale (behind the source revision). One is enough: every heading carries an
// explicit {#slug} that is preserved verbatim across locales, so a missing slug
// is a missing section, not a translation artifact.
const STALE_FAIL_THRESHOLD = 1;
// Sweep queue shaping (--audit-json only; see buildTranslationAudit). Env-
// overridable so a one-off run can widen scope, e.g. AUDIT_EXCLUDE='(?!)' to
// translate everything including the deprecated version.
const AUDIT_EXCLUDE_DEFAULT = 'version-0\\.4\\.x'; // matches both the docs path and the version-0.4.x.json sidebar file
// Docs sidebar/category label source files, e.g.
// i18n/en/docusaurus-plugin-content-docs/version-1.x.json. These carry the
// collapsible category labels (Receipts, Hardware, …) and get key-level
// completeness checking against a freshly regenerated English baseline.
const SIDEBAR_JSON_RE = /docusaurus-plugin-content-docs\/version-[^/]+\.json$/;
const AUDIT_DEPRIORITIZE_DEFAULT = '/error-codes/';

// ---------------------------------------------------------------------------
// Path mapping
// ---------------------------------------------------------------------------

function getSourcePath(translatedPath) {
  let m = translatedPath.match(/i18n\/[^/]+\/docusaurus-plugin-content-docs\/(version-[^/]+\/.+)$/);
  if (m) return path.posix.join('versioned_docs', m[1]);
  m = translatedPath.match(/i18n\/[^/]+\/docusaurus-plugin-content-docs\/current\/(.+)$/);
  if (m) return path.posix.join('docs', m[1]);
  return null;
}

function sourceToTranslatedPath(sourcePath, locale) {
  let m = sourcePath.match(/^versioned_docs\/(.+)$/);
  if (m) return `i18n/${locale}/docusaurus-plugin-content-docs/${m[1]}`;
  m = sourcePath.match(/^docs\/(.+)$/);
  if (m) return `i18n/${locale}/docusaurus-plugin-content-docs/current/${m[1]}`;
  return null;
}

function localeOf(translatedPath) {
  const m = translatedPath.match(/i18n\/([^/]+)\//);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

const countLetters = (s) => (s.match(/[A-Za-z]/g) || []).length;
const countWords = (s) => (s.match(/[A-Za-z]{3,}/g) || []).length;

// Significant English prose: multi-word *with whitespace*, so single
// hyphenated identifiers (e.g. `wp-emoji-styles`) are not treated as prose.
function isSignificantProse(text) {
  return /\s/.test(text) && countLetters(text) >= 8 && countWords(text) >= 2;
}

// Prop/title values that are correctly identical across every locale — product,
// platform and distribution-channel names, and literal runtime error strings the
// app shows verbatim — so an exact match is NOT a translation leak. Without this,
// the gate flags them and the self-healing sweep re-forwards the file every run
// (Aide can't "translate" a proper noun), looping forever and drifting the rest of
// the file. Keep tight and exact-match so genuine leaks still surface.
const UNTRANSLATED_PROP_ALLOWLIST = new Set([
  'iOS (TestFlight)',
  'Mac (Intel)',
  'Mac (Apple Silicon)',
  'Android (Beta)',
  'Stripe Terminal',
  'SumUp Terminal',
  'Vipps MobilePay',
  'Smart Coupons',
  'StoreApps Smart Coupons',
  'ATUM Multi-Inventory',
  'WCPOS ATUM Integration',
  'WCPOS Polylang',
  'WCPOS WPML',
  'WCPOS WP Multilang',
  'WCPOS StoreApps Smart Coupons',
  "Cannot read properties of undefined (reading 'data')",
]);

// Reduce a line to its human-readable prose, stripping markup that is meant to
// be identical across locales (code, paths, tags, technical attributes).
function lineToProse(line) {
  const parts = [];
  const attrRe = new RegExp(`\\b(?:${TEXT_PROPS.join('|')})\\s*=\\s*"([^"]*)"`, 'g');
  let a;
  while ((a = attrRe.exec(line))) {
    if (!UNTRANSLATED_PROP_ALLOWLIST.has(a[1])) parts.push(a[1]);
  }
  let s = line
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ') // {/* jsx comment */}
    .replace(/<!--[\s\S]*?-->/g, ' ') // <!-- html comment -->
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/\b[\w-]+\s*=\s*("[^"]*"|\{\{[^}]*\}\}|\{[^}]*\})/g, ' ') // attribute fragments
    .replace(/\]\(([^)]*)\)/g, '] ') // markdown link target
    .replace(/<[^>]+>/g, ' ') // jsx/html tags
    .replace(/\{#[^}]*\}/g, ' ') // {#anchor}
    .replace(/^[\s>#*\-|0-9.]+/, ' ') // leading markdown markers
    .replace(/[[\]|*_~>#]/g, ' '); // residual punctuation
  parts.push(s);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

// Body lines excluding frontmatter, code fences and imports.
function bodyLines(text) {
  const lines = text.split('\n');
  const out = [];
  let inFrontmatter = false;
  let frontmatterDone = false;
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!frontmatterDone && i === 0 && line.trim() === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (line.trim() === '---') {
        inFrontmatter = false;
        frontmatterDone = true;
      }
      continue;
    }
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^\s*import\s/.test(line)) continue;
    out.push(line);
  }
  return out;
}

// All user-facing JSX text-prop values in a document.
function textPropValues(text) {
  const out = [];
  for (const line of bodyLines(text)) {
    for (const prop of TEXT_PROPS) {
      const re = new RegExp(`\\b${prop}\\s*=\\s*"([^"]*)"`, 'g');
      let m;
      while ((m = re.exec(line))) out.push({ prop, value: m[1].trim() });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Checks (pure, unit-testable)
// ---------------------------------------------------------------------------

// CommonMark image/link title tooltips: ![alt](url "title") and [text](url (title)).
// Docusaurus renders these as user-facing hover tooltips, so an untranslated title
// is the same "ships English" leak as an untranslated JSX prop. textPropValues only
// matches title="…"/alt="…" attribute syntax, so capture the CommonMark form here.
function markdownTitleValues(text) {
  const out = [];
  for (const line of bodyLines(text)) {
    const re = /\]\(\s*\S+\s+(?:(["'])((?:\\.|(?!\1).)*)\1|\(((?:\\.|[^\\)])*)\))\s*\)/g;
    let m;
    while ((m = re.exec(line))) out.push((m[2] ?? m[3]).trim());
  }
  return out;
}

// JSX text-prop values and CommonMark image/link titles left identical to the
// English source (multi-word).
function findUntranslatedProps(sourceContent, translatedContent) {
  const sourceValues = new Set([
    ...textPropValues(sourceContent).map((p) => p.value),
    ...markdownTitleValues(sourceContent),
  ]);
  const hits = [];
  const flag = (label, value) => {
    if (
      value &&
      !UNTRANSLATED_PROP_ALLOWLIST.has(value) &&
      sourceValues.has(value) &&
      /\s/.test(value) &&
      countWords(value) >= 2
    ) {
      hits.push(label);
    }
  };
  for (const { prop, value } of textPropValues(translatedContent)) {
    flag(`${prop}="${value}"`, value);
  }
  for (const value of markdownTitleValues(translatedContent)) {
    flag(`title="${value}"`, value);
  }
  return [...new Set(hits)];
}

// Prose lines left byte-identical to the English source.
function findLeftoverProse(sourceContent, translatedContent) {
  const sourceProse = new Set();
  for (const line of bodyLines(sourceContent)) {
    const p = lineToProse(line);
    if (isSignificantProse(p) && !UNTRANSLATED_PROP_ALLOWLIST.has(p)) sourceProse.add(p);
  }
  const hits = [];
  for (const line of bodyLines(translatedContent)) {
    const p = lineToProse(line);
    if (isSignificantProse(p) && !UNTRANSLATED_PROP_ALLOWLIST.has(p) && sourceProse.has(p)) hits.push(p);
  }
  return [...new Set(hits)];
}

// Explicit heading anchors ({#slug}) in a document's body. Every section heading
// in the corpus carries one (`## Foo {#foo}`) and the slug is kept verbatim when
// translated, so the anchor set is a structural fingerprint of a page's sections
// that is comparable across locales. bodyLines() already drops frontmatter, code
// fences and imports; inline code is stripped here so examples like `{{#lines}}`
// are not counted as section anchors.
function headingAnchors(text) {
  const out = new Set();
  for (const line of bodyLines(text)) {
    const withoutInlineCode = line.replace(/`[^`]*`/g, '');
    const m = /^\s{0,3}#{1,6}\s+.*\{#([A-Za-z0-9_-]+)\}\s*(?:#+\s*)?$/.exec(withoutInlineCode);
    if (m) out.add(m[1]);
  }
  return out;
}

// Sections that exist in the current source but are missing from a translation of
// an older revision. Returns the source anchors absent from the translation — but
// ONLY when the translation has a net heading deficit (fewer headings than the
// source). The net check is what makes this robust: a heading's explicit slug can
// legitimately differ between locales when it is auto-derived from heading text
// rather than preserved verbatim (EN `## F.A.Q. {#faq}` vs a translation that
// slugs to {#f-a-q}; apostrophes and slashes do the same). A pure rename keeps the
// count equal (deficit 0) and must NOT be flagged, or the sweep would loop forever
// re-translating a page that is actually current. Only a genuinely dropped section
// lowers the count. A translation may also legitimately ADD anchors (e.g. an
// explicit slug on its title); those make the deficit negative and are ignored.
function findMissingSections(sourceContent, translatedContent) {
  const src = headingAnchors(sourceContent);
  if (src.size === 0) return [];
  const tr = headingAnchors(translatedContent);
  if (src.size - tr.size < STALE_FAIL_THRESHOLD) return [];
  return [...src].filter((slug) => !tr.has(slug));
}

// True when a translation is suspiciously short relative to a substantial source.
function isStub(sourceContent, translatedContent, locale) {
  if (sourceContent.length < STUB_MIN_SOURCE_CHARS) return false;
  const ratio = translatedContent.length / sourceContent.length;
  const min = CJK.has(locale) ? STUB_MIN_RATIO.cjk : STUB_MIN_RATIO.default;
  return ratio < min;
}

// Evaluate one translated file. Returns
// { file, untranslatedProps, leftoverProse, stub, missingSections }, where
// missingSections is the array of source heading anchors absent from the
// translation (non-empty only when the translation has a net heading deficit).
function evaluateFile(translatedPath, readFile = (p) => fs.readFileSync(p, 'utf8')) {
  const sourcePath = getSourcePath(translatedPath);
  const locale = localeOf(translatedPath);
  if (!sourcePath || !fs.existsSync(sourcePath) || !fs.existsSync(translatedPath)) {
    return { file: translatedPath, locale, sourcePath, skipped: true };
  }
  const source = readFile(sourcePath);
  const translated = readFile(translatedPath);
  return {
    file: translatedPath,
    locale,
    sourcePath,
    untranslatedProps: findUntranslatedProps(source, translated),
    leftoverProse: findLeftoverProse(source, translated),
    stub: isStub(source, translated, locale),
    missingSections: findMissingSections(source, translated),
  };
}

// Locales missing a (non-stub) translation for an English source that is
// already translated elsewhere — i.e. a dropped locale.
function findDroppedLocales(
  sourcePath,
  readFile = (p) => fs.readFileSync(p, 'utf8'),
  allowedMissingLocales = new Set()
) {
  if (!fs.existsSync(sourcePath)) return [];
  const source = readFile(sourcePath);
  const present = [];
  const missing = [];
  for (const locale of LOCALES) {
    const tp = sourceToTranslatedPath(sourcePath, locale);
    if (tp && fs.existsSync(tp)) {
      if (isStub(source, readFile(tp), locale)) missing.push(`${locale} (stub)`);
      else present.push(locale);
    } else if (!allowedMissingLocales.has(locale)) {
      missing.push(locale);
    }
  }
  // Only a problem if the doc is translated in some locales but not others.
  if (present.length === 0 || missing.length === 0) return [];
  return missing;
}

function deletedChangedLocales(files) {
  const bySource = new Map();
  for (const file of files) {
    const sourcePath = getSourcePath(file);
    const locale = localeOf(file);
    if (!sourcePath || !locale || !fs.existsSync(sourcePath) || fs.existsSync(file)) continue;
    if (!bySource.has(sourcePath)) bySource.set(sourcePath, new Set());
    bySource.get(sourcePath).add(locale);
  }
  return bySource;
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function gitChangedTranslationFiles(baseRef) {
  const out = execFileSync('git', ['diff', '--name-only', `${baseRef}...HEAD`, '--', 'i18n/**/*.mdx'], {
    encoding: 'utf8',
  });
  return out.split('\n').map((l) => l.trim()).filter(Boolean);
}

function allTranslationFiles() {
  const out = execFileSync(
    'git',
    ['ls-files', 'i18n/*/docusaurus-plugin-content-docs/**/*.mdx'],
    { encoding: 'utf8' }
  );
  return out.split('\n').map((l) => l.trim()).filter(Boolean);
}

// All English source docs that are in scope for translation. Scoped to
// `versioned_docs/**` to match the forward-on-push workflow's path filter
// (forward-docs-translations-to-aide.yml) — `docs/` holds unversioned/internal
// material (e.g. superpowers specs) that is not part of the published, translated corpus.
function allSourceDocs(
  listFiles = (dirs) =>
    execFileSync('git', ['ls-files', ...dirs], { encoding: 'utf8' })
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
) {
  return listFiles(['versioned_docs']).filter((f) => /\.mdx?$/.test(f));
}

// Source docs that are missing, stubbed, or stale in at least one locale — the
// input for the self-healing translation sweep. Uses the same missing/stub/stale
// definition as the completeness gate, so the sweep and the PR gate never
// disagree about what "incomplete" means.
function listIncompleteSources({
  readFile = (p) => fs.readFileSync(p, 'utf8'),
  existsSync = fs.existsSync,
  sources,
} = {}) {
  const srcList = sources || allSourceDocs();
  const incomplete = [];
  for (const source of srcList) {
    if (!existsSync(source)) continue;
    const sourceContent = readFile(source);
    const gaps = [];
    for (const locale of LOCALES) {
      const tp = sourceToTranslatedPath(source, locale);
      if (!tp) continue;
      if (!existsSync(tp)) {
        gaps.push(locale);
      } else {
        const translated = readFile(tp);
        if (isStub(sourceContent, translated, locale)) gaps.push(`${locale} (stub)`);
        else if (findMissingSections(sourceContent, translated).length >= STALE_FAIL_THRESHOLD)
          gaps.push(`${locale} (stale)`);
      }
    }
    if (gaps.length) incomplete.push({ source, gaps });
  }
  return incomplete;
}


function allEnglishJsonSourceFiles(
  listFiles = (dirs) =>
    execFileSync('git', ['ls-files', ...dirs], { encoding: 'utf8' })
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
) {
  return listFiles(['i18n/en']).filter((f) => f.endsWith('.json'));
}

function jsonSourceToTranslatedPath(sourcePath, locale) {
  if (!sourcePath.startsWith('i18n/en/')) return null;
  return sourcePath.replace(/^i18n\/en\//, `i18n/${locale}/`);
}

function parseJsonOrNull(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Docusaurus chrome translations (sidebar/category labels, navbar, footer) live in
// i18n/<locale>/.../*.json as { key: { message, description } }. A translation file
// can EXIST yet be behind its English source — e.g. after the sidebar is restructured
// the category keys change, but the per-locale files keep the old key set, so the new
// buckets fall back to English in the UI. Existence alone (missing_json) does not catch
// this. Returns the English keys whose message is absent or empty in the translation —
// the sidebar analogue of findMissingSections for .mdx. We only flag source→translation
// drops, never extra keys the translation carries, so a translation is never re-forwarded
// for keys English no longer has.
function findMissingJsonKeys(sourceContent, translatedContent) {
  const src = parseJsonOrNull(sourceContent);
  const tr = parseJsonOrNull(translatedContent);
  if (!src || typeof src !== 'object') return [];
  if (!tr || typeof tr !== 'object') return Object.keys(src);
  const messageOf = (entry) => (entry && typeof entry === 'object' ? entry.message : entry);
  return Object.keys(src).filter((key) => {
    if (messageOf(src[key]) == null || messageOf(src[key]) === '') return false; // nothing to translate
    const m = messageOf(tr[key]);
    return m == null || m === '';
  });
}

// buildTranslationAudit feeds the self-healing sweep, which forwards the first
// `batch_size` entries to Aide. Two knobs shape that queue (the audit is the
// sweep's ONLY consumer, so these do not affect the PR gate):
//   - excludeSource(source): drop a source entirely. Default skips the deprecated
//     version-0.4.x docs — not worth re-translating a superseded version.
//   - priority(source): lower sorts first within the otherwise-alphabetical queue.
//     Default pushes the ~60 boilerplate error-code reference pages behind the
//     hand-written content guides so the high-value pages translate first.
function buildTranslationAudit({
  readFile = (p) => fs.readFileSync(p, 'utf8'),
  existsSync = fs.existsSync,
  sources,
  jsonSources,
  locales = LOCALES,
  excludeSource = () => false,
  priority = () => 0,
} = {}) {
  const bySource = new Map();
  const add = (source, locale, reason) => {
    if (!bySource.has(source)) bySource.set(source, { source, locales: {} });
    const entry = bySource.get(source);
    if (!entry.locales[locale]) entry.locales[locale] = [];
    if (!entry.locales[locale].includes(reason)) entry.locales[locale].push(reason);
  };

  const srcList = sources || allSourceDocs();
  for (const source of srcList) {
    if (!existsSync(source) || excludeSource(source)) continue;
    const sourceContent = readFile(source);
    for (const locale of locales) {
      const tp = sourceToTranslatedPath(source, locale);
      if (!tp) continue;
      if (!existsSync(tp)) {
        add(source, locale, 'missing');
        continue;
      }
      const translated = readFile(tp);
      if (isStub(sourceContent, translated, locale)) add(source, locale, 'stub');
      if (findUntranslatedProps(sourceContent, translated).length > 0) add(source, locale, 'untranslated_props');
      if (findLeftoverProse(sourceContent, translated).length >= PROSE_FAIL_THRESHOLD) add(source, locale, 'english_prose');
      if (findMissingSections(sourceContent, translated).length >= STALE_FAIL_THRESHOLD) add(source, locale, 'stale');
    }
  }

  const jsonList = jsonSources || allEnglishJsonSourceFiles();
  for (const source of jsonList) {
    if (!existsSync(source) || excludeSource(source)) continue;
    // Key-level completeness needs a trustworthy (freshly regenerated) English
    // baseline. This change refreshes only the docs sidebar/category source
    // (docusaurus-plugin-content-docs/version-*.json), so the incomplete_json
    // check is scoped to it; the other chrome files (code.json, navbar/footer)
    // keep the existence-only missing_json check until their EN baseline is
    // likewise refreshed.
    const checkKeyCompleteness = SIDEBAR_JSON_RE.test(source);
    const sourceContent = checkKeyCompleteness ? readFile(source) : null;
    for (const locale of locales) {
      const tp = jsonSourceToTranslatedPath(source, locale);
      if (!tp) continue;
      if (!existsSync(tp)) {
        add(source, locale, 'missing_json');
      } else if (checkKeyCompleteness && findMissingJsonKeys(sourceContent, readFile(tp)).length > 0) {
        add(source, locale, 'incomplete_json');
      }
    }
  }

  return [...bySource.values()].sort(
    (a, b) => priority(a.source) - priority(b.source) || a.source.localeCompare(b.source)
  );
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(argv = process.argv.slice(2), env = process.env) {
  if (argv.includes('--audit-json')) {
    const excludeRe = new RegExp(env.AUDIT_EXCLUDE || AUDIT_EXCLUDE_DEFAULT);
    const deprioritizeRe = new RegExp(env.AUDIT_DEPRIORITIZE || AUDIT_DEPRIORITIZE_DEFAULT);
    process.stdout.write(
      JSON.stringify(
        buildTranslationAudit({
          excludeSource: (s) => excludeRe.test(s),
          priority: (s) => (deprioritizeRe.test(s) ? 1 : 0),
        })
      )
    );
    return 0;
  }

  // Self-healing sweep input: print the source docs that have a gap in any
  // locale as a JSON array on stdout (consumed by sweep-docs-translations.yml).
  // Always exits 0 — this mode reports, it does not gate.
  if (argv.includes('--list-incomplete-sources')) {
    const incomplete = listIncompleteSources();
    process.stdout.write(JSON.stringify(incomplete.map((entry) => entry.source)));
    return 0;
  }

  let files = [];
  const explicit = [];
  for (const arg of argv) {
    if (arg === '--changed') files = gitChangedTranslationFiles(env.BASE_REF || 'origin/main');
    else if (arg === '--all') files = allTranslationFiles();
    else if (!arg.startsWith('-')) explicit.push(arg);
  }
  if (explicit.length) files = explicit;

  if (files.length === 0) {
    console.log('No translation files to check.');
    return 0;
  }

  const allowedDroppedLocalesBySource = deletedChangedLocales(files);
  const problems = [];
  const checkedSources = new Set();
  const droppedBySource = [];
  let checked = 0;

  for (const file of files) {
    const r = evaluateFile(file);
    if (r.skipped) {
      if (r.sourcePath && !checkedSources.has(r.sourcePath)) {
        checkedSources.add(r.sourcePath);
        const dropped = findDroppedLocales(r.sourcePath, undefined, allowedDroppedLocalesBySource.get(r.sourcePath));
        if (dropped.length) droppedBySource.push({ source: r.sourcePath, dropped });
      }
      continue;
    }
    checked++;
    const fileProblems = [];
    if (r.untranslatedProps.length) {
      fileProblems.push(
        `untranslated UI prop value(s): ${r.untranslatedProps.slice(0, 5).join(' | ')}` +
          (r.untranslatedProps.length > 5 ? ` (+${r.untranslatedProps.length - 5} more)` : '')
      );
    }
    if (r.stub) fileProblems.push('appears to be a stub / truncated (far shorter than source)');
    if (r.leftoverProse.length >= PROSE_FAIL_THRESHOLD) {
      fileProblems.push(
        `${r.leftoverProse.length} English prose line(s) left untranslated, e.g. "${r.leftoverProse[0].slice(0, 70)}"`
      );
    }
    if (r.missingSections.length >= STALE_FAIL_THRESHOLD) {
      fileProblems.push(
        `stale: ${r.missingSections.length} section(s) in the English source are missing here ` +
          `(translation of an older revision), e.g. {#${r.missingSections[0]}}`
      );
    }
    if (fileProblems.length) problems.push({ file: r.file, issues: fileProblems });

    // Check the implicated source for dropped locales (once per source).
    if (r.sourcePath && !checkedSources.has(r.sourcePath)) {
      checkedSources.add(r.sourcePath);
      const dropped = findDroppedLocales(r.sourcePath, undefined, allowedDroppedLocalesBySource.get(r.sourcePath));
      if (dropped.length) droppedBySource.push({ source: r.sourcePath, dropped });
    }
  }

  if (problems.length === 0 && droppedBySource.length === 0) {
    console.log(`✅ Translation completeness OK (${checked} file(s) checked).`);
    return 0;
  }

  console.error('\n❌ Translation completeness check failed.\n');
  for (const p of problems) {
    console.error(`• ${p.file}`);
    for (const issue of p.issues) console.error(`    - ${issue}`);
  }
  for (const d of droppedBySource) {
    console.error(`• ${d.source}`);
    console.error(`    - translated in some locales but missing/stub in: ${d.dropped.join(', ')}`);
  }
  console.error(
    '\nThese render as English to non-English readers, or are behind the English' +
      '\nsource. Translate the flagged content (including JSX prop values like' +
      '\nquestion=/title=/alt=), bring stale files up to the current revision, and re-run.\n'
  );
  return 1;
}

module.exports = {
  LOCALES,
  TEXT_PROPS,
  UNTRANSLATED_PROP_ALLOWLIST,
  getSourcePath,
  sourceToTranslatedPath,
  localeOf,
  lineToProse,
  bodyLines,
  textPropValues,
  markdownTitleValues,
  isSignificantProse,
  findUntranslatedProps,
  findLeftoverProse,
  headingAnchors,
  findMissingSections,
  isStub,
  findDroppedLocales,
  deletedChangedLocales,
  allSourceDocs,
  allEnglishJsonSourceFiles,
  jsonSourceToTranslatedPath,
  findMissingJsonKeys,
  buildTranslationAudit,
  listIncompleteSources,
  evaluateFile,
  main,
};

if (require.main === module) {
  process.exit(main());
}
