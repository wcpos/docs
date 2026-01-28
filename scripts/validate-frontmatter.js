#!/usr/bin/env node

// Validate and fix MDX translation issues
//
// Scans i18n MDX files for common AI translation errors:
// - Invalid YAML frontmatter (nested quotes, partial quoting)
// - Broken markdown links (double parentheses, double brackets)
//
// Usage:
//   node scripts/validate-frontmatter.js [--fix] [--quiet] [glob-pattern]
//
// Options:
//   --fix     Auto-fix issues (default: true)
//   --no-fix  Only validate, don't fix
//   --quiet   Only output errors
//
// Examples:
//   node scripts/validate-frontmatter.js                    # Validate and fix all
//   node scripts/validate-frontmatter.js --no-fix           # Validate only
//   node scripts/validate-frontmatter.js "i18n/es/**/*.mdx" # Specific locale

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');
const glob = require('glob');

/**
 * Check if frontmatter YAML is valid
 * @param {string} content - Full MDX file content
 * @returns {{ valid: boolean, error?: string }}
 */
function validateFrontmatter(content) {
  try {
    matter(content);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Extract frontmatter string from MDX content
 * @param {string} content - Full MDX file content
 * @returns {string|null} - Frontmatter string (without ---) or null
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

/**
 * Fix single-quoted YAML strings containing unescaped internal quotes
 *
 * Problem: title: 'Text with 'nested' quotes'
 * Fix:     title: "Text with 'nested' quotes"
 *
 * @param {string} frontmatter - Frontmatter string
 * @returns {string} - Fixed frontmatter
 */
function fixSingleQuotedStrings(frontmatter) {
  return frontmatter.replace(
    /^(\w+):\s*'(.*)'$/gm,
    (match, key, value) => {
      // Check for unescaped internal single quotes (not doubled)
      if (value.includes("'") && !value.includes("''")) {
        // Convert to double-quoted, escaping any internal double quotes
        const escapedValue = value.replace(/"/g, '\\"');
        return `${key}: "${escapedValue}"`;
      }
      return match;
    }
  );
}

/**
 * Fix partial quoting where only part of a value is quoted
 *
 * Problem: title: "Quoted part" rest of title
 * Fix:     title: "\"Quoted part\" rest of title"
 *
 * @param {string} frontmatter - Frontmatter string
 * @returns {string} - Fixed frontmatter
 */
function fixPartialQuoting(frontmatter) {
  return frontmatter.replace(
    /^(\w+):\s*"([^"]+)"\s+(.+)$/gm,
    (match, key, quoted, rest) => {
      // Wrap entire value in double quotes, escape the internal quotes
      return `${key}: "\\"${quoted}\\" ${rest}"`;
    }
  );
}

/**
 * Fix backslash-escaped quotes in single-quoted strings (invalid YAML)
 *
 * Problem: title: 'Text with \'escaped\' quotes'
 * Fix:     title: "Text with 'escaped' quotes"
 *
 * @param {string} frontmatter - Frontmatter string
 * @returns {string} - Fixed frontmatter
 */
function fixBackslashEscapedQuotes(frontmatter) {
  return frontmatter.replace(
    /^(\w+):\s*'(.*)\\['"](.*)'/gm,
    (match, key, before, after) => {
      // Remove backslashes and convert to double-quoted
      const value = match
        .slice(match.indexOf("'") + 1, -1)
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');
      const escapedValue = value.replace(/"/g, '\\"');
      return `${key}: "${escapedValue}"`;
    }
  );
}

/**
 * Attempt to fix common frontmatter YAML issues
 * @param {string} content - Full MDX file content
 * @returns {{ fixed: boolean, content: string, error?: string }}
 */
function fixFrontmatter(content) {
  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) {
    return { fixed: false, content, error: 'No frontmatter found' };
  }

  // Apply fixes in sequence
  let fixedFm = frontmatter;
  fixedFm = fixBackslashEscapedQuotes(fixedFm);
  fixedFm = fixSingleQuotedStrings(fixedFm);
  fixedFm = fixPartialQuoting(fixedFm);

  // Verify the fix worked
  try {
    yaml.load(fixedFm);
    const fixedContent = content.replace(
      /^---\n[\s\S]*?\n---/,
      `---\n${fixedFm}\n---`
    );

    // Double-check with gray-matter
    matter(fixedContent);

    return { fixed: true, content: fixedContent };
  } catch (error) {
    return { fixed: false, content, error: error.message };
  }
}

/**
 * Find broken markdown links in content
 *
 * Detects common AI translation errors:
 * - Double parentheses: ]((url))
 * - Double brackets: [[text]](url)
 * - Space before parenthesis: ] (url)
 *
 * @param {string} content - MDX content
 * @returns {Array<{pattern: string, matches: string[]}>}
 */
function findBrokenLinks(content) {
  const issues = [];

  // Double parentheses: ]((url))
  const doubleParens = content.match(/\]\(\([^)]+\)\)/g);
  if (doubleParens) {
    issues.push({ pattern: 'double-parentheses', matches: doubleParens });
  }

  // Double brackets: [[text]](url)
  const doubleBrackets = content.match(/\[\[[^\]]+\]\]\([^)]+\)/g);
  if (doubleBrackets) {
    issues.push({ pattern: 'double-brackets', matches: doubleBrackets });
  }

  // Space before parenthesis: ] (url) - but not ]( which is valid
  const spacedLinks = content.match(/\]\s+\([^)]+\)/g);
  if (spacedLinks) {
    issues.push({ pattern: 'space-before-paren', matches: spacedLinks });
  }

  return issues;
}

