#!/usr/bin/env node

/**
 * Translate files to a single locale (with incremental translation support)
 * Used by GitHub Actions matrix strategy for parallel translation
 * 
 * Features:
 * - Incremental translation: Only translates changed blocks, preserving existing translations
 * - Block-level diffing: Parses MDX into semantic blocks for precise change detection
 * - Fallback: Full translation if no existing translation exists
 * 
 * Usage: node scripts/translate-single-locale.js <locale> <files.json>
 */

const OpenAI = require('openai').default;
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { parseIntoBlocks, BlockType, blocksToContent } = require('./parse-mdx-blocks');

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
 * Translate a single block of content
 */
async function translateBlock(block, locale) {
  const localeName = LOCALE_NAMES[locale] || locale;
  
  // Don't translate certain block types
  if (block.noTranslate || 
      block.type === BlockType.CODE_BLOCK ||
      block.type === BlockType.IMPORT ||
      block.type === BlockType.EMPTY ||
      block.type === BlockType.HTML_COMMENT ||
      block.type === BlockType.JSX_COMMENT) {
    return block.content;
  }

  let userPrompt;
  
  if (block.type === BlockType.FRONTMATTER) {
    userPrompt = `Translate only the title, sidebar_label, and description values in this YAML frontmatter to ${localeName}. Keep all other fields unchanged. Output ONLY the YAML, starting with --- and ending with ---:

${block.content}`;
  } else if (block.type === BlockType.HEADING) {
    userPrompt = `Translate this heading to ${localeName}. Keep the # markers. Output ONLY the translated heading:

${block.content}`;
  } else if (block.type === BlockType.TABLE) {
    userPrompt = `Translate the text content in this markdown table to ${localeName}. Keep the | and - structure intact. Output ONLY the translated table:

${block.content}`;
  } else if (block.type === BlockType.ADMONITION) {
    userPrompt = `Translate the content of this admonition to ${localeName}. Keep the :::type markers unchanged. Output ONLY the translated admonition:

${block.content}`;
  } else if (block.type === BlockType.LIST) {
    userPrompt = `Translate this list to ${localeName}. Keep list markers (-, *, 1.) and any inline code unchanged. Output ONLY the translated list:

${block.content}`;
  } else if (block.type === BlockType.JSX) {
    // For JSX, only translate alt text and string content, not component structure
    userPrompt = `Translate only the human-readable text content (like alt text, captions) in this JSX to ${localeName}. Keep component names, props, and paths unchanged. Output ONLY the translated JSX:

${block.content}`;
  } else {
    // Paragraph or other
    userPrompt = `Translate this text to ${localeName}. Keep any inline code (in backticks) and links URLs unchanged. Output ONLY the translated text:

${block.content}`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: translationContext || 'You are a professional translator for technical documentation.' },
        { role: 'user', content: userPrompt },
      ],
    });

    let text = response.choices[0].message.content.trim();
    
    // Strip code fence wrapper if AI added it
    if (text.startsWith('```') && text.endsWith('```')) {
      text = text.replace(/^```(?:yaml|mdx|markdown)?\n?/, '').replace(/\n?```$/, '');
    }
    
    return text;
  } catch (error) {
    console.warn(`  ⚠️ Failed to translate block: ${error.message}`);
    return block.content;
  }
}

/**
 * Read existing translation if available
 */
async function readExistingTranslation(sourcePath, locale) {
  const targetPath = getTargetPath(sourcePath, locale);
  if (!targetPath) return null;
  
  try {
    return await fs.readFile(targetPath, 'utf8');
  } catch (_error) {
    return null;
  }
}

/**
 * Find blocks that changed between source versions
 * Compares English source content hashes, not translated content
 */
