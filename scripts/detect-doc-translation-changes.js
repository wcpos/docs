#!/usr/bin/env node
const { execFileSync } = require('node:child_process');

const SOURCE_PATTERNS = [
  /^versioned_docs\/.+\.(md|mdx)$/,
  /^i18n\/en\/.+\.json$/,
  /^versioned_sidebars\/.+\.json$/,
  /^sidebars\.js$/,
  /^docusaurus\.config\.js$/,
];

function uniqueStable(paths) {
  return [...new Set(paths.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function filterTranslationSourceFiles(paths) {
  return uniqueStable(paths).filter((file) =>
    SOURCE_PATTERNS.some((pattern) => pattern.test(file))
  );
}

function splitInput(value) {
  return String(value || '')
    .split(/[\n\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function gitLines(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (_error) {
    return [];
  }
}

function resolveChangedFiles({ explicitFiles, diffFiles, allFiles }) {
  const explicit = filterTranslationSourceFiles(explicitFiles);
  if (explicit.length > 0) return explicit;

  const changed = filterTranslationSourceFiles(diffFiles);
  if (changed.length > 0) return changed;

  return filterTranslationSourceFiles(allFiles);
}

function main(env = process.env) {
  const baseRef = env.BASE_REF || 'origin/main~1';
  const headRef = env.HEAD_REF || 'HEAD';
  const explicitFiles = splitInput(env.FILES || '');
  const diffFiles = gitLines([
    'diff',
    '--name-only',
    `${baseRef}...${headRef}`,
  ]);
  const allFiles = gitLines([
    'ls-files',
    'versioned_docs',
    'i18n/en',
    'versioned_sidebars',
    'sidebars.js',
    'docusaurus.config.js',
  ]);
  const files = resolveChangedFiles({ explicitFiles, diffFiles, allFiles });
  process.stdout.write(JSON.stringify(files));
}

module.exports = {
  filterTranslationSourceFiles,
  resolveChangedFiles,
  splitInput,
};

if (require.main === module) {
  main();
}
