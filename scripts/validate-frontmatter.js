#!/usr/bin/env node

// Validate and fix MDX frontmatter YAML
//
// Scans i18n MDX files for invalid YAML frontmatter and attempts to auto-fix
// common issues caused by AI translation (nested quotes, partial quoting, etc.)
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
 * Process a single file: validate and optionally fix
 * @param {string} filePath - Path to MDX file
 * @param {object} options - { fix: boolean }
 * @returns {{ status: 'valid'|'fixed'|'error', error?: string }}
 */
function processFile(filePath, options = { fix: true }) {
  const content = fs.readFileSync(filePath, 'utf8');

  // First, check if already valid
  const validation = validateFrontmatter(content);
  if (validation.valid) {
    return { status: 'valid' };
  }

  // Try to fix if enabled
  if (options.fix) {
    const result = fixFrontmatter(content);
    if (result.fixed) {
      fs.writeFileSync(filePath, result.content);
      return { status: 'fixed' };
    }
    return { status: 'error', error: result.error || validation.error };
  }

  return { status: 'error', error: validation.error };
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
  processFile,
  processFiles,
};
