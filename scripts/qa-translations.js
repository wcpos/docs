#!/usr/bin/env node

/**
 * Translation Quality Assurance Script
 * 
 * Uses back-translation technique to validate translation quality:
 * 1. Take translated document
 * 2. Translate it back to English
 * 3. Compare back-translated English with original English
 * 4. Score based on semantic similarity and issue detection
 * 
 * Usage:
 *   node scripts/qa-translations.js <locale> [files...]
 *   node scripts/qa-translations.js de i18n/de/.../file.mdx
 *   node scripts/qa-translations.js --sample 5       # Random sample of 5 files
 *   node scripts/qa-translations.js --changed        # Files changed in current PR
 */

const OpenAI = require('openai').default;
const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
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

// Quality thresholds
const THRESHOLDS = {
  pass: 80,      // Overall score >= 80 is passing
  warning: 60,   // 60-79 is warning
  fail: 0,       // < 60 is failing
};

/**
 * Back-translate content to English
 */
async function backTranslate(content, fromLocale) {
  const localeName = LOCALE_NAMES[fromLocale] || fromLocale;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 16384,
    messages: [
      { 
        role: 'system', 
        content: 'You are a professional translator. Translate the following content back to English. Preserve all formatting, markdown syntax, and structure exactly. Output ONLY the translated content.'
      },
      { 
        role: 'user', 
        content: `Translate this ${localeName} document back to English. Preserve all markdown formatting:\n\n${content}`
      },
    ],
  });

  let text = response.choices[0].message.content;
  
  // Strip code fence wrapper if AI added it
  if (text.startsWith('```') && text.endsWith('```')) {
    text = text.replace(/^```(?:mdx|markdown)?\n?/, '').replace(/\n?```$/, '');
  }
  
  return text;
}

/**
 * Compare original English with back-translated English using LLM
 */
async function evaluateSimilarity(original, backTranslated) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 2048,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a translation quality evaluator. Compare the original English text with a back-translated version and score the quality.

Output JSON with this structure:
{
  "semantic_fidelity": <0-100>,  // Does the meaning match?
  "completeness": <0-100>,       // Is all content present?
  "technical_accuracy": <0-100>, // Are technical terms correct?
  "issues": [                    // Specific problems found
    {
      "type": "missing_content" | "semantic_drift" | "technical_error" | "truncation" | "hallucination",
      "severity": "high" | "medium" | "low",
      "description": "Brief description",
      "original_excerpt": "relevant text from original",
      "backtranslated_excerpt": "relevant text from back-translation"
    }
  ],
  "summary": "One sentence summary of translation quality"
}`
      },
      {
        role: 'user',
        content: `ORIGINAL ENGLISH:
---
${original}
---

BACK-TRANSLATED TO ENGLISH:
---
${backTranslated}
---

