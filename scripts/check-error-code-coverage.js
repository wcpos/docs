/**
 * Error-code coverage contract.
 *
 * The join between the runtime error catalogue (owned by the app / monorepo)
 * and the help pages (owned by this docs repo) is enforced on KEYS, not
 * content: every code the app can emit must have a page (no dead "Learn more"
 * links), and no page may claim a registry code that no longer exists (no
 * stale pages). Help prose lives in the .mdx; only the facts manifest crosses
 * the boundary (src/data/error-catalogue.json, bot-synced from the monorepo).
 *
 * The reverse check excludes only the older namespaced families (API, DB, PY,
 * SY), which belong to a separate, pre-registry scheme. All other domains stay
 * governed even if their final manifest entry is removed, so retired-domain
 * pages cannot silently become stale.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const DEFAULT_MANIFEST = path.join(REPO_ROOT, 'src/data/error-catalogue.json');
const DEFAULT_PAGES_DIR = path.join(
  REPO_ROOT,
  'versioned_docs/version-1.x/error-codes'
);
const LEGACY_DOMAINS = new Set(['API', 'DB', 'PY', 'SY']);

/** Leading uppercase-letter run of a code, e.g. AUTH331 -> "AUTH", SY01001 -> "SY". */
function domainPrefix(code) {
  const m = code.match(/^[A-Z]+/);
  return m ? m[0] : '';
}

function loadManifestCodes(manifestPath = DEFAULT_MANIFEST) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return manifest.codes || {};
}

function loadPageCodes(pagesDir = DEFAULT_PAGES_DIR) {
  return new Set(
    fs
      .readdirSync(pagesDir)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => f.slice(0, -4))
      .filter((name) => /^[A-Z]+[0-9]+$/.test(name))
  );
}

/**
 * @returns {{ missing: string[], stale: string[], metaMismatches: string[], checked: number }}
 *   missing — manifest codes with no page (dead "Learn more" links)
 *   stale   — non-legacy pages that no manifest code backs
 *   metaMismatches — ErrorMeta props that do not match their page filename
 */
function checkCoverage({
  manifestPath = DEFAULT_MANIFEST,
  pagesDir = DEFAULT_PAGES_DIR,
} = {}) {
  const codes = loadManifestCodes(manifestPath);
  const manifestCodes = new Set(Object.keys(codes));
  const pageCodes = loadPageCodes(pagesDir);

  const missing = [...manifestCodes].filter((c) => !pageCodes.has(c)).sort();
  const stale = [...pageCodes]
    .filter(
      (c) => !LEGACY_DOMAINS.has(domainPrefix(c)) && !manifestCodes.has(c)
    )
    .sort();
  const metaMismatches = [];
  for (const pageCode of pageCodes) {
    const source = fs.readFileSync(
      path.join(pagesDir, `${pageCode}.mdx`),
      'utf8'
    );
    const metaPattern = /<ErrorMeta\b[^>]*\bcode\s*=\s*["']([^"']+)["'][^>]*>/g;
    for (const match of source.matchAll(metaPattern)) {
      const metaCode = match[1];
      if (metaCode !== pageCode || !manifestCodes.has(metaCode)) {
        metaMismatches.push(
          `${pageCode}.mdx: ErrorMeta code "${metaCode}" must match "${pageCode}"`
        );
      }
    }
  }
  metaMismatches.sort();

  return { missing, stale, metaMismatches, checked: manifestCodes.size };
}

module.exports = { checkCoverage, domainPrefix };

// CLI: `node scripts/check-error-code-coverage.js` — exit 1 on any gap.
if (require.main === module) {
  const { missing, stale, metaMismatches, checked } = checkCoverage();
  if (
    missing.length === 0 &&
    stale.length === 0 &&
    metaMismatches.length === 0
  ) {
    console.log(`error-code coverage OK — ${checked} codes, all have pages.`);
    process.exit(0);
  }
  if (missing.length) {
    console.error(
      `Missing help pages for ${missing.length} code(s) (dead "Learn more" links):\n  ${missing.join('\n  ')}`
    );
  }
  if (stale.length) {
    console.error(
      `Stale error-code pages with no backing registry code:\n  ${stale.join('\n  ')}`
    );
  }
  if (metaMismatches.length) {
    console.error(
      `ErrorMeta code props that do not match their page:\n  ${metaMismatches.join('\n  ')}`
    );
  }
  process.exit(1);
}
