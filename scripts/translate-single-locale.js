#!/usr/bin/env node

/**
 * Translate files to a single locale
 * Used by GitHub Actions matrix strategy for parallel translation
 * 
 * Usage: node scripts/translate-single-locale.js <locale> <files.json>
 */

const OpenAI = require('openai').default;
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

const openai = new OpenAI();

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

let translationContext = '';

async function loadTranslationContext() {
  try {
    const contextPath = path.join(__dirname, 'translation-context.md');
    translationContext = await fs.readFile(contextPath, 'utf8');
  } catch (_error) {
    console.warn('Warning: Could not load translation-context.md');
  }
}

/**
 * Restore code blocks from source
 */
function restoreCodeBlocks(source, translated) {
  const sourceBlocks = source.match(/```[\s\S]*?```/g) || [];
  const translatedBlocks = translated.match(/```[\s\S]*?```/g) || [];
  
  if (sourceBlocks.length === 0) return translated;
  if (sourceBlocks.length !== translatedBlocks.length) {
    console.warn(`  ⚠️ Code block count mismatch, skipping restoration`);
    return translated;
  }
  
  let result = translated;
  let restored = 0;
  for (let i = 0; i < sourceBlocks.length; i++) {
    if (sourceBlocks[i] !== translatedBlocks[i]) {
      result = result.replace(translatedBlocks[i], sourceBlocks[i]);
      restored++;
    }
  }
  
  if (restored > 0) {
    console.log(`  ℹ️ Restored ${restored} code block(s)`);
  }
  
  return result;
}

/**
 * Translate content using GPT-4o-mini
 */
async function translateContent(content, locale, fileType = 'mdx') {
  const localeName = LOCALE_NAMES[locale] || locale;
  const lineCount = content.split('\n').length;

  let userPrompt;
  if (fileType === 'json') {
    userPrompt = `Translate to ${localeName}. Output ONLY valid JSON, starting with { and ending with }. Translate "message" values only.

${content}`;
  } else {
    userPrompt = `Translate this complete ${lineCount}-line document to ${localeName}. Output ONLY the translated document, starting with --- (frontmatter). No preamble, no explanation.

${content}`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 16384,
    messages: [
      { role: 'system', content: translationContext || 'You are a professional translator for technical documentation.' },
      { role: 'user', content: userPrompt },
    ],
  });

  let text = response.choices[0].message.content;

  // Strip code fence wrapper if AI added it
  if (text.startsWith('```') && text.endsWith('```')) {
    text = text.replace(/^```(?:mdx|markdown|json)?\n?/, '').replace(/\n?```$/, '');
  }

  // Restore code blocks from source
  if (fileType !== 'json') {
    text = restoreCodeBlocks(content, text);
  }

  return text;
}

/**
 * Process MDX file
 */
async function processMdxFile(filePath, locale) {
  const sourceContent = await fs.readFile(filePath, 'utf8');
  const sourceParsed = matter(sourceContent);
  const sourceImports = sourceContent.match(/^import .+$/gm) || [];

  let translatedContent = await translateContent(sourceContent, locale, 'mdx');

  // Restore frontmatter if lost
  if (!translatedContent.startsWith('---')) {
    console.warn(`  ⚠️ Restoring frontmatter`);
    translatedContent = matter.stringify(translatedContent, sourceParsed.data);
  }

  // Restore imports if lost
  const translatedImports = translatedContent.match(/^import .+$/gm) || [];
  if (sourceImports.length > 0 && translatedImports.length === 0) {
    console.warn(`  ⚠️ Restoring imports`);
    const parsed = matter(translatedContent);
    const importsBlock = sourceImports.join('\n') + '\n\n';
    translatedContent = matter.stringify(importsBlock + parsed.content, parsed.data);
  }

  return translatedContent;
}

/**
 * Process JSON file
 */
async function processJsonFile(filePath, locale) {
  const content = await fs.readFile(filePath, 'utf8');
  const translatedContent = await translateContent(content, locale, 'json');

  // Validate JSON
  try {
    JSON.parse(translatedContent);
    return translatedContent;
  } catch (error) {
    console.error(`  ❌ Invalid JSON, using source: ${error.message}`);
    return content;
  }
}

/**
 * Get target path for translated file
 */
function getTargetPath(sourcePath, locale) {
  if (sourcePath.startsWith('versioned_docs/')) {
    const relativePath = sourcePath.replace('versioned_docs/', '');
    return path.join('i18n', locale, 'docusaurus-plugin-content-docs', relativePath);
  }

  if (sourcePath.startsWith('i18n/en/')) {
    const relativePath = sourcePath.replace('i18n/en/', '');
    return path.join('i18n', locale, relativePath);
  }

  console.warn(`Unexpected source path: ${sourcePath}`);
  return null;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const locale = process.argv[2];
  const filesJsonPath = process.argv[3];

  if (!locale || !filesJsonPath) {
    console.error('Usage: node translate-single-locale.js <locale> <files.json>');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY required');
    process.exit(1);
  }

  await loadTranslationContext();

  // Read files list
  const filesContent = await fs.readFile(filesJsonPath, 'utf8');
  const files = JSON.parse(filesContent);

  console.log(`Translating ${files.length} files to ${locale} (${LOCALE_NAMES[locale] || locale})`);

  let successCount = 0;
  let errorCount = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const isMdx = ext === '.mdx' || ext === '.md';
    const isJson = ext === '.json';

    if (!isMdx && !isJson) {
      console.log(`Skipping: ${filePath}`);
      continue;
    }

    const targetPath = getTargetPath(filePath, locale);
    if (!targetPath) continue;

    console.log(`\nTranslating: ${filePath}`);

    try {
      let translatedContent;
      if (isMdx) {
        translatedContent = await processMdxFile(filePath, locale);
      } else {
        translatedContent = await processJsonFile(filePath, locale);
      }

      // Write file
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, translatedContent);
      console.log(`  ✓ ${targetPath}`);
      successCount++;

      // Rate limiting
      await sleep(300);
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Complete: ${successCount} succeeded, ${errorCount} failed`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
