#!/usr/bin/env node

// Fix broken anchor IDs in translated MDX files
//
// When headings are translated, Docusaurus generates different anchor IDs.
// This script adds explicit {#anchor-id} syntax to preserve original anchors.
//
// Usage:
//   node scripts/fix-anchor-ids.js [--dry-run] [locale]
//
// Examples:
//   node scripts/fix-anchor-ids.js           # Fix all locales
//   node scripts/fix-anchor-ids.js ar        # Fix Arabic only
//   node scripts/fix-anchor-ids.js --dry-run # Preview changes

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Convert heading text to Docusaurus anchor ID
// Matches Docusaurus's slugify behavior (preserves Unicode)
function textToAnchor(text) {
  return text
    .toLowerCase()
    // Keep alphanumeric (including Unicode letters), spaces, hyphens
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim hyphens
}

// Extract headings from MDX content
// Returns array of { level, text, anchor, line, hasExplicitId }
function extractHeadings(content) {
  const headings = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match markdown headings: ## Heading Text or ## Heading {#explicit-id}
    const match = line.match(/^(#{1,6})\s+(.+?)(?:\s*\{#([a-z0-9-]+)\})?\s*$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const explicitId = match[3];
      const anchor = explicitId || textToAnchor(text);

      headings.push({
        level,
        text,
        anchor,
        line: i,
        hasExplicitId: !!explicitId,
        raw: line,
      });
    }
  }

  return headings;
}

// Fix internal anchor links that were incorrectly translated
// e.g., ](#errores-de-tarjeta) should be ](#card-errors)
function fixInternalAnchorLinks(content, sourceAnchors, translatedHeadings) {
  // Build a map: what the anchor WOULD be (from heading text) → source anchor
  // This catches links that use translated heading slugs
  const anchorMap = new Map();
  for (let i = 0; i < translatedHeadings.length; i++) {
    const th = translatedHeadings[i];
    const sourceAnchor = sourceAnchors[i];
    if (!sourceAnchor) continue;

    // Compute what the anchor would be from the heading text alone
    const wouldBeAnchor = textToAnchor(th.text);

    // If it differs from the source anchor, map it
    if (wouldBeAnchor !== sourceAnchor) {
      anchorMap.set(wouldBeAnchor, sourceAnchor);
    }
  }

  if (anchorMap.size === 0) {
    return { modified: false, content, fixes: [] };
  }

  const fixes = [];
  let fixedContent = content;

  // Find all internal anchor links: ](#anchor-id)
  // Replace translated anchors with source anchors
  for (const [translatedAnchor, sourceAnchor] of anchorMap) {
    // Escape special regex characters in the anchor
    const escapedAnchor = translatedAnchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\]\\(#${escapedAnchor}\\)`, 'g');
    const matches = fixedContent.match(pattern);
    if (matches) {
      fixedContent = fixedContent.replace(pattern, `](#${sourceAnchor})`);
      fixes.push({
        type: 'link',
        from: `](#${translatedAnchor})`,
        to: `](#${sourceAnchor})`,
        count: matches.length,
      });
    }
  }

  return {
    modified: fixes.length > 0,
    content: fixedContent,
    fixes,
  };
}

// Add explicit anchor IDs to translated content based on source headings
function addAnchorIds(sourceContent, translatedContent) {
  const sourceHeadings = extractHeadings(sourceContent);
  const translatedHeadings = extractHeadings(translatedContent);

  // Skip if no headings or counts don't match
  if (sourceHeadings.length === 0 || translatedHeadings.length === 0) {
    return { modified: false, content: translatedContent, fixes: [] };
  }

  // Build a map of source anchors by position (level + index within level)
  const sourceByPosition = new Map();
  const levelCounts = {};
  for (const h of sourceHeadings) {
    levelCounts[h.level] = (levelCounts[h.level] || 0) + 1;
    const key = `${h.level}-${levelCounts[h.level]}`;
    sourceByPosition.set(key, h);
  }

  // Process translated headings
  const lines = translatedContent.split('\n');
  const fixes = [];
  const levelCountsT = {};
  const sourceAnchors = []; // Track source anchors in order

  for (const th of translatedHeadings) {
    // Find corresponding source heading by position
    levelCountsT[th.level] = (levelCountsT[th.level] || 0) + 1;
    const key = `${th.level}-${levelCountsT[th.level]}`;
    const sourceHeading = sourceByPosition.get(key);
    sourceAnchors.push(sourceHeading?.anchor);

    // Skip if already has explicit ID
    if (th.hasExplicitId) continue;

    if (!sourceHeading) continue;

    // Check if anchors differ
    const translatedAnchor = textToAnchor(th.text);
    if (translatedAnchor !== sourceHeading.anchor) {
      // Add explicit ID
      const newLine = `${'#'.repeat(th.level)} ${th.text} {#${sourceHeading.anchor}}`;
      lines[th.line] = newLine;
      fixes.push({
        type: 'heading',
        line: th.line + 1,
        from: th.raw,
        to: newLine,
        anchor: sourceHeading.anchor,
      });
    }
  }

  let resultContent = lines.join('\n');

  // Also fix internal anchor links
  const linkResult = fixInternalAnchorLinks(
    resultContent,
    sourceAnchors,
    translatedHeadings
  );
  if (linkResult.modified) {
    resultContent = linkResult.content;
    fixes.push(...linkResult.fixes);
  }

  if (fixes.length === 0) {
    return { modified: false, content: translatedContent, fixes: [] };
  }

  return { modified: true, content: resultContent, fixes };
}

