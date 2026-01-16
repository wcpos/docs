#!/usr/bin/env node

/**
 * WCPOS Documentation Translation Script
 *
 * Translates documentation files using OpenAI GPT-4o-mini API.
 * Handles MDX files (with frontmatter) and JSON files (sidebar labels, etc.)
 *
 * Usage: node scripts/translate-docs.js [changed_files.txt]
 */

const OpenAI = require('openai').default;
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

// Get languages from docusaurus.config.js
const docusaurusConfig = require('../docusaurus.config.js');
const DEFAULT_LOCALE = docusaurusConfig.i18n.defaultLocale;
const TARGET_LOCALES = docusaurusConfig.i18n.locales.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);

// Language display names
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

// Initialize OpenAI client
const openai = new OpenAI();

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
 * Translate content using GPT-4o-mini
 */
async function translateContent(content, targetLocale, fileType = 'mdx') {
  const localeName = LOCALE_NAMES[targetLocale] || targetLocale;
  const lineCount = content.split('\n').length;

  let userPrompt;
  if (fileType === 'json') {
    userPrompt = `Translate to ${localeName}. Output ONLY valid JSON, starting with { and ending with }. Translate "message" values only.

${content}`;
  } else {
    userPrompt = `Translate this complete ${lineCount}-line document to ${localeName}. Output ONLY the translated document, starting with --- (frontmatter). No preamble, no explanation.

${content}`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 16384,
      messages: [
        {
          role: 'system',
          content: translationContext || 'You are a professional translator for technical documentation.',
        },
        { role: 'user', content: userPrompt },
      ],
    });

    let content = response.choices[0].message.content;
    
    // Post-process: strip code fence wrapper if AI added it
    if (content.startsWith('```') && content.endsWith('```')) {
      content = content.replace(/^```(?:mdx|markdown|json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    return content;
  } catch (error) {
    console.error(`Error translating to ${targetLocale}:`, error.message);
    throw error;
  }
}

/**
 * Restore code blocks from source - AI often translates code comments
 * This ensures code blocks are identical to source
 */
function restoreCodeBlocks(source, translated) {
  const sourceBlocks = source.match(/```[\s\S]*?```/g) || [];
  const translatedBlocks = translated.match(/```[\s\S]*?```/g) || [];
  
  if (sourceBlocks.length === 0) return translated;
  if (sourceBlocks.length !== translatedBlocks.length) {
    console.warn(`WARNING: Code block count mismatch (${sourceBlocks.length} vs ${translatedBlocks.length}), skipping restoration`);
    return translated;
  }
  
  let result = translated;
  for (let i = 0; i < sourceBlocks.length; i++) {
    if (sourceBlocks[i] !== translatedBlocks[i]) {
      result = result.replace(translatedBlocks[i], sourceBlocks[i]);
    }
  }
  
  return result;
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

  // Restore code blocks from source (AI often translates comments)
  translatedContent = restoreCodeBlocks(sourceContent, translatedContent);

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
        await sleep(500);
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
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
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
