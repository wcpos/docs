/**
 * Build the site WITH the unreleased 2.x docs included.
 *
 * 2.x is cut but excluded from the production build (see `onlyIncludeVersions`
 * in docusaurus.config.js), so nothing normally compiles those 265 pages. An
 * unbuilt tree rots silently — a broken sidebar reference or a bad MDX import
 * would not surface until launch day, when it is least welcome.
 *
 * This generates a throwaway config with 2.x added back and builds against it,
 * so CI can prove the hidden version still compiles. It writes no production
 * config and defines no environment variable: the override lives in a generated
 * file that is deleted on the way out.
 *
 * Usage: node scripts/build-with-2x.js [--locale en]
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const SOURCE = path.join(REPO_ROOT, 'docusaurus.config.js');
const GENERATED = path.join(REPO_ROOT, 'docusaurus.with-2x.generated.js');
const EXCLUDED = "onlyIncludeVersions: ['1.x', '0.4.x']";
const INCLUDED = "onlyIncludeVersions: ['2.x', '1.x', '0.4.x']";

const source = fs.readFileSync(SOURCE, 'utf8');
if (!source.includes(EXCLUDED)) {
  throw new Error(
    `Expected ${path.basename(SOURCE)} to contain ${EXCLUDED}. If 2.x has been ` +
      'released and is now built by default, delete this script — it has no job left.'
  );
}

fs.writeFileSync(GENERATED, source.replace(EXCLUDED, INCLUDED));
try {
  execFileSync(
    path.join(REPO_ROOT, 'node_modules/.bin/docusaurus'),
    ['build', '--config', GENERATED, ...process.argv.slice(2)],
    { cwd: REPO_ROOT, stdio: 'inherit' }
  );
} finally {
  fs.rmSync(GENERATED, { force: true });
}
