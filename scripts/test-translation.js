#!/usr/bin/env node

/**
 * Translation Test Script
 * 
 * Tests translation quality with randomized files and languages.
 * Run with: OPENAI_API_KEY=xxx node scripts/test-translation.js
 */

const OpenAI = require('openai').default;
const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

const openai = new OpenAI();

// Available locales
const LOCALES = ['de', 'es', 'fr', 'ja', 'pt-BR', 'ko', 'it', 'ar', 'hi-IN', 'zh-CN'];
const LOCALE_NAMES = {
  de: 'German', es: 'Spanish', fr: 'French', ja: 'Japanese',
  'pt-BR': 'Brazilian Portuguese', ko: 'Korean', it: 'Italian',
  ar: 'Arabic', 'hi-IN': 'Hindi', 'zh-CN': 'Simplified Chinese',
};

let translationContext = '';

async function loadTranslationContext() {
  const contextPath = path.join(__dirname, 'translation-context.md');
  translationContext = await fs.readFile(contextPath, 'utf8');
}

function pickRandom(arr, count = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return count === 1 ? shuffled[0] : shuffled.slice(0, count);
}

async function getTestFiles() {
  // Get MDX files
  const mdxFiles = await glob('versioned_docs/**/*.mdx');
  
  // Get JSON files  
  const jsonFiles = await glob('i18n/en/**/*.json');
  
  // Categorize MDX by characteristics
  const withCodeBlocks = [];
  const withImports = [];
  const withLinks = [];
  const simple = [];
  
  for (const file of mdxFiles.slice(0, 50)) { // Sample first 50 for speed
    try {
      const content = await fs.readFile(file, 'utf8');
      const hasCode = content.includes('```');
      const hasImports = /^import .+$/m.test(content);
      const hasLinks = /\]\([^)]+\)/.test(content);
      
      if (hasCode) withCodeBlocks.push(file);
      else if (hasImports) withImports.push(file);
      else if (hasLinks) withLinks.push(file);
      else simple.push(file);
    } catch (_e) { /* skip */ }
  }
  
  // Pick diverse test set
  const testFiles = [];
  
  if (withCodeBlocks.length) testFiles.push({ file: pickRandom(withCodeBlocks), type: 'mdx', category: 'code-blocks' });
  if (withImports.length) testFiles.push({ file: pickRandom(withImports), type: 'mdx', category: 'imports' });
  if (withLinks.length) testFiles.push({ file: pickRandom(withLinks), type: 'mdx', category: 'links' });
  if (jsonFiles.length) testFiles.push({ file: pickRandom(jsonFiles), type: 'json', category: 'json' });
  
  return testFiles;
}

