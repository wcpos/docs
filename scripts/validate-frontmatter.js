#!/usr/bin/env node

// Validate and fix MDX translation issues
//
// Scans i18n MDX files for common AI translation errors:
// - Invalid YAML frontmatter (nested quotes, partial quoting)
// - Broken markdown links (double parentheses, double brackets)
//
// Usage:
//   node scripts/validate-frontmatter.js [--fix] [--check] [--changed] [--quiet] [glob-pattern]
//
// Read-only by default — writes are opt-in via --fix.
//
// Options:
//   --fix      Auto-fix issues in place (the ONLY flag that writes files)
//   --check    Read-only enforcement; report problems and exit 1 (this is the default)
//   --changed  Scope to files changed vs BASE_REF (default origin/main) instead of the glob
//   --quiet    Only output errors
//
// Examples:
//   node scripts/validate-frontmatter.js                    # Validate all (read-only), exit 1 on problems
//   node scripts/validate-frontmatter.js --fix              # Validate and fix all in place
//   node scripts/validate-frontmatter.js --check --changed  # CI gate: enforce on a PR's own files
//   node scripts/validate-frontmatter.js "i18n/es/**/*.mdx" # Specific locale (read-only)

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
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
 * Fix missing closing --- in frontmatter
 *
 * Problem: Frontmatter starts with --- but is missing the closing ---
 * This often happens when AI translations lose the delimiter.
 *
 * @param {string} content - Full MDX file content
 * @returns {{ fixed: boolean, content: string }}
 */
function fixMissingClosingDelimiter(content) {
  // Check if we have opening --- but no closing ---
  if (!content.startsWith('---\n')) {
    return { fixed: false, content };
  }

  // Check if frontmatter is already valid
  const validFm = content.match(/^---\n[\s\S]*?\n---/);
  if (validFm) {
    return { fixed: false, content };
  }

  // Find where frontmatter likely ends:
  // Look for first 'import' statement or first component/heading
  const lines = content.split('\n');
  let fmEndLine = -1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Frontmatter ends when we hit:
    // - import statement
    // - JSX component (<...)
    // - markdown heading (##)
    // - another --- (correctly placed closing)
    if (
      line.startsWith('import ') ||
      line.startsWith('<') ||
      line.startsWith('#') ||
      line === '---'
    ) {
      fmEndLine = i;
      break;
    }
  }

  if (fmEndLine === -1) {
    return { fixed: false, content };
  }

  // Insert closing --- before the content line
  lines.splice(fmEndLine, 0, '---');

  return { fixed: true, content: lines.join('\n') };
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
  let workingContent = content;
  let wasFixed = false;

  // First, try to fix missing closing delimiter
  const delimiterResult = fixMissingClosingDelimiter(workingContent);
  if (delimiterResult.fixed) {
    workingContent = delimiterResult.content;
    wasFixed = true;
  }

  const frontmatter = extractFrontmatter(workingContent);
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
    const fixedContent = workingContent.replace(
      /^---\n[\s\S]*?\n---/,
      `---\n${fixedFm}\n---`
    );

    // Double-check with gray-matter
    matter(fixedContent);

    // Check if we actually made any string fixes
    if (fixedFm !== frontmatter) {
      wasFixed = true;
    }

    return { fixed: wasFixed, content: fixedContent };
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
 * Canonicalize the `description` frontmatter value to a single enforced form:
 * a double-quoted scalar (JSON-style escaping, which is valid YAML).
 *
 * This is the ONE policy. It is deterministic and idempotent, so the translation
 * pipeline, the QA pass, and CI all converge on the same output instead of
 * drifting between quoted and unquoted forms run-to-run. As a side effect it
 * repairs the most common build-breaker: an unquoted description whose value
 * contains a colon (e.g. `description: ...WCPOS: foo`), which YAML otherwise
 * parses as a mapping pair and fails the build.
 *
 * Only single-line descriptions are normalised; YAML block scalars (`>`/`|`)
 * are left untouched.
 *
 * @param {string} content - Full MDX file content
 * @returns {{ changed: boolean, content: string }}
 */