// Get source file path for a translated file
function getSourcePath(translatedPath) {
  // i18n/{locale}/docusaurus-plugin-content-docs/version-1.x/path/file.mdx
  // -> versioned_docs/version-1.x/path/file.mdx
  const match = translatedPath.match(
    /i18n\/[^/]+\/docusaurus-plugin-content-docs\/(version-[^/]+)\/(.+)$/
  );
  if (match) {
    return path.join('versioned_docs', match[1], match[2]);
  }

  // i18n/{locale}/docusaurus-plugin-content-docs/current/path/file.mdx
  // -> docs/path/file.mdx
  const currentMatch = translatedPath.match(
    /i18n\/[^/]+\/docusaurus-plugin-content-docs\/current\/(.+)$/
  );
  if (currentMatch) {
    return path.join('docs', currentMatch[1]);
  }

  return null;
}

// Process a single file
function processFile(translatedPath, options = { dryRun: false }) {
  const sourcePath = getSourcePath(translatedPath);
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return { status: 'skip', reason: 'no-source' };
  }

  const sourceContent = fs.readFileSync(sourcePath, 'utf8');
  const translatedContent = fs.readFileSync(translatedPath, 'utf8');

  const result = addAnchorIds(sourceContent, translatedContent);

  if (!result.modified) {
    return { status: 'ok', fixes: 0 };
  }

  if (!options.dryRun) {
    fs.writeFileSync(translatedPath, result.content);
  }

  return { status: 'fixed', fixes: result.fixes };
}

// Process all translation files
function processAll(options = { dryRun: false, locale: null, quiet: false }) {
  const pattern = options.locale
    ? `i18n/${options.locale}/docusaurus-plugin-content-docs/**/*.mdx`
    : 'i18n/*/docusaurus-plugin-content-docs/**/*.mdx';

  const files = glob.sync(pattern);
  const results = { ok: 0, fixed: 0, skipped: 0, totalFixes: 0, details: [] };

  for (const file of files) {
    const result = processFile(file, options);

    switch (result.status) {
      case 'ok':
        results.ok++;
        break;
      case 'fixed':
        results.fixed++;
        results.totalFixes += result.fixes.length;
        if (!options.quiet) {
          console.log(`🔧 ${file}`);
          result.fixes.forEach((f) => {
            if (f.type === 'link') {
              console.log(`   Link: ${f.from} → ${f.to} (${f.count}x)`);
            } else {
              console.log(`   L${f.line}: Added {#${f.anchor}}`);
            }
          });
        }
        results.details.push({ file, fixes: result.fixes });
        break;
      case 'skip':
        results.skipped++;
        break;
    }
  }

  return results;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const quiet = args.includes('--quiet');
  const locale = args.find((a) => !a.startsWith('--'));

  console.log('Fixing anchor IDs in translated files...');
  if (dryRun) console.log('(Dry run - no files will be modified)\n');
  if (locale) console.log(`Locale: ${locale}\n`);

  const results = processAll({ dryRun, locale, quiet });

  console.log('\n--- Summary ---');
  console.log(`✅ Already OK: ${results.ok}`);
  console.log(`🔧 Fixed: ${results.fixed} files (${results.totalFixes} headings)`);
  console.log(`⏭️  Skipped: ${results.skipped} (no source file)`);
}

// Export for testing
module.exports = {
  textToAnchor,
  extractHeadings,
  fixInternalAnchorLinks,
  addAnchorIds,
  getSourcePath,
  processFile,
  processAll,
};