Evaluate the translation quality. Focus on:
1. Missing or added content
2. Meaning changes
3. Technical term accuracy
4. Structure preservation`
      }
    ],
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Failed to parse evaluation response:', error.message);
    return {
      semantic_fidelity: 0,
      completeness: 0,
      technical_accuracy: 0,
      issues: [{ type: 'evaluation_error', severity: 'high', description: 'Failed to evaluate' }],
      summary: 'Evaluation failed'
    };
  }
}

/**
 * Structural validation (without API calls)
 */
function validateStructure(original, translated) {
  const issues = [];
  
  // 1. Check frontmatter preserved
  const originalMatter = matter(original);
  const translatedMatter = matter(translated);
  
  if (!translated.startsWith('---')) {
    issues.push({
      type: 'structural',
      severity: 'high',
      description: 'Missing frontmatter'
    });
  }
  
  // Check required frontmatter fields
  for (const key of ['title', 'sidebar_label']) {
    if (originalMatter.data[key] && !translatedMatter.data[key]) {
      issues.push({
        type: 'missing_content',
        severity: 'high',
        description: `Missing frontmatter field: ${key}`
      });
    }
  }
  
  // Check non-translatable fields are preserved
  for (const key of ['sidebar_position', 'slug']) {
    if (originalMatter.data[key] !== undefined && 
        translatedMatter.data[key] !== originalMatter.data[key]) {
      issues.push({
        type: 'structural',
        severity: 'medium',
        description: `Changed non-translatable field: ${key}`
      });
    }
  }
  
  // 2. Check imports preserved
  const originalImports = original.match(/^import .+$/gm) || [];
  const translatedImports = translated.match(/^import .+$/gm) || [];
  
  if (originalImports.length !== translatedImports.length) {
    issues.push({
      type: 'structural',
      severity: 'high',
      description: `Import count mismatch: ${originalImports.length} -> ${translatedImports.length}`
    });
  }
  
  // 3. Check code blocks preserved
  const originalCodeBlocks = original.match(/```[\s\S]*?```/g) || [];
  const translatedCodeBlocks = translated.match(/```[\s\S]*?```/g) || [];
  
  if (originalCodeBlocks.length !== translatedCodeBlocks.length) {
    issues.push({
      type: 'structural',
      severity: 'high',
      description: `Code block count mismatch: ${originalCodeBlocks.length} -> ${translatedCodeBlocks.length}`
    });
  } else {
    for (let i = 0; i < originalCodeBlocks.length; i++) {
      if (originalCodeBlocks[i] !== translatedCodeBlocks[i]) {
        issues.push({
          type: 'technical_error',
          severity: 'medium',
          description: `Code block ${i + 1} was modified`
        });
      }
    }
  }
  
  // 4. Check links preserved
  const extractUrls = (content) => {
    const matches = content.match(/\]\(([^)\s]+)/g) || [];
    return matches.map(m => m.slice(2));
  };
  
  const originalUrls = new Set(extractUrls(original));
  const translatedUrls = new Set(extractUrls(translated));
  
  for (const url of originalUrls) {
    if (!translatedUrls.has(url)) {
      issues.push({
        type: 'structural',
        severity: 'medium',
        description: `Missing link URL: ${url}`
      });
    }
  }
  
  // 5. Check admonitions preserved
  const originalAdmonitions = original.match(/^:::\w+/gm) || [];
  const translatedAdmonitions = translated.match(/^:::\w+/gm) || [];
  
  if (originalAdmonitions.length !== translatedAdmonitions.length) {
    issues.push({
      type: 'structural',
      severity: 'medium',
      description: `Admonition count mismatch: ${originalAdmonitions.length} -> ${translatedAdmonitions.length}`
    });
  }
  
  // 6. Check length ratio (truncation detection)
  const ratio = translated.length / original.length;
  const isCJK = ['zh-CN', 'ja', 'ko'].includes(getLocaleFromPath(translated));
  const minRatio = isCJK ? 0.4 : 0.6;
  
  if (ratio < minRatio) {
    issues.push({
      type: 'truncation',
      severity: 'high',
      description: `Content may be truncated (${Math.round(ratio * 100)}% of original length)`
    });
  }
  
  return issues;
}

/**
 * Get locale from file path
 */
function getLocaleFromPath(filePath) {
  const match = filePath.match(/i18n\/([^/]+)\//);
  return match ? match[1] : null;
}

/**
 * Get source English path from translated path
 */
function getSourcePath(translatedPath) {
  // i18n/de/docusaurus-plugin-content-docs/version-1.x/file.mdx
  // -> versioned_docs/version-1.x/file.mdx
  const match = translatedPath.match(/i18n\/[^/]+\/docusaurus-plugin-content-docs\/(.+)/);
  if (match) {
    return path.join('versioned_docs', match[1]);
  }
  
  // i18n/de/docusaurus-theme-classic/file.json
  // -> i18n/en/docusaurus-theme-classic/file.json
  const themeMatch = translatedPath.match(/i18n\/[^/]+\/(docusaurus-theme-classic\/.+)/);
  if (themeMatch) {
    return path.join('i18n/en', themeMatch[1]);
  }
  
  return null;
}

/**
 * Evaluate a single translated file
 */
async function evaluateFile(translatedPath, options = {}) {
  const locale = getLocaleFromPath(translatedPath);
  const sourcePath = getSourcePath(translatedPath);
  
  if (!sourcePath) {
    return {
      file: translatedPath,
      error: 'Could not determine source path',
      score: 0,
      status: 'error'
    };
  }
  
  let original, translated;
  
  try {
    original = await fs.readFile(sourcePath, 'utf8');
    translated = await fs.readFile(translatedPath, 'utf8');
  } catch (error) {
    return {
      file: translatedPath,
      error: `Could not read files: ${error.message}`,
      score: 0,
      status: 'error'
    };
  }
  
  // Structural validation (fast, no API)
  const structuralIssues = validateStructure(original, translated);
  
  // If structural issues are severe, skip expensive back-translation
  const severeStructuralIssues = structuralIssues.filter(i => i.severity === 'high');
  if (severeStructuralIssues.length > 2) {
    const score = Math.max(0, 40 - severeStructuralIssues.length * 10);
    return {
      file: translatedPath,
      locale,
      sourcePath,
      score,
      semantic_fidelity: score,
      completeness: score,
      technical_accuracy: score,
      issues: structuralIssues,
      summary: `Failed structural validation with ${severeStructuralIssues.length} severe issues`,
      status: score >= THRESHOLDS.pass ? 'pass' : score >= THRESHOLDS.warning ? 'warning' : 'fail',
      skipped_back_translation: true
    };
  }
  
  // Back-translation and semantic evaluation
  let backTranslated, evaluation;
  
  if (!options.skipBackTranslation) {
    try {
      console.log(`  Back-translating from ${locale}...`);
      backTranslated = await backTranslate(translated, locale);
      
      console.log('  Evaluating semantic similarity...');
      evaluation = await evaluateSimilarity(original, backTranslated);
    } catch (error) {
      return {
        file: translatedPath,
        locale,
        sourcePath,
        error: `Back-translation failed: ${error.message}`,
        score: 50,
        issues: structuralIssues,
        status: 'warning'
      };
    }
  } else {
    evaluation = {
      semantic_fidelity: 80,
      completeness: 80,
      technical_accuracy: 80,
      issues: [],
      summary: 'Skipped back-translation (structural check only)'
    };
  }
  
  // Combine issues
  const allIssues = [...structuralIssues, ...(evaluation.issues || [])];
  
  // Calculate overall score
  const score = Math.round(
    (evaluation.semantic_fidelity * 0.4) +
    (evaluation.completeness * 0.35) +
    (evaluation.technical_accuracy * 0.25) -
    (severeStructuralIssues.length * 5)
  );
  
  const status = score >= THRESHOLDS.pass ? 'pass' : 
                 score >= THRESHOLDS.warning ? 'warning' : 'fail';
  
  return {
    file: translatedPath,
    locale,
    sourcePath,
    score: Math.max(0, Math.min(100, score)),
    semantic_fidelity: evaluation.semantic_fidelity,
    completeness: evaluation.completeness,
    technical_accuracy: evaluation.technical_accuracy,
    issues: allIssues,
    summary: evaluation.summary,
    status,
    backTranslated: options.includeBackTranslation ? backTranslated : undefined
  };
}

/**
 * Get files changed in current PR/branch
 */
async function getChangedFiles() {
  const { execSync } = require('child_process');
  
  try {
    // Get files changed compared to main branch
    const output = execSync('git diff --name-only origin/main...HEAD -- "i18n/**/*.mdx"', {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch (_error) {
    // Fallback: get all staged/modified files
    try {
      const output = execSync('git diff --name-only HEAD -- "i18n/**/*.mdx"', {
        encoding: 'utf8',
        cwd: process.cwd()
      });
      return output.trim().split('\n').filter(f => f.length > 0);
    } catch (_e) {
      return [];
    }
  }
}

/**
 * Get random sample of translation files
 */
async function getSampleFiles(count, locale = null) {
  const pattern = locale 
    ? `i18n/${locale}/docusaurus-plugin-content-docs/**/*.mdx`
    : 'i18n/*/docusaurus-plugin-content-docs/**/*.mdx';
  
  const allFiles = await glob(pattern);
  
  // Shuffle and take sample
  const shuffled = allFiles.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Format results for console output
 */
function formatResults(results) {
  const lines = [];
  
  lines.push('\n' + '='.repeat(70));
  lines.push('TRANSLATION QUALITY REPORT');
  lines.push('='.repeat(70) + '\n');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  lines.push(`Summary: ${passed} passed, ${warnings} warnings, ${failed} failed, ${errors} errors\n`);
  
  // Group by status
  for (const status of ['fail', 'warning', 'pass', 'error']) {
    const statusResults = results.filter(r => r.status === status);
    if (statusResults.length === 0) continue;
    
    const icon = status === 'pass' ? '✅' : status === 'warning' ? '⚠️' : status === 'error' ? '❓' : '❌';
    lines.push(`\n${icon} ${status.toUpperCase()} (${statusResults.length} files):\n`);
    
    for (const result of statusResults) {
      const shortPath = result.file.replace('i18n/', '').replace('docusaurus-plugin-content-docs/', '');
      lines.push(`  ${shortPath}`);
      lines.push(`    Score: ${result.score}/100 | ${result.summary || result.error || ''}`);
      
      if (result.issues && result.issues.length > 0) {
        const topIssues = result.issues.slice(0, 3);
        for (const issue of topIssues) {
          lines.push(`    - [${issue.severity}] ${issue.type}: ${issue.description}`);
        }
        if (result.issues.length > 3) {
          lines.push(`    ... and ${result.issues.length - 3} more issues`);
        }
      }
      lines.push('');
    }
  }
  
  // Overall score
  const avgScore = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length)
    : 0;
  
  lines.push('='.repeat(70));
  lines.push(`Overall Average Score: ${avgScore}/100`);
  lines.push(`Threshold: ${THRESHOLDS.pass} (pass), ${THRESHOLDS.warning} (warning)`);
  lines.push('='.repeat(70));
  
  return lines.join('\n');
}

/**
 * Format results as GitHub Actions summary markdown
 */
function formatGitHubSummary(results) {
  const lines = [];
  
  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  const avgScore = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length)
    : 0;
  
  lines.push('## Translation Quality Report\n');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Files Checked | ${results.length} |`);
  lines.push(`| Average Score | ${avgScore}/100 |`);
  lines.push(`| Passed | ${passed} |`);
  lines.push(`| Warnings | ${warnings} |`);
  lines.push(`| Failed | ${failed} |`);
  lines.push('');
  
  if (failed > 0) {
    lines.push('### Failed Files\n');
    lines.push('| File | Score | Issues |');
    lines.push('|------|-------|--------|');
    
    for (const result of results.filter(r => r.status === 'fail')) {
      const shortPath = result.file.replace('i18n/', '').substring(0, 50);
      const topIssue = result.issues?.[0]?.description || result.summary || '';
      lines.push(`| ${shortPath} | ${result.score} | ${topIssue.substring(0, 40)} |`);
    }
    lines.push('');
  }
  
  if (warnings > 0 && warnings <= 5) {
    lines.push('### Warnings\n');
    lines.push('| File | Score | Summary |');
    lines.push('|------|-------|---------|');
    
    for (const result of results.filter(r => r.status === 'warning')) {
      const shortPath = result.file.replace('i18n/', '').substring(0, 50);
      lines.push(`| ${shortPath} | ${result.score} | ${(result.summary || '').substring(0, 40)} |`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable required');
    process.exit(1);
  }
  
  let files = [];
  let options = {
    skipBackTranslation: false,
    outputFormat: 'console'
  };
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--sample') {
      const count = parseInt(args[++i]) || 5;
      const locale = args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : null;
      files = await getSampleFiles(count, locale);
      console.log(`Selected ${files.length} random files for QA`);
    } else if (arg === '--changed') {
      files = await getChangedFiles();
      console.log(`Found ${files.length} changed files`);
    } else if (arg === '--structural-only') {
      options.skipBackTranslation = true;
    } else if (arg === '--github-summary') {
      options.outputFormat = 'github';
    } else if (arg === '--json') {
      options.outputFormat = 'json';
    } else if (!arg.startsWith('-')) {
      // Treat as file path or locale
      if (arg.includes('/')) {
        files.push(arg);
      } else {
        // It's a locale - get all files for that locale
        const localeFiles = await glob(`i18n/${arg}/docusaurus-plugin-content-docs/**/*.mdx`);
        files.push(...localeFiles);
      }
    }
  }
  
  if (files.length === 0) {
    console.log('Usage:');
    console.log('  node qa-translations.js <locale>              # All files for locale');
    console.log('  node qa-translations.js <file.mdx>            # Specific file');
    console.log('  node qa-translations.js --sample 5            # Random 5 files');
    console.log('  node qa-translations.js --sample 5 de         # Random 5 German files');
    console.log('  node qa-translations.js --changed             # Files changed in PR');
    console.log('  node qa-translations.js --structural-only ... # Skip back-translation');
    console.log('  node qa-translations.js --github-summary ...  # Output for GitHub Actions');
    process.exit(0);
  }
  
  console.log(`\nEvaluating ${files.length} files...\n`);
  
  const results = [];
  
  for (const file of files) {
    console.log(`Checking: ${file}`);
    const result = await evaluateFile(file, options);
    results.push(result);
    
    const icon = result.status === 'pass' ? '✅' : 
                 result.status === 'warning' ? '⚠️' : 
                 result.status === 'error' ? '❓' : '❌';
    console.log(`  ${icon} Score: ${result.score}/100\n`);
    
    // Rate limiting
    if (!options.skipBackTranslation) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Output results
  if (options.outputFormat === 'json') {
    console.log(JSON.stringify(results, null, 2));
  } else if (options.outputFormat === 'github') {
    const summary = formatGitHubSummary(results);
    console.log(summary);
    
    // Write to GITHUB_STEP_SUMMARY if available
    if (process.env.GITHUB_STEP_SUMMARY) {
      await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
    }
  } else {
    console.log(formatResults(results));
  }
  
  // Exit with error if any failures
  const failures = results.filter(r => r.status === 'fail');
  if (failures.length > 0) {
    process.exit(1);
  }
}

module.exports = {
  evaluateFile,
  backTranslate,
  evaluateSimilarity,
  validateStructure,
  formatResults,
  formatGitHubSummary,
  THRESHOLDS,
};

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
