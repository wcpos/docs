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
 * The reverse check is scoped to the registry's own DOMAINS. Older namespaced
 * families (API, DB, PY, SY) are a separate, pre-registry scheme and are not
 * governed by this manifest, so they are ignored here rather than flagged.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const DEFAULT_MANIFEST = path.join(REPO_ROOT, 'src/data/error-catalogue.json');
const DEFAULT_PAGES_DIR = path.join(
  REPO_ROOT,
  'versioned_docs/version-1.x/error-codes'
);

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
 * @returns {{ missing: string[], stale: string[], checked: number }}
 *   missing — manifest codes with no page (dead "Learn more" links)
 *   stale   — pages in a registry domain that no manifest code backs
 */
function checkCoverage({
  manifestPath = DEFAULT_MANIFEST,
  pagesDir = DEFAULT_PAGES_DIR,
} = {}) {
  const codes = loadManifestCodes(manifestPath);
  const manifestCodes = new Set(Object.keys(codes));
  const registryDomains = new Set(
    Object.values(codes).map((c) => c.domain)
  );
  const pageCodes = loadPageCodes(pagesDir);

  const missing = [...manifestCodes].filter((c) => !pageCodes.has(c)).sort();
  const stale = [...pageCodes]
    .filter(
      (c) => registryDomains.has(domainPrefix(c)) && !manifestCodes.has(c)
    )
    .sort();

  return { missing, stale, checked: manifestCodes.size };
}

module.exports = { checkCoverage, domainPrefix };

// CLI: `node scripts/check-error-code-coverage.js` — exit 1 on any gap.
if (require.main === module) {
  const { missing, stale, checked } = checkCoverage();
  if (missing.length === 0 && stale.length === 0) {
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
  process.exit(1);
}
