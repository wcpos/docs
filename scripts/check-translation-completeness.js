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
 *
 * This script compares each translated .mdx against its English source and
 * flags content that is byte-identical English where it should be localized.
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

// Reduce a line to its human-readable prose, stripping markup that is meant to
// be identical across locales (code, paths, tags, technical attributes).
function lineToProse(line) {
  const parts = [];
  const attrRe = new RegExp(`\\b(?:${TEXT_PROPS.join('|')})\\s*=\\s*"([^"]*)"`, 'g');
  let a;
  while ((a = attrRe.exec(line))) parts.push(a[1]);
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

// CommonMark image/link title tooltips: ![alt](url "title") and [text](url "title").
// Docusaurus renders these as user-facing hover tooltips, so an untranslated title
// is the same "ships English" leak as an untranslated JSX prop. textPropValues only
// matches title="…"/alt="…" attribute syntax, so capture the CommonMark form here.
function markdownTitleValues(text) {
  const out = [];
  for (const line of bodyLines(text)) {
    const re = /\]\(\s*\S+\s+(["'])((?:\\.|(?!\1).)*)\1\s*\)/g;
    let m;
    while ((m = re.exec(line))) out.push(m[2].trim());
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
    if (value && sourceValues.has(value) && /\s/.test(value) && countWords(value) >= 2) {
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
    if (isSignificantProse(p)) sourceProse.add(p);
  }
  const hits = [];
  for (const line of bodyLines(translatedContent)) {
    const p = lineToProse(line);
    if (isSignificantProse(p) && sourceProse.has(p)) hits.push(p);
  }
  return [...new Set(hits)];
}

// True when a translation is suspiciously short relative to a substantial source.
function isStub(sourceContent, translatedContent, locale) {
  if (sourceContent.length < STUB_MIN_SOURCE_CHARS) return false;
  const ratio = translatedContent.length / sourceContent.length;
  const min = CJK.has(locale) ? STUB_MIN_RATIO.cjk : STUB_MIN_RATIO.default;
  return ratio < min;
}

// Evaluate one translated file. Returns { file, untranslatedProps, leftoverProse, stub }.
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
  };
}

// Locales missing a (non-stub) translation for an English source that is
// already translated elsewhere — i.e. a dropped locale.
function findDroppedLocales(sourcePath, readFile = (p) => fs.readFileSync(p, 'utf8')) {
  if (!fs.existsSync(sourcePath)) return [];
  const source = readFile(sourcePath);
  const present = [];
  const missing = [];
  for (const locale of LOCALES) {
    const tp = sourceToTranslatedPath(sourcePath, locale);
    if (tp && fs.existsSync(tp)) {
      if (isStub(source, readFile(tp), locale)) missing.push(`${locale} (stub)`);
      else present.push(locale);
    } else {
      missing.push(locale);
    }
  }
  // Only a problem if the doc is translated in some locales but not others.
  if (present.length === 0 || missing.length === 0) return [];
  return missing;
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

// Source docs that are missing or stubbed in at least one locale — the input
// for the self-healing translation sweep. Uses the same missing/stub
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
      } else if (isStub(sourceContent, readFile(tp), locale)) {
        gaps.push(`${locale} (stub)`);
      }
    }
    if (gaps.length) incomplete.push({ source, gaps });
  }
  return incomplete;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(argv = process.argv.slice(2), env = process.env) {
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

  const problems = [];
  const checkedSources = new Set();
  const droppedBySource = [];
  let checked = 0;

  for (const file of files) {
    const r = evaluateFile(file);
    if (r.skipped) {
      if (r.sourcePath && !checkedSources.has(r.sourcePath)) {
        checkedSources.add(r.sourcePath);
        const dropped = findDroppedLocales(r.sourcePath);
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
    if (fileProblems.length) problems.push({ file: r.file, issues: fileProblems });

    // Check the implicated source for dropped locales (once per source).
    if (r.sourcePath && !checkedSources.has(r.sourcePath)) {
      checkedSources.add(r.sourcePath);
      const dropped = findDroppedLocales(r.sourcePath);
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
    '\nThese strings render as English to non-English readers. Translate the flagged' +
      '\ncontent (including JSX prop values like question=/title=/alt=) and re-run.\n'
  );
  return 1;
}

module.exports = {
  LOCALES,
  TEXT_PROPS,
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
  isStub,
  findDroppedLocales,
  allSourceDocs,
  listIncompleteSources,
  evaluateFile,
  main,
};

if (require.main === module) {
  process.exit(main());
}
