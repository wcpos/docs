#!/usr/bin/env node

/**
 * Translation Safety Gate
 *
 * Blocks two failure modes that previously shipped broken localized docs:
 * 1. visible machine/reviewer marker prefixes such as `DE:` / `HI:` in MDX;
 * 2. reviewer/fixer bots committing translation content under i18n/**.
 */

const fs = require('fs');
const { execFileSync } = require('child_process');

const I18N_RE = /^i18n\//;
const TRANSLATION_FILE_RE = /^i18n\/.*\.(mdx|json)$/;
const DEFAULT_DISALLOWED_AUTHORS = new Set([
  'wcpos-agents[bot]',
  'chatgpt-codex-connector[bot]',
  'coderabbitai[bot]',
  'coderabbit[bot]',
]);
const LOCALE_PREFIX_RE = /^\s*(?:[-*]\s+)?(?:[A-Z]{2}(?:-[A-Z]{2})?):\s+\S|^\s*\|\s*(?:[A-Z]{2}(?:-[A-Z]{2})?):/;
const PLACEHOLDER_FRONTMATTER_RE = /^\s*(?:title|sidebar_label|description):\s*(?:Ubersetzt|Traducido|Traduit|Tradotto|Vertaald|Translated|अनुवादित|مترجم|翻译)\s*-/;

function runGit(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', options.allowFailure ? 'ignore' : 'pipe'],
  }).trim();
}

function findTranslationMarkerIssues(filePath, content) {
  if (!filePath.endsWith('.mdx')) return [];

  const issues = [];
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const trimmed = line.trimEnd();
    if (!trimmed) return;

    if (LOCALE_PREFIX_RE.test(trimmed)) {
      issues.push({
        path: filePath,
        line: index + 1,
        reason: 'visible_locale_prefix',
        text: trimmed,
      });
      return;
    }

    if (PLACEHOLDER_FRONTMATTER_RE.test(trimmed)) {
      issues.push({
        path: filePath,
        line: index + 1,
        reason: 'placeholder_frontmatter_prefix',
        text: trimmed,
      });
    }
  });

  return issues;
}

function parseAllowedAuthorsFromEnv() {
  const raw = process.env.TRANSLATION_ALLOWED_BOT_AUTHORS || '';
  return new Set(
    raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function findDisallowedTranslationAuthors(commits, options = {}) {
  const disallowedAuthors = options.disallowedAuthors || DEFAULT_DISALLOWED_AUTHORS;
  const allowedAuthors = options.allowedAuthors || parseAllowedAuthorsFromEnv();

  return commits
    .filter((commit) => disallowedAuthors.has(commit.author) && !allowedAuthors.has(commit.author))
    .map((commit) => ({
      hash: commit.hash,
      author: commit.author,
      subject: commit.subject,
      files: commit.files.filter((file) => TRANSLATION_FILE_RE.test(file)),
    }))
    .filter((commit) => commit.files.length > 0);
}

function changedTranslationFiles(baseRef) {
  const output = runGit(['diff', '--name-only', `${baseRef}...HEAD`, '--', 'i18n'], {
    allowFailure: true,
  });
  if (!output) return [];
  return output.split('\n').filter((file) => TRANSLATION_FILE_RE.test(file));
}

function allTranslationFiles() {
  const output = runGit(['ls-files', 'i18n'], { allowFailure: true });
  if (!output) return [];
  return output.split('\n').filter((file) => TRANSLATION_FILE_RE.test(file));
}

function commitsTouchingTranslations(baseRef) {
  const output = runGit(
    ['log', '--format=commit:%H%x1f%an%x1f%s', '--name-only', `${baseRef}..HEAD`, '--', 'i18n'],
    { allowFailure: true }
  );
  if (!output) return [];

  const commits = [];
  let current = null;
  for (const line of output.split('\n')) {
    if (line.startsWith('commit:')) {
      if (current) commits.push(current);
      const [hash, author, subject] = line.slice('commit:'.length).split('\x1f');
      current = { hash, author, subject, files: [] };
      continue;
    }
    if (current && I18N_RE.test(line)) current.files.push(line);
  }
  if (current) commits.push(current);
  return commits;
}

function scanFiles(files) {
  const issues = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    issues.push(...findTranslationMarkerIssues(file, fs.readFileSync(file, 'utf8')));
  }
  return issues;
}

function formatFailure(markerIssues, authorIssues) {
  const lines = ['❌ Translation safety check failed.', ''];

  if (markerIssues.length > 0) {
    lines.push('Visible placeholder/locale markers found in translated docs:');
    for (const issue of markerIssues) {
      lines.push(`- ${issue.path}:${issue.line} [${issue.reason}] ${issue.text}`);
    }
    lines.push('');
  }

  if (authorIssues.length > 0) {
    lines.push('Disallowed reviewer/fixer bot commits touched translation files:');
    for (const issue of authorIssues) {
      lines.push(`- ${issue.hash.slice(0, 8)} ${issue.author}: ${issue.subject}`);
      for (const file of issue.files) lines.push(`  - ${file}`);
    }
    lines.push('');
  }

  lines.push('Translations must come from the translation pipeline or a human-reviewed cleanup, not reviewer/fixer bots.');
  return lines.join('\n');
}

function main(argv = process.argv.slice(2)) {
  const baseRef = process.env.BASE_REF || 'origin/main';
  const files = argv.includes('--all') ? allTranslationFiles() : changedTranslationFiles(baseRef);
  const markerIssues = scanFiles(files);
  const authorIssues = argv.includes('--all')
    ? []
    : findDisallowedTranslationAuthors(commitsTouchingTranslations(baseRef));

  if (markerIssues.length > 0 || authorIssues.length > 0) {
    console.error(formatFailure(markerIssues, authorIssues));
    process.exitCode = 1;
    return { markerIssues, authorIssues };
  }

  console.log(`✅ Translation safety OK (${files.length} file(s) checked).`);
  return { markerIssues, authorIssues };
}

if (require.main === module) main();

module.exports = {
  findTranslationMarkerIssues,
  findDisallowedTranslationAuthors,
  changedTranslationFiles,
  allTranslationFiles,
  commitsTouchingTranslations,
  main,
};
