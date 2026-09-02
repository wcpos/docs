/**
 * Registry → catalogue mirror check.
 *
 * The facts manifest (src/data/error-catalogue.json) is mirrored BY HAND from
 * the monorepo's error registry, and check-error-code-coverage.js can only see
 * the docs side of that mirror: it caught a page without a catalogue entry,
 * but a registry code never mirrored here at all failed nothing anywhere —
 * CLIENT141–143 shipped in the app and were invisible to every docs check for
 * three releases (found by the 2026-09-01 log-message audit).
 *
 * This check fetches the registry from the monorepo (public) and enforces:
 *   - every registry code has a catalogue entry (missing);
 *   - entries present in both agree on the facts ErrorMeta renders (drifted).
 *
 * Deliberately ONE-directional: a catalogue code absent from the registry is
 * fine, because docs land BEFORE the app change ships (this file's own PR adds
 * codes ahead of its companion monorepo PR). The docs-side stale check in
 * check-error-code-coverage.js still ties every catalogue entry to a page.
 *
 * A fetch failure is a hard failure, not a skip — in GitHub Actions a fetch of
 * raw.githubusercontent.com is dependable, and a check that silently skips on
 * error is worse than none: it reads as coverage while enforcing nothing.
 */
const path = require('path');
const fs = require('fs');

const REGISTRY_URL =
  'https://raw.githubusercontent.com/wcpos/monorepo/main/packages/utils/src/logger/error-registry.json';
const MANIFEST = path.join(__dirname, '../src/data/error-catalogue.json');
/** The facts ErrorMeta renders — the only fields the catalogue mirrors. */
const MIRRORED_FIELDS = ['symbol', 'domain', 'severity', 'introducedIn'];

async function checkMirror({ registryUrl = REGISTRY_URL, manifestPath = MANIFEST } = {}) {
  const response = await fetch(registryUrl);
  if (!response.ok) {
    throw new Error(`Registry fetch failed: ${response.status} ${registryUrl}`);
  }
  const registry = await response.json();
  const catalogue = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).codes;

  const missing = [];
  const drifted = [];
  for (const entry of registry) {
    const mirrored = catalogue[entry.code];
    if (!mirrored) {
      missing.push(entry.code);
      continue;
    }
    for (const field of MIRRORED_FIELDS) {
      if (mirrored[field] !== entry[field]) {
        drifted.push(
          `${entry.code}.${field}: catalogue "${mirrored[field]}" vs registry "${entry[field]}"`
        );
      }
    }
  }
  return { missing: missing.sort(), drifted: drifted.sort(), checked: registry.length };
}

module.exports = { checkMirror };

// CLI: `node scripts/check-registry-mirror.js` — exit 1 on any gap.
if (require.main === module) {
  checkMirror().then(
    ({ missing, drifted, checked }) => {
      if (missing.length === 0 && drifted.length === 0) {
        console.log(
          `registry mirror OK — all ${checked} registry codes mirrored and agreeing.`
        );
        return;
      }
      if (missing.length) {
        console.error(
          `Registry codes the app can emit with NO catalogue entry (invisible to every docs check):\n  ${missing.join('\n  ')}`
        );
      }
      if (drifted.length) {
        console.error(
          `Catalogue facts that no longer match the registry:\n  ${drifted.join('\n  ')}`
        );
      }
      process.exitCode = 1;
    },
    (error) => {
      console.error(String(error));
      process.exitCode = 1;
    }
  );
}
