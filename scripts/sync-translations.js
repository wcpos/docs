#!/usr/bin/env node

/**
 * Translation Sync Script
 * 
 * Ensures translation files stay in sync with English source files:
 * 1. Removes orphaned translations (no English source)
 * 2. Reports missing translations (English exists but no translation)
 * 3. Can be run as part of build or CI
 * 
 * Usage:
 *   node scripts/sync-translations.js              # Dry run (report only)
 *   node scripts/sync-translations.js --clean      # Remove orphaned files
 *   node scripts/sync-translations.js --locale es  # Check specific locale
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

const LOCALES = ['es', 'fr', 'de', 'ja', 'pt-BR', 'ko', 'it', 'ar', 'hi-IN', 'zh-CN'];

const VERSIONED_DOCS_PATH = 'versioned_docs';
const I18N_PATH = 'i18n';

/**
 * Get all English source files for a version
 */
async function getEnglishSourceFiles(version) {
  const pattern = `${VERSIONED_DOCS_PATH}/${version}/**/*.mdx`;
  const files = await glob(pattern);
  return files.map(f => f.replace(`${VERSIONED_DOCS_PATH}/${version}/`, ''));
}

/**
 * Get all translated files for a locale and version
 */
async function getTranslatedFiles(locale, version) {
  const pattern = `${I18N_PATH}/${locale}/docusaurus-plugin-content-docs/${version}/**/*.mdx`;
  const files = await glob(pattern);
  return files.map(f => f.replace(`${I18N_PATH}/${locale}/docusaurus-plugin-content-docs/${version}/`, ''));
}

/**
 * Get all JSON translation files for a locale
 */
async function getJsonTranslations(locale) {
  const pattern = `${I18N_PATH}/${locale}/**/*.json`;
  return await glob(pattern);
}

/**
 * Get English JSON source files
 */
async function getEnglishJsonFiles() {
  const pattern = `${I18N_PATH}/en/**/*.json`;
  return await glob(pattern);
}

/**
 * Find orphaned and missing translations for a locale
 */
async function analyseLocale(locale, version) {
  const englishFiles = new Set(await getEnglishSourceFiles(version));
  const translatedFiles = new Set(await getTranslatedFiles(locale, version));
  
  const orphaned = [];
  const missing = [];
  
  // Find orphaned translations (exist in locale but not in English)
  for (const file of translatedFiles) {
    if (!englishFiles.has(file)) {
      orphaned.push(file);
    }
  }
  
  // Find missing translations (exist in English but not in locale)
  for (const file of englishFiles) {
    if (!translatedFiles.has(file)) {
      missing.push(file);
    }
  }
  
  return { orphaned, missing, total: translatedFiles.size };
}

/**
 * Remove orphaned files
 */
async function removeOrphanedFiles(locale, version, orphanedFiles) {
  const removed = [];
  
  for (const file of orphanedFiles) {
    const fullPath = path.join(
      I18N_PATH,
      locale,
      'docusaurus-plugin-content-docs',
      version,
      file
    );
    
    try {
      await fs.unlink(fullPath);
      removed.push(fullPath);
    } catch (error) {
      console.error(`  Failed to remove ${fullPath}: ${error.message}`);
    }
  }
  
  // Clean up empty directories
  await cleanEmptyDirs(path.join(I18N_PATH, locale, 'docusaurus-plugin-content-docs', version));
  
  return removed;
}

/**
 * Recursively remove empty directories
 */
async function cleanEmptyDirs(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await cleanEmptyDirs(path.join(dir, entry.name));
      }
    }
    
    // Check again after cleaning subdirs
    const remaining = await fs.readdir(dir);
    if (remaining.length === 0) {
      await fs.rmdir(dir);
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
}

/**
 * Get available versions
 */
async function getVersions() {
  try {
    const entries = await fs.readdir(VERSIONED_DOCS_PATH, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory())
      .map(e => e.name);
  } catch {
    return [];
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const cleanMode = args.includes('--clean');
  const ciMode = args.includes('--ci');
  const localeArg = args.find(a => a.startsWith('--locale='))?.split('=')[1] 
    || (args.includes('--locale') ? args[args.indexOf('--locale') + 1] : null);
  
  const localesToCheck = localeArg ? [localeArg] : LOCALES;
  const versions = await getVersions();
  
  if (versions.length === 0) {
    console.log('No versioned docs found.');
    return;
  }
  
  console.log('Translation Sync Report');
  console.log('='.repeat(60));
  console.log(`Mode: ${cleanMode ? 'CLEAN (removing orphaned files)' : 'DRY RUN (report only)'}`);
  console.log(`Versions: ${versions.join(', ')}`);
  console.log(`Locales: ${localesToCheck.join(', ')}`);
  console.log('='.repeat(60));
  console.log('');
  
  let totalOrphaned = 0;
  let totalMissing = 0;
  let totalRemoved = 0;
  const summary = [];
  
  for (const version of versions) {
    console.log(`\n📁 ${version}`);
    console.log('-'.repeat(40));
    
    for (const locale of localesToCheck) {
      const { orphaned, missing, total } = await analyseLocale(locale, version);
      
      totalOrphaned += orphaned.length;
      totalMissing += missing.length;
      
      if (orphaned.length === 0 && missing.length === 0) {
        console.log(`  ✅ ${locale}: ${total} files in sync`);
        continue;
      }
      
      console.log(`  📍 ${locale}: ${total} translated files`);
      
      if (orphaned.length > 0) {
        console.log(`     ⚠️  ${orphaned.length} orphaned (no English source):`);
        for (const file of orphaned.slice(0, 5)) {
          console.log(`        - ${file}`);
        }
        if (orphaned.length > 5) {
          console.log(`        ... and ${orphaned.length - 5} more`);
        }
        
        if (cleanMode) {
          const removed = await removeOrphanedFiles(locale, version, orphaned);
          totalRemoved += removed.length;
          console.log(`     🗑️  Removed ${removed.length} orphaned files`);
        }
      }
      
      if (missing.length > 0) {
        console.log(`     📝 ${missing.length} missing translations`);
      }
      
      summary.push({
        locale,
        version,
        orphaned: orphaned.length,
        missing: missing.length,
        total
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total orphaned files: ${totalOrphaned}`);
  console.log(`Total missing translations: ${totalMissing}`);
  
  if (cleanMode) {
    console.log(`Files removed: ${totalRemoved}`);
  } else if (totalOrphaned > 0) {
    console.log('\nRun with --clean to remove orphaned files:');
    console.log('  node scripts/sync-translations.js --clean');
  }
  
  // CI mode: exit with error if orphaned files found
  if (ciMode && totalOrphaned > 0) {
    console.log('\n❌ CI check failed: orphaned translation files detected');
    process.exit(1);
  }
  
  // GitHub Actions summary
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summaryLines = [
      '## Translation Sync Report',
      '',
      `| Locale | Orphaned | Missing |`,
      `|--------|----------|---------|`,
    ];
    
    for (const { locale, orphaned, missing } of summary) {
      const orphanedIcon = orphaned > 0 ? '⚠️' : '✅';
      summaryLines.push(`| ${locale} | ${orphanedIcon} ${orphaned} | ${missing} |`);
    }
    
    if (cleanMode && totalRemoved > 0) {
      summaryLines.push('', `**Removed ${totalRemoved} orphaned files**`);
    }
    
    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summaryLines.join('\n'));
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