/**
 * Fix broken markdown links
 *
 * @param {string} content - MDX content
 * @returns {{ fixed: boolean, content: string, fixes: string[] }}
 */
function fixBrokenLinks(content) {
  let fixedContent = content;
  const fixes = [];

  // Fix double parentheses: ]((url)) → ](url)
  const doubleParensFixed = fixedContent.replace(
    /\]\(\(([^)]+)\)\)/g,
    (match, url) => {
      fixes.push(`Double parens: ${match} → ](${url})`);
      return `](${url})`;
    }
  );
  if (doubleParensFixed !== fixedContent) {
    fixedContent = doubleParensFixed;
  }

  // Fix double brackets: [[text]](url) → [text](url)
  const doubleBracketsFixed = fixedContent.replace(
    /\[\[([^\]]+)\]\]\(([^)]+)\)/g,
    (match, text, url) => {
      fixes.push(`Double brackets: ${match} → [${text}](${url})`);
      return `[${text}](${url})`;
    }
  );
  if (doubleBracketsFixed !== fixedContent) {
    fixedContent = doubleBracketsFixed;
  }

  // Fix space before parenthesis: ] (url) → ](url)
  const spacedFixed = fixedContent.replace(
    /\]\s+\(([^)]+)\)/g,
    (match, url) => {
      fixes.push(`Space before paren: ${match.trim()} → ](${url})`);
      return `](${url})`;
    }
  );
  if (spacedFixed !== fixedContent) {
    fixedContent = spacedFixed;
  }

  return {
    fixed: fixes.length > 0,
    content: fixedContent,
    fixes,
  };
}

/**
 * Process a single file: validate and optionally fix
 * @param {string} filePath - Path to MDX file
 * @param {object} options - { fix: boolean }
 * @returns {{ status: 'valid'|'fixed'|'error', error?: string, fixes?: string[] }}
 */
function processFile(filePath, options = { fix: true }) {
  let content = fs.readFileSync(filePath, 'utf8');
  let wasFixed = false;
  const allFixes = [];

  // 1. Check and fix frontmatter
  const fmValidation = validateFrontmatter(content);
  if (!fmValidation.valid) {
    if (options.fix) {
      const result = fixFrontmatter(content);
      if (result.fixed) {
        content = result.content;
        wasFixed = true;
        allFixes.push('frontmatter');
      } else {
        return { status: 'error', error: result.error || fmValidation.error };
      }
    } else {
      return { status: 'error', error: fmValidation.error };
    }
  }

  // 2. Check and fix broken links
  const linkIssues = findBrokenLinks(content);
  if (linkIssues.length > 0) {
    if (options.fix) {
      const result = fixBrokenLinks(content);
      if (result.fixed) {
        content = result.content;
        wasFixed = true;
        allFixes.push(...result.fixes);
      }
    } else {
      const errorMsg = linkIssues
        .map((i) => `${i.pattern}: ${i.matches.join(', ')}`)
        .join('; ');
      return { status: 'error', error: `Broken links: ${errorMsg}` };
    }
  }

  // Write if any fixes were applied
  if (wasFixed) {
    fs.writeFileSync(filePath, content);
    return { status: 'fixed', fixes: allFixes };
  }

  return { status: 'valid' };
}

/**
 * Process multiple files matching a glob pattern
 * @param {string} pattern - Glob pattern
 * @param {object} options - { fix: boolean, quiet: boolean }
 * @returns {{ valid: number, fixed: number, errors: Array<{file: string, error: string}> }}
 */
function processFiles(pattern, options = { fix: true, quiet: false }) {
  const files = glob.sync(pattern);
  const results = { valid: 0, fixed: 0, errors: [] };

  for (const file of files) {
    const result = processFile(file, options);
    switch (result.status) {
      case 'valid':
        results.valid++;
        break;
      case 'fixed':
        results.fixed++;
        if (!options.quiet) {
          console.log(`🔧 Fixed: ${file}`);
        }
        break;
      case 'error':
        results.errors.push({ file, error: result.error });
        break;
    }
  }

  return results;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const fix = !args.includes('--no-fix');
  const quiet = args.includes('--quiet');
  const pattern =
    args.find((a) => !a.startsWith('--')) || 'i18n/**/*.mdx';

  if (!quiet) {
    console.log(`Validating MDX frontmatter: ${pattern}`);
    console.log(`Auto-fix: ${fix ? 'enabled' : 'disabled'}\n`);
  }

  const results = processFiles(pattern, { fix, quiet });

  const total = results.valid + results.fixed + results.errors.length;

  if (!quiet || results.errors.length > 0) {
    console.log(`\n✅ Valid: ${results.valid}`);
    if (results.fixed > 0) {
      console.log(`🔧 Fixed: ${results.fixed}`);
    }
    if (results.errors.length > 0) {
      console.log(`❌ Errors: ${results.errors.length}`);
      results.errors.forEach((e) => {
        console.log(`   ${e.file}`);
        console.log(`   └─ ${e.error.split('\n')[0]}`);
      });
    }
    console.log(`\nTotal: ${total} files`);
  }

  // Exit with error code if there are unfixed errors
  if (results.errors.length > 0) {
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  validateFrontmatter,
  extractFrontmatter,
  fixSingleQuotedStrings,
  fixPartialQuoting,
  fixBackslashEscapedQuotes,
  fixFrontmatter,
  findBrokenLinks,
  fixBrokenLinks,
  processFile,
  processFiles,
};
