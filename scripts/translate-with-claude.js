#!/usr/bin/env node

/**
 * WCPOS Documentation Translation Script
 *
 * Translates documentation files using Claude Haiku API.
 * Handles MDX files (with frontmatter) and JSON files (sidebar labels, etc.)
 *
 * Usage: node scripts/translate-with-claude.js [changed_files.txt]
 */

const Anthropic = require('@anthropic-ai/sdk').default;
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

// Get languages from docusaurus.config.js
const docusaurusConfig = require('../docusaurus.config.js');
const DEFAULT_LOCALE = docusaurusConfig.i18n.defaultLocale;
const TARGET_LOCALES = docusaurusConfig.i18n.locales.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);

// Language display names for Claude
const LOCALE_NAMES = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  'pt-BR': 'Brazilian Portuguese',
  ko: 'Korean',
  it: 'Italian',
  ar: 'Arabic',
  'hi-IN': 'Hindi',
  'zh-CN': 'Simplified Chinese',
};

// Initialize Anthropic client
const anthropic = new Anthropic();

// Load translation context
let translationContext = '';

async function loadTranslationContext() {
  try {
    const contextPath = path.join(__dirname, 'translation-context.md');
    translationContext = await fs.readFile(contextPath, 'utf8');
  } catch (_error) {
    console.warn(
      'Warning: Could not load translation-context.md, proceeding without context',
    );
  }
}

/**
 * Translate content using Claude Haiku
 */
async function translateContent(content, targetLocale, fileType = 'mdx') {
  const localeName = LOCALE_NAMES[targetLocale] || targetLocale;

  let userPrompt;
  if (fileType === 'json') {
    userPrompt = `Translate the following JSON content to ${localeName}. 
Only translate the "message" values. Keep all keys, structure, and placeholders (like {count}, {tagName}) exactly as they are.
Do not include any explanation, just return the translated JSON.

${content}`;
  } else {
    userPrompt = `Translate the following MDX documentation to ${localeName}.
Preserve all markdown formatting, code blocks, links, JSX components, and frontmatter structure.
For frontmatter: translate "title", "sidebar_label", and "description" if present, keep other fields as-is.
Do not include any explanation, just return the translated content.

${content}`;
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-20240307',
      max_tokens: 8192,
      system:
        translationContext ||
        'You are a professional translator for technical documentation.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    return response.content[0].text;
  } catch (error) {
    console.error(`Error translating to ${targetLocale}:`, error.message);
    throw error;
  }
}

/**
 * Process MDX/MD file - translate content and frontmatter
 */
async function processMdxFile(filePath, targetLocale) {
  const content = await fs.readFile(filePath, 'utf8');

  // Parse to validate frontmatter exists (Claude will handle translation)
  matter(content);

  // Translate the full content (Claude will handle frontmatter appropriately)
  const translatedContent = await translateContent(
    content,
    targetLocale,
    'mdx',
  );

  return translatedContent;
}

/**
 * Process JSON file - translate message values
 */
async function processJsonFile(filePath, targetLocale) {
  const content = await fs.readFile(filePath, 'utf8');
  const translatedContent = await translateContent(
    content,
    targetLocale,
    'json',
  );

  // Validate JSON
  try {
    JSON.parse(translatedContent);
  } catch (_error) {
    console.error(`Warning: Translated JSON for ${filePath} may be malformed`);
  }

  return translatedContent;
}

/**
 * Get the target path for a translated file
 */
function getTargetPath(sourcePath, targetLocale) {
  // Handle versioned_docs -> i18n/{locale}/docusaurus-plugin-content-docs/{version}/
  if (sourcePath.startsWith('versioned_docs/')) {
    const relativePath = sourcePath.replace('versioned_docs/', '');
    return path.join(
      'i18n',
      targetLocale,
      'docusaurus-plugin-content-docs',
      relativePath,
    );
  }

  // Handle i18n/en/* -> i18n/{locale}/*
  if (sourcePath.startsWith('i18n/en/')) {
    const relativePath = sourcePath.replace('i18n/en/', '');
    return path.join('i18n', targetLocale, relativePath);
  }

  // Fallback - shouldn't happen
  console.warn(`Unexpected source path: ${sourcePath}`);
  return null;
}

/**
 * Process a single file for all target locales
 */
async function processFile(sourcePath, operation) {
  const ext = path.extname(sourcePath).toLowerCase();
  const isMdx = ext === '.mdx' || ext === '.md';
  const isJson = ext === '.json';

  if (!isMdx && !isJson) {
    console.log(`Skipping non-translatable file: ${sourcePath}`);
    return;
  }

  for (const locale of TARGET_LOCALES) {
    const targetPath = getTargetPath(sourcePath, locale);
    if (!targetPath) continue;

    if (operation === 'D') {
      // Delete file from this locale
      try {
        await fs.unlink(targetPath);
        console.log(`Deleted: ${targetPath}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn(`Could not delete ${targetPath}: ${error.message}`);
        }
      }
    } else {
      // Add or modify - translate and write
      try {
        let translatedContent;
        if (isMdx) {
          translatedContent = await processMdxFile(sourcePath, locale);
        } else {
          translatedContent = await processJsonFile(sourcePath, locale);
        }

        // Ensure target directory exists
        await fs.mkdir(path.dirname(targetPath), { recursive: true });

        // Write translated file
        await fs.writeFile(targetPath, translatedContent);
        console.log(`Translated: ${sourcePath} -> ${targetPath}`);

        // Rate limiting - wait between API calls
        await sleep(1500);
      } catch (error) {
        console.error(
          `Error processing ${sourcePath} for ${locale}: ${error.message}`,
        );
      }
    }
  }
}

/**
 * Parse changed files from git diff --name-status output
 */
function parseChangedFiles(content) {
  const files = [];
  const lines = content
    .trim()
    .split('\n')
    .filter((line) => line.trim());

  for (const line of lines) {
    // Format: "A\tpath/to/file" or "R100\told/path\tnew/path"
    const parts = line.split('\t');
    const status = parts[0].charAt(0); // A, M, D, or R

    if (status === 'R') {
      // Rename: delete old, add new
      files.push({ path: parts[1], operation: 'D' });
      files.push({ path: parts[2], operation: 'A' });
    } else {
      files.push({ path: parts[1], operation: status });
    }
  }

  return files;
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main entry point
 */
async function main() {
  const changedFilesPath = process.argv[2] || 'changed_files.txt';

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  // Load translation context
  await loadTranslationContext();

  // Read changed files
  let changedFilesContent;
  try {
    changedFilesContent = await fs.readFile(changedFilesPath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${changedFilesPath}: ${error.message}`);
    process.exit(1);
  }

  if (!changedFilesContent.trim()) {
    console.log('No changed files to process');
    return;
  }

  const changedFiles = parseChangedFiles(changedFilesContent);
  console.log(
    `Processing ${changedFiles.length} file operations for ${TARGET_LOCALES.length} locales...`,
  );
  console.log(`Target locales: ${TARGET_LOCALES.join(', ')}`);

  // Process each file
  for (const { path: filePath, operation } of changedFiles) {
    console.log(`\nProcessing: ${operation} ${filePath}`);
    await processFile(filePath, operation);
  }

  console.log('\nTranslation completed!');
}

main().catch((error) => {
  console.error('Translation failed:', error);
  process.exit(1);
});