function findChangedBlocks(sourceBlocks, existingSourceBlocks) {
  const changes = [];
  
  for (let i = 0; i < sourceBlocks.length; i++) {
    const sourceBlock = sourceBlocks[i];
    
    // Skip non-translatable blocks
    if (sourceBlock.noTranslate || 
        sourceBlock.type === BlockType.CODE_BLOCK ||
        sourceBlock.type === BlockType.IMPORT ||
        sourceBlock.type === BlockType.EMPTY ||
        sourceBlock.type === BlockType.HTML_COMMENT ||
        sourceBlock.type === BlockType.JSX_COMMENT) {
      continue;
    }
    
    // If this is a new block (index beyond existing), mark as changed
    if (i >= existingSourceBlocks.length) {
      changes.push({ index: i, block: sourceBlock, reason: 'new' });
      continue;
    }
    
    const existingBlock = existingSourceBlocks[i];
    
    // If block type changed, needs re-translation
    if (sourceBlock.type !== existingBlock.type) {
      changes.push({ index: i, block: sourceBlock, reason: 'type_changed' });
      continue;
    }
    
    // If content hash changed, needs re-translation
    if (sourceBlock.hash !== existingBlock.hash) {
      changes.push({ index: i, block: sourceBlock, reason: 'content_changed' });
    }
  }
  
  return changes;
}

/**
 * Process MDX file with incremental translation
 */