/**
 * Restore code blocks from source - AI often translates code comments
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
    console.log(`  ℹ️ Restored ${restored} code block(s) from source`);
  }
  
  return result;
}

async function translateContent(content, locale, fileType) {
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
      { role: 'system', content: translationContext },
      { role: 'user', content: userPrompt },
    ],
  });

  let text = response.choices[0].message.content;
  
  // Post-process: strip code fence wrapper if AI added it
  if (text.startsWith('```') && text.endsWith('```')) {
    console.log('  ℹ️ Stripped code fence wrapper');
    text = text.replace(/^```(?:mdx|markdown|json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  // Post-process: restore code blocks from source
  if (fileType !== 'json') {
    text = restoreCodeBlocks(content, text);
  }

  return {
    text,
    tokens: response.usage,
    finishReason: response.choices[0].finish_reason,
  };
}

function validateTranslation(source, translated, fileType, locale) {
  const issues = [];
  
  if (fileType === 'json') {
    // JSON validation
    let parsedSource, parsedTranslated;
    try {
      parsedTranslated = JSON.parse(translated);
    } catch (e) {
      issues.push(`❌ INVALID JSON: ${e.message}`);
      return issues;
    }
    
    try {
      parsedSource = JSON.parse(source);
    } catch (e) {
      issues.push(`⚠️ SOURCE JSON INVALID: ${e.message}`);
      return issues;
    }
    
    if (!translated.trim().startsWith('{')) {
      issues.push('❌ JSON: Does not start with {');
    }
    
    // Check all keys preserved
    const sourceKeys = Object.keys(parsedSource);
    const translatedKeys = Object.keys(parsedTranslated);
    if (sourceKeys.length !== translatedKeys.length) {
      issues.push(`❌ JSON KEYS: Source has ${sourceKeys.length}, translation has ${translatedKeys.length}`);
    }
    
    // Check placeholders preserved in message values
    for (const key of sourceKeys) {
      if (parsedSource[key]?.message && parsedTranslated[key]?.message) {
        const sourcePlaceholders = parsedSource[key].message.match(/\{[^}]+\}/g) || [];
        const translatedPlaceholders = parsedTranslated[key].message.match(/\{[^}]+\}/g) || [];
        
        for (const ph of sourcePlaceholders) {
          if (!translatedPlaceholders.includes(ph)) {
            issues.push(`❌ PLACEHOLDER MISSING in "${key}": ${ph}`);
          }
        }
      }
    }
    
    // Check description values are NOT translated (should stay English)
    let translatedDescriptions = 0;
    for (const key of sourceKeys.slice(0, 10)) { // Sample first 10
      if (parsedSource[key]?.description && parsedTranslated[key]?.description) {
        if (parsedSource[key].description !== parsedTranslated[key].description) {
          translatedDescriptions++;
        }
      }
    }
    if (translatedDescriptions > 3) {
      issues.push(`⚠️ DESCRIPTIONS TRANSLATED: ${translatedDescriptions} description fields were translated (should stay English)`);
    }
    
    return issues;
  }
  
  // MDX validation
  const matter = require('gray-matter');
  
  // 1. Frontmatter
  if (!translated.startsWith('---')) {
    issues.push('❌ FRONTMATTER: Does not start with ---');
  } else {
    try {
      const sourceMatter = matter(source);
      const translatedMatter = matter(translated);
      
      // Check all frontmatter keys preserved
      const sourceKeys = Object.keys(sourceMatter.data);
      const translatedKeys = Object.keys(translatedMatter.data);
      
      for (const key of sourceKeys) {
        if (!translatedKeys.includes(key)) {
          issues.push(`❌ FRONTMATTER KEY MISSING: ${key}`);
        }
      }
      
      // Check slug is not translated (if present)
      if (sourceMatter.data.slug && translatedMatter.data.slug !== sourceMatter.data.slug) {
        issues.push(`❌ SLUG TRANSLATED: "${sourceMatter.data.slug}" → "${translatedMatter.data.slug}"`);
      }
      
      // Check sidebar_position preserved
      if (sourceMatter.data.sidebar_position !== undefined && 
          translatedMatter.data.sidebar_position !== sourceMatter.data.sidebar_position) {
        issues.push(`❌ SIDEBAR_POSITION CHANGED: ${sourceMatter.data.sidebar_position} → ${translatedMatter.data.sidebar_position}`);
      }
    } catch (e) {
      issues.push(`⚠️ FRONTMATTER PARSE ERROR: ${e.message}`);
    }
  }
  
  // 2. Imports
  const sourceImports = source.match(/^import .+$/gm) || [];
  const translatedImports = translated.match(/^import .+$/gm) || [];
  
  if (sourceImports.length !== translatedImports.length) {
    issues.push(`❌ IMPORTS: Source has ${sourceImports.length}, translation has ${translatedImports.length}`);
  } else {
    for (let i = 0; i < sourceImports.length; i++) {
      if (sourceImports[i] !== translatedImports[i]) {
        issues.push(`❌ IMPORT MODIFIED: "${sourceImports[i].substring(0, 50)}..."`);
      }
    }
  }
  
  // 3. Code blocks - must be IDENTICAL
  const sourceCodeBlocks = source.match(/```[\s\S]*?```/g) || [];
  const translatedCodeBlocks = translated.match(/```[\s\S]*?```/g) || [];
  
  if (sourceCodeBlocks.length !== translatedCodeBlocks.length) {
    issues.push(`❌ CODE BLOCKS: Source has ${sourceCodeBlocks.length}, translation has ${translatedCodeBlocks.length}`);
  } else {
    for (let i = 0; i < sourceCodeBlocks.length; i++) {
      if (sourceCodeBlocks[i] !== translatedCodeBlocks[i]) {
        issues.push(`❌ CODE BLOCK ${i + 1} MODIFIED (comments/content translated)`);
      }
    }
  }
  
  // 4. Links - URLs must be preserved (but title text in quotes can be translated)
  // Extract just the URL part, ignoring optional title: [text](url) or [text](url "title")
  const extractUrls = (content) => {
    const matches = content.match(/\]\(([^)\s]+)/g) || [];
    return matches.map(m => m.slice(2)); // Remove "]("
  };
  
  const sourceUrls = extractUrls(source);
  const translatedUrls = extractUrls(translated);
  
  const sourceUrlSet = new Set(sourceUrls);
  const translatedUrlSet = new Set(translatedUrls);
  
  for (const url of sourceUrlSet) {
    if (!translatedUrlSet.has(url)) {
      issues.push(`❌ LINK URL CHANGED: ${url}`);
    }
  }
  
  // 5. Error codes
  const errorCodes = source.match(/[A-Z]{2,3}\d{5}/g) || [];
  for (const code of new Set(errorCodes)) {
    if (!translated.includes(code)) {
      issues.push(`❌ ERROR CODE MISSING: ${code}`);
    }
  }
  
  // 6. Length check (CJK languages are more compact, allow lower ratio)
  const ratio = translated.length / source.length;
  const isCJK = ['zh-CN', 'ja', 'ko'].includes(locale);
  const minRatio = isCJK ? 0.4 : 0.7;
  
  if (ratio < minRatio) {
    issues.push(`❌ TRUNCATED: Only ${(ratio * 100).toFixed(0)}% of source length (min ${(minRatio * 100).toFixed(0)}% for ${locale})`);
  }
  
  // 7. Artifacts
  if (/^```(mdx|markdown)/m.test(translated)) {
    issues.push('❌ ARTIFACT: Wrapped in code fence');
  }
  if (/here is the translation/i.test(translated)) {
    issues.push('❌ ARTIFACT: Contains preamble');
  }
  
  // 8. Admonitions preserved (:::info, :::tip, etc.)
  const sourceAdmonitions = source.match(/^:::(info|tip|warning|note|danger|important)/gm) || [];
  const translatedAdmonitions = translated.match(/^:::(info|tip|warning|note|danger|important)/gm) || [];
  if (sourceAdmonitions.length !== translatedAdmonitions.length) {
    issues.push(`❌ ADMONITIONS: Source has ${sourceAdmonitions.length}, translation has ${translatedAdmonitions.length}`);
  }
  
  // 9. HTML/JSX tags preserved
  const sourceJsx = source.match(/<[A-Z][a-zA-Z]*[\s/>]/g) || [];
  const translatedJsx = translated.match(/<[A-Z][a-zA-Z]*[\s/>]/g) || [];
  const sourceJsxSet = new Set(sourceJsx);
  const translatedJsxSet = new Set(translatedJsx);
  for (const tag of sourceJsxSet) {
    if (!translatedJsxSet.has(tag)) {
      issues.push(`❌ JSX TAG MISSING: ${tag}`);
    }
  }
  
  // 10. Inline code preserved (backtick content)
  const sourceInlineCode = source.match(/`[^`]+`/g) || [];
  const translatedInlineCode = translated.match(/`[^`]+`/g) || [];
  // Check critical ones (paths, code references) but allow placeholder URLs
  const criticalCode = sourceInlineCode.filter(c => {
    // Skip placeholder URLs that can be localized
    if (c.includes('yourstore.com') || c.includes('yourdomain.com') || c.includes('example.com')) {
      return false;
    }
    return c.includes('/') || c.includes('.php') || c.includes('.js') || 
           c.match(/^`[A-Z]{2,}\d+`$/) || c.includes('wp-');
  });
  for (const code of criticalCode) {
    if (!translatedInlineCode.includes(code)) {
      issues.push(`❌ INLINE CODE CHANGED: ${code}`);
    }
  }
  
  return issues;
}

async function testFile(file, type, category, locale) {
  console.log('\n' + '='.repeat(70));
  console.log(`File: ${file}`);
  console.log(`Category: ${category} | Locale: ${locale} (${LOCALE_NAMES[locale]})`);
  console.log('='.repeat(70));
  
  const source = await fs.readFile(file, 'utf8');
  const sourceLines = source.split('\n').length;
  
  // Quick stats
  const imports = (source.match(/^import .+$/gm) || []).length;
  const codeBlocks = (source.match(/```/g) || []).length / 2;
  const links = (source.match(/\]\([^)]+\)/g) || []).length;
  
  console.log(`Source: ${sourceLines} lines, ${source.length} chars`);
  if (type === 'mdx') console.log(`Contains: ${imports} imports, ${codeBlocks} code blocks, ${links} links`);
  
  console.log('\nTranslating...');
  const startTime = Date.now();
  const result = await translateContent(source, locale, type);
  const elapsed = Date.now() - startTime;
  
  console.log(`Done in ${(elapsed/1000).toFixed(1)}s | ${result.tokens.prompt_tokens} in / ${result.tokens.completion_tokens} out`);
  
  const translated = result.text;
  console.log(`Output: ${translated.split('\n').length} lines, ${translated.length} chars (${((translated.length/source.length)*100).toFixed(0)}%)`);
  
  // Validate
  console.log('\nValidation:');
  const issues = validateTranslation(source, translated, type, locale);
  
  if (issues.length === 0) {
    console.log('✅ All checks passed!');
  } else {
    for (const issue of issues) {
      console.log(issue);
    }
  }
  
  // Write output
  const baseName = path.basename(file);
  const outputPath = `test-output/${locale}/${category}-${baseName}`;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, translated);
  console.log(`Output: ${outputPath}`);
  
  return { file, category, locale, issues, elapsed };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY required');
    console.error('Usage: OPENAI_API_KEY=xxx node scripts/test-translation.js');
    process.exit(1);
  }

  console.log('Translation Test Suite (Randomized)');
  console.log('=' .repeat(70));
  
  await loadTranslationContext();
  
  // Get random test files
  const testFiles = await getTestFiles();
  console.log(`Selected ${testFiles.length} test files across categories`);
  
  // Pick random locales for each
  const results = [];
  
  for (const { file, type, category } of testFiles) {
    const locale = pickRandom(LOCALES);
    try {
      const result = await testFile(file, type, category, locale);
      results.push(result);
    } catch (error) {
      console.error(`\nError: ${error.message}`);
      results.push({ file, category, locale, issues: [`ERROR: ${error.message}`], elapsed: 0 });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  
  let totalIssues = 0;
  for (const r of results) {
    const status = r.issues.length === 0 ? '✅' : '❌';
    console.log(`${status} [${r.category}] ${path.basename(r.file)} → ${r.locale}: ${r.issues.length} issues`);
    totalIssues += r.issues.length;
  }
  
  console.log(`\nTotal: ${totalIssues} issues across ${results.length} files`);
  
  if (totalIssues > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
