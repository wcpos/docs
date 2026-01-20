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

// Quality thresholds (strict for technical docs - we want 100%)
const THRESHOLDS = {
  pass: 100,     // Only 100% is truly passing
  warning: 90,   // 90-99 needs correction
  fail: 0,       // < 90 is failing
};

/**
 * Generate a corrected translation based on issues found
 * Uses gpt-4o (not mini) for higher accuracy corrections
 */
async function generateCorrection(original, currentTranslation, issues, locale) {
  const localeName = LOCALE_NAMES[locale] || locale;
  
  // Include ALL issues, not just medium/high - we want 100% accuracy
  const issuesList = issues
    .map(i => `- [${i.severity}] ${i.type}: ${i.description}${i.original_excerpt ? `\n  Original: "${i.original_excerpt}"` : ''}${i.backtranslated_excerpt ? `\n  Back-translated: "${i.backtranslated_excerpt}"` : ''}`)
    .join('\n');
  
  if (!issuesList || issues.length === 0) {
    return null; // No issues to fix
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',  // Use full gpt-4o for better accuracy
    max_tokens: 16384,
    messages: [
      {
        role: 'system',
        content: `You are an expert technical documentation translator specializing in ${localeName}. Your task is to produce a PERFECT translation that will score 100% on quality checks.

ACCURACY REQUIREMENTS:
1. **Semantic fidelity**: The meaning must be IDENTICAL to the English original
2. **Technical terms**: Must match exactly (e.g., "Date Created" = "Date Created" concept, not "Creation Date")
3. **UI labels**: Translate consistently - same English term = same translated term throughout
4. **Completeness**: Every sentence, bullet point, and detail must be present
5. **Structure**: Preserve all markdown, code blocks, links, admonitions exactly

WHAT TO PRESERVE UNCHANGED:
- All URLs and paths in links: [text](/path) - only translate "text"
- All code in backticks: \`code\` stays as \`code\`
- All code blocks: \`\`\`....\`\`\` copied exactly
- Import statements
- Component names: <Icon name="x" />
- Frontmatter keys (only translate title, sidebar_label, description values)

OUTPUT: The complete corrected ${localeName} document, starting with --- (frontmatter). No explanations.`
      },
      {
        role: 'user',
        content: `ORIGINAL ENGLISH DOCUMENT:
${original}

---

CURRENT ${localeName.toUpperCase()} TRANSLATION (needs correction):
${currentTranslation}

---

ISSUES IDENTIFIED BY QA:
${issuesList}

---

Produce a corrected ${localeName} translation that fixes ALL issues above. The goal is 100% accuracy.`
      }
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
 * Back-translate content to English
 * Uses gpt-4o for accurate back-translation
 */
async function backTranslate(content, fromLocale) {
  const localeName = LOCALE_NAMES[fromLocale] || fromLocale;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',  // Use full model for accurate back-translation
    max_tokens: 16384,
    messages: [
      { 
        role: 'system', 
        content: `You are a professional translator performing back-translation for quality assurance. Translate the ${localeName} content back to English as LITERALLY as possible while maintaining readability.

IMPORTANT: Translate literally to reveal any semantic drift in the original translation. If the ${localeName} says "Creation Date", translate it as "Creation Date" (not "Date Created") so we can detect the difference.

Preserve all markdown formatting, code blocks, and structure exactly. Output ONLY the back-translated content.`
      },
      { 
        role: 'user', 
        content: `Back-translate this ${localeName} document to English:\n\n${content}`
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
 * Uses gpt-4o for thorough evaluation
 */
async function evaluateSimilarity(original, backTranslated) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',  // Use full model for accurate evaluation
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a STRICT translation quality evaluator for technical documentation. Compare the original English with a back-translated version.

BE STRICT: Technical docs require 100% accuracy. Flag ANY difference, no matter how small.

Score each category 0-100:
- semantic_fidelity: Does EVERY sentence mean exactly the same thing?
- completeness: Is EVERY piece of information present? Every bullet, every detail?
- technical_accuracy: Are ALL technical terms, UI labels, and feature names identical?

For 100% score, the back-translation should be nearly identical to the original.

Output JSON:
{
  "semantic_fidelity": <0-100>,
  "completeness": <0-100>,
  "technical_accuracy": <0-100>,
  "issues": [
    {
      "type": "missing_content" | "semantic_drift" | "technical_error" | "truncation" | "hallucination" | "term_inconsistency",
      "severity": "high" | "medium" | "low",
      "description": "Specific description of the problem",
      "original_excerpt": "exact text from original",
      "backtranslated_excerpt": "exact text from back-translation"
    }
  ],
  "summary": "One sentence assessment"
}

SEVERITY GUIDE:
- high: Missing content, wrong meaning, technical errors
- medium: Term inconsistencies, phrasing that changes nuance  
- low: Minor word order differences that don't affect meaning`
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

Evaluate strictly. List ALL differences, even minor ones. We want 100% accuracy.`
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
  
  const result = {
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
  
  // Generate correction if requested and score is not perfect
  if (options.generateFixes && (score < 100 || allIssues.length > 0)) {
    try {
      console.log('  Generating correction...');
      const correction = await generateCorrection(original, translated, allIssues, locale);
      if (correction) {
        result.correction = correction;
        result.hasCorrection = true;
      }
    } catch (error) {
      console.warn(`  ⚠️ Could not generate correction: ${error.message}`);
    }
  }
  
  return result;
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
 * Write corrections to files
 */
async function writeCorrections(results, outputDir = null) {
  const corrections = results.filter(r => r.hasCorrection && r.correction);
  
  if (corrections.length === 0) {
    console.log('\nNo corrections to write.');
    return [];
  }
  
  const written = [];
  
  for (const result of corrections) {
    const targetPath = outputDir 
      ? path.join(outputDir, result.file)
      : result.file;
    
    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, result.correction);
      written.push(targetPath);
      console.log(`  ✓ Wrote correction: ${targetPath}`);
    } catch (error) {
      console.error(`  ❌ Failed to write ${targetPath}: ${error.message}`);
    }
  }
  
  return written;
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
    outputFormat: 'console',
    generateFixes: false,
    applyFixes: false,
    fixOutputDir: null
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
    } else if (arg === '--fix') {
      options.generateFixes = true;
    } else if (arg === '--apply-fixes') {
      options.generateFixes = true;
      options.applyFixes = true;
    } else if (arg === '--fix-output') {
      options.generateFixes = true;
      options.fixOutputDir = args[++i];
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
    console.log('');
    console.log('Fix options:');
    console.log('  node qa-translations.js --fix ...             # Generate corrections (show only)');
    console.log('  node qa-translations.js --apply-fixes ...     # Generate and apply corrections in-place');
    console.log('  node qa-translations.js --fix-output <dir> ...# Write corrections to separate directory');
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
  
  // Handle corrections
  const correctionsNeeded = results.filter(r => r.hasCorrection);
  
  if (options.generateFixes && correctionsNeeded.length > 0) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`CORRECTIONS GENERATED: ${correctionsNeeded.length} files`);
    console.log('='.repeat(70));
    
    if (options.applyFixes) {
      console.log('\nApplying corrections in-place...');
      const written = await writeCorrections(results);
      console.log(`\n✓ Applied ${written.length} corrections`);
    } else if (options.fixOutputDir) {
      console.log(`\nWriting corrections to ${options.fixOutputDir}...`);
      const written = await writeCorrections(results, options.fixOutputDir);
      console.log(`\n✓ Wrote ${written.length} corrections to ${options.fixOutputDir}`);
    } else {
      console.log('\nCorrections generated but not applied.');
      console.log('Use --apply-fixes to apply in-place, or --fix-output <dir> to write to a separate directory.');
      
      // Show preview of what would change
      for (const result of correctionsNeeded) {
        console.log(`\n📝 ${result.file} (score: ${result.score}/100)`);
        console.log('   Issues fixed:');
        for (const issue of result.issues.filter(i => i.severity !== 'low').slice(0, 3)) {
          console.log(`   - ${issue.description}`);
        }
      }
    }
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