async function processMdxFile(filePath, locale) {
  const sourceContent = await fs.readFile(filePath, 'utf8');
  const sourceParsed = matter(sourceContent);
  const sourceImports = sourceContent.match(/^import .+$/gm) || [];
  
  // Check for existing translation
  const existingTranslation = await readExistingTranslation(filePath, locale);
  
  if (!existingTranslation) {
    // No existing translation - do full translation
    console.log('  ℹ️ No existing translation, translating full document');
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
  
  // Parse both into blocks
  const sourceBlocks = parseIntoBlocks(sourceContent);
  const existingBlocks = parseIntoBlocks(existingTranslation);
  
  // We need the previous English source to compare what changed
  // Since we don't store it, we'll use a heuristic:
  // - If the number of blocks is the same and types match, compare by position
  // - If structure differs significantly, fall back to full translation
  
  // Check if structure is similar enough for incremental translation
  const structureSimilar = sourceBlocks.length === existingBlocks.length &&
    sourceBlocks.every((b, i) => b.type === existingBlocks[i].type);
  
  if (!structureSimilar) {
    // Structure changed too much - do full translation but warn
    console.log(`  ⚠️ Document structure changed significantly (${sourceBlocks.length} vs ${existingBlocks.length} blocks)`);
    console.log('  ℹ️ Falling back to full translation');
    
    let translatedContent = await translateContent(sourceContent, locale, 'mdx');
    
    if (!translatedContent.startsWith('---')) {
      translatedContent = matter.stringify(translatedContent, sourceParsed.data);
    }
    
    const translatedImports = translatedContent.match(/^import .+$/gm) || [];
    if (sourceImports.length > 0 && translatedImports.length === 0) {
      const parsed = matter(translatedContent);
      const importsBlock = sourceImports.join('\n') + '\n\n';
      translatedContent = matter.stringify(importsBlock + parsed.content, parsed.data);
    }
    
    return translatedContent;
  }
  
  // For incremental: we need to detect what English blocks changed
  // The challenge is we don't have the previous English source stored
  // 
  // NEW APPROACH: Use content similarity heuristics
  // For each block position, check if the English source content appears 
  // different from what would have produced the existing translation
  // 
  // Since we can't know the exact previous English, we use these rules:
  // 1. Code blocks, imports, empty lines: Compare directly (should be identical)
  // 2. For translatable content: We'll need to store source hashes
  //
  // For now, implement a simpler approach:
  // - Read metadata from a sidecar file that stores source hashes
  // - If no sidecar exists, assume all blocks need checking
  
  const metadataPath = getTargetPath(filePath, locale) + '.meta.json';
  let sourceHashes = null;
  
  try {
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    sourceHashes = JSON.parse(metadataContent);
  } catch (_error) {
    // No metadata file - this is the first incremental run
    // We'll compare directly translatable blocks and preserve existing translations
    // for content that looks structurally similar
    sourceHashes = null;
  }
  
  // Find changed blocks
  const changedIndices = [];
  
  for (let i = 0; i < sourceBlocks.length; i++) {
    const sourceBlock = sourceBlocks[i];
    const existingBlock = existingBlocks[i];
    
    // Skip non-translatable blocks
    if (sourceBlock.noTranslate || 
        sourceBlock.type === BlockType.CODE_BLOCK ||
        sourceBlock.type === BlockType.IMPORT ||
        sourceBlock.type === BlockType.EMPTY ||
        sourceBlock.type === BlockType.HTML_COMMENT ||
        sourceBlock.type === BlockType.JSX_COMMENT) {
      continue;
    }
    
    // If we have stored hashes, use them
    if (sourceHashes && sourceHashes[i]) {
      if (sourceBlock.hash !== sourceHashes[i]) {
        changedIndices.push(i);
      }
      continue;
    }
    
    // No stored hashes - use heuristics
    // For imports and code blocks (handled above), they should match exactly
    // For content blocks, we can't know if English changed without the original
    // 
    // Conservative approach: Don't retranslate if we have no evidence of change
    // This preserves existing good translations
    //
    // The next time the translate workflow runs, it will save the source hashes
    // and future runs will be able to detect changes properly
  }
  
  if (changedIndices.length === 0) {
    console.log('  ✓ No changes detected, keeping existing translation');
    
    // Still save metadata for future runs
    await saveSourceMetadata(filePath, locale, sourceBlocks);
    
    return existingTranslation;
  }
  
  console.log(`  ℹ️ ${changedIndices.length} block(s) changed, translating incrementally`);
  
  // Build result by merging existing translations with new translations
  const resultBlocks = [];
  
  for (let i = 0; i < sourceBlocks.length; i++) {
    const sourceBlock = sourceBlocks[i];
    
    if (changedIndices.includes(i)) {
      // Translate this block
      console.log(`    Translating block ${i + 1} (${sourceBlock.type})`);
      const translatedContent = await translateBlock(sourceBlock, locale);
      resultBlocks.push({
        ...sourceBlock,
        content: translatedContent,
      });
      
      // Rate limit between block translations
      await sleep(200);
    } else {
      // Keep existing translation
      resultBlocks.push(existingBlocks[i]);
    }
  }
  
  // Save source metadata for future incremental runs
  await saveSourceMetadata(filePath, locale, sourceBlocks);
  
  // Reconstruct document
  const result = resultBlocks.map(b => b.content).join('\n');
  
  // Validate result
  if (!result.startsWith('---')) {
    console.warn(`  ⚠️ Result missing frontmatter, using full translation fallback`);
    return await translateContent(sourceContent, locale, 'mdx');
  }
  
  return result;
}

/**
 * Save source block hashes for future incremental runs
 */
async function saveSourceMetadata(sourcePath, locale, sourceBlocks) {
  const targetPath = getTargetPath(sourcePath, locale);
  if (!targetPath) return;
  
  const metadataPath = targetPath + '.meta.json';
  const hashes = {};
  
  for (let i = 0; i < sourceBlocks.length; i++) {
    hashes[i] = sourceBlocks[i].hash;
  }
  
  try {
    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(hashes, null, 2));
  } catch (error) {
    console.warn(`  ⚠️ Could not save metadata: ${error.message}`);
  }
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
  console.log('Using incremental translation (preserves existing translations)\n');

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const isMdx = ext === '.mdx' || ext === '.md';
    const isJson = ext === '.json';

    if (!isMdx && !isJson) {
      console.log(`Skipping: ${filePath}`);
      skippedCount++;
      continue;
    }

    const targetPath = getTargetPath(filePath, locale);
    if (!targetPath) continue;

    console.log(`\nProcessing: ${filePath}`);

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
  console.log(`Complete: ${successCount} succeeded, ${errorCount} failed, ${skippedCount} skipped`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
