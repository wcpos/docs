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
 * Clean up common AI translation artifacts
 */
function cleanTranslatedContent(content, fileType) {
  let cleaned = content;
  
  // Remove markdown code fences wrapping the entire content
  if (cleaned.startsWith('```mdx\n') || cleaned.startsWith('```markdown\n') || cleaned.startsWith('```json\n')) {
    cleaned = cleaned.replace(/^```(?:mdx|markdown|json)\n/, '');
    cleaned = cleaned.replace(/\n```\s*$/, '');
  }
  
  // For JSON: remove any trailing notes or comments
  if (fileType === 'json') {
    // Find the last } and truncate everything after
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    // Remove any // comments (JSON doesn't support them)
    cleaned = cleaned.replace(/^\s*\/\/.*$/gm, '');
  }
  
  return cleaned.trim();
}

/**
 * Translate content using Claude Haiku
 */
async function translateContent(content, targetLocale, fileType = 'mdx') {
  const localeName = LOCALE_NAMES[targetLocale] || targetLocale;

  let userPrompt;
  if (fileType === 'json') {
    userPrompt = `Translate the following JSON content to ${localeName}. 

RULES:
- Only translate the "message" values
- Keep all keys, structure, and placeholders (like {count}, {tagName}) exactly as they are
- Keep "description" values in English
- Return ONLY valid JSON - no comments, no notes, no explanation
- Translate the ENTIRE file - do not truncate

${content}`;
  } else {
    userPrompt = `Translate the following MDX documentation to ${localeName}.

RULES:
- Preserve ALL frontmatter (the YAML between --- markers) - this is required
- Preserve ALL import statements exactly as written
- Preserve all markdown formatting, code blocks, links, and JSX components
- For frontmatter: translate "title", "sidebar_label", and "description" values only
- If a translated title contains quotes, wrap it in single quotes: title: 'Text "with quotes"'
- NEVER translate file paths, URLs, anchor links (#section), or error codes
- Return the raw content only - do NOT wrap in code fences

${content}`;
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 8192,
      system:
        translationContext ||
        'You are a professional translator for technical documentation.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Clean up common AI artifacts
    return cleanTranslatedContent(response.content[0].text, fileType);
  } catch (error) {
    console.error(`Error translating to ${targetLocale}:`, error.message);
    throw error;
  }
}

/**
 * Process MDX/MD file - translate content and frontmatter
 */
async function processMdxFile(filePath, targetLocale) {
  const sourceContent = await fs.readFile(filePath, 'utf8');

  // Parse source to get frontmatter and imports
  const sourceParsed = matter(sourceContent);
  const sourceImports = sourceContent.match(/^import .+$/gm) || [];

  // Translate the full content
  let translatedContent = await translateContent(
    sourceContent,
    targetLocale,
    'mdx',
  );

  // Validate frontmatter exists in translation
  if (!translatedContent.startsWith('---')) {
    console.warn(`WARNING: Translation lost frontmatter for ${filePath}, restoring...`);
    // Reconstruct with original frontmatter
    const translatedBody = translatedContent;
    translatedContent = matter.stringify(translatedBody, sourceParsed.data);
  }

  // Validate imports are preserved
  const translatedImports = translatedContent.match(/^import .+$/gm) || [];
  if (sourceImports.length > 0 && translatedImports.length === 0) {
    console.warn(`WARNING: Translation lost imports for ${filePath}, restoring...`);
    // Insert imports after frontmatter
    const parsed = matter(translatedContent);
    const importsBlock = sourceImports.join('\n') + '\n\n';
    translatedContent = matter.stringify(importsBlock + parsed.content, parsed.data);
  }

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

  // Validate JSON - if invalid, fall back to source
  try {
    JSON.parse(translatedContent);
    return translatedContent;
  } catch (error) {
    console.error(`ERROR: Translated JSON for ${filePath} is malformed: ${error.message}`);
    console.error('Falling back to source content to prevent build failure');
    return content;
  }
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