function canonicalizeDescriptionQuoting(content) {
  const frontmatter = extractFrontmatter(content);
  if (frontmatter === null) {
    return { changed: false, content };
  }

  const lines = frontmatter.split('\n');
  const descLineIdxs = lines
    .map((line, i) => (/^description:/.test(line) ? i : -1))
    .filter((i) => i !== -1);

  // Operate only on a single, top-level description line. Zero or multiple
  // matches means there is nothing to do or the frontmatter is shaped in a way
  // we can't safely reason about line-by-line.
  if (descLineIdxs.length !== 1) {
    return { changed: false, content };
  }
  const idx = descLineIdxs[0];
  const raw = lines[idx].slice('description:'.length).trim();

  // Leave empty values and YAML block scalars (`>`/`|`) alone — out of scope.
  if (raw === '' || raw.startsWith('>') || raw.startsWith('|')) {
    return { changed: false, content };
  }

  // Resolve the intended string value. Prefer the value as parsed by YAML (the
  // source of truth); fall back to the literal raw text only when the
  // frontmatter doesn't parse (the unquoted-colon break we want to repair).
  let value;
  let parsedDescription;
  try {
    const data = yaml.load(frontmatter);
    if (data && typeof data === 'object' && typeof data.description === 'string') {
      parsedDescription = data.description;
    }
  } catch {
    // Invalid YAML — handled by the literal fallback below.
  }

  if (parsedDescription !== undefined) {
    value = parsedDescription;
  } else {
    // Frontmatter doesn't parse, OR `description` isn't a clean string (e.g. a
    // mangled title that absorbed the description across lines). Take the raw
    // line literally; the validity guard below rejects anything unsafe.
    const isQuoted =
      raw.length >= 2 &&
      ((raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'")));
    value = isQuoted ? raw.slice(1, -1) : raw;
  }

  const canonicalLine = `description: ${JSON.stringify(value)}`;
  if (canonicalLine === lines[idx]) {
    return { changed: false, content };
  }

  const newLines = lines.slice();
  newLines[idx] = canonicalLine;
  const newFrontmatter = newLines.join('\n');

  // Safety guard: never emit invalid YAML, and never silently change the
  // meaning of the description. If the rewrite doesn't parse cleanly to the
  // same value, leave the file untouched for the build gate to surface.
  try {
    const reparsed = yaml.load(newFrontmatter);
    if (!reparsed || typeof reparsed.description !== 'string') {
      return { changed: false, content };
    }
    if (parsedDescription !== undefined && reparsed.description !== parsedDescription) {
      return { changed: false, content };
    }
  } catch {
    return { changed: false, content };
  }

  const newContent = content.replace(
    /^---\n[\s\S]*?\n---/,
    `---\n${newFrontmatter}\n---`
  );
  return { changed: true, content: newContent };
}

/**
 * Process a single file: validate and optionally fix
 * @param {string} filePath - Path to MDX file
 * @param {object} options - { fix: boolean, check: boolean }
 * @returns {{ status: 'valid'|'fixed'|'error', error?: string, fixes?: string[] }}
 */
function processFile(filePath, options = { fix: true }) {
  let content = fs.readFileSync(filePath, 'utf8');
  let wasFixed = false;
  const allFixes = [];

  // 0. Enforce the description quoting policy (always double-quoted). Runs first
  //    because it also repairs the unquoted-colon break that the targeted YAML
  //    fixers below do not handle.
  const canon = canonicalizeDescriptionQuoting(content);
  if (canon.changed) {
    if (options.check) {
      return {
        status: 'error',
        error:
          'description not in canonical double-quoted form (run: node scripts/validate-frontmatter.js --fix)',
      };
    }
    if (options.fix) {
      content = canon.content;
      wasFixed = true;
      allFixes.push('description-quoting');
    }
  }

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
 * Process an explicit list of files.
 * @param {string[]} files - File paths
 * @param {object} options - { fix: boolean, quiet: boolean, check: boolean }
 * @returns {{ valid: number, fixed: number, errors: Array<{file: string, error: string}> }}
 */
function processFileList(files, options = { fix: true, quiet: false }) {
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

/**
 * Process multiple files matching a glob pattern
 * @param {string} pattern - Glob pattern
 * @param {object} options - { fix: boolean, quiet: boolean, check: boolean }
 * @returns {{ valid: number, fixed: number, errors: Array<{file: string, error: string}> }}
 */
function processFiles(pattern, options = { fix: true, quiet: false }) {
  return processFileList(glob.sync(pattern), options);
}

/**
 * Content (md/mdx) files changed in this branch vs a base ref. Mirrors the
 * `--changed` discovery in check-translation-completeness.js so the CI gate
 * only enforces the quoting policy on what a PR actually touches — never the
 * whole-corpus backlog.
 * @param {string} baseRef - e.g. 'origin/main'
 * @returns {string[]}
 */
function gitChangedContentFiles(baseRef) {
  const out = execFileSync(
    'git',
    [
      'diff',
      '--name-only',
      '--diff-filter=ACMR',
      `${baseRef}...HEAD`,
      '--',
      'docs/**/*.md',
      'docs/**/*.mdx',
      'versioned_docs/**/*.md',
      'versioned_docs/**/*.mdx',
      'i18n/**/*.mdx',
    ],
    { encoding: 'utf8' }
  );
  return out.split('\n').map((l) => l.trim()).filter(Boolean);
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  // Writes are OPT-IN: only --fix rewrites files. Without it the script is
  // read-only. This is what stops a bare invocation — or the
  // `translations:validate` npm alias — from silently rewriting hundreds of
  // files just because someone ran something called "validate".
  const fix = args.includes('--fix');
  // Everything else is read-only enforcement (this is also what --check selects):
  // report any file not already in canonical form (or otherwise invalid) as an
  // error → exit 1. --check is kept as an explicit synonym for clarity in CI.
  const check = !fix;
  // --changed: scope to files changed vs BASE_REF (default origin/main), so the
  // CI gate enforces the policy on a PR's own files, not the whole-corpus backlog.
  const changed = args.includes('--changed');
  const quiet = args.includes('--quiet');

  let files;
  let label;
  if (changed) {
    const baseRef = process.env.BASE_REF || 'origin/main';
    files = gitChangedContentFiles(baseRef);
    label = `${files.length} changed file(s) vs ${baseRef}`;
  } else {
    const pattern = args.find((a) => !a.startsWith('--')) || 'i18n/**/*.mdx';
    files = glob.sync(pattern);
    label = pattern;
  }

  if (!quiet) {
    console.log(`Validating MDX frontmatter: ${label}`);
    console.log(`Mode: ${fix ? 'fix (writes files)' : 'check (read-only)'}\n`);
  }

  const results = processFileList(files, { fix, quiet, check });

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
  fixMissingClosingDelimiter,
  fixSingleQuotedStrings,
  fixPartialQuoting,
  fixBackslashEscapedQuotes,
  fixFrontmatter,
  canonicalizeDescriptionQuoting,
  findBrokenLinks,
  fixBrokenLinks,
  processFile,
  processFiles,
};
