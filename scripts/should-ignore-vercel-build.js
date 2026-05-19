#!/usr/bin/env node

const AIDE_DOCS_TRANSLATION_BRANCH_PREFIX = 'aide/docs-translations-';

function shouldIgnoreVercelBuild(env = process.env) {
  const branch = env.VERCEL_GIT_COMMIT_REF || '';
  return branch.startsWith(AIDE_DOCS_TRANSLATION_BRANCH_PREFIX);
}

function main() {
  const branch = process.env.VERCEL_GIT_COMMIT_REF || '(unknown)';

  if (shouldIgnoreVercelBuild(process.env)) {
    console.log(`Skipping Vercel build for automated docs translation branch: ${branch}`);
    process.exitCode = 0;
    return;
  }

  console.log(`Allowing Vercel build for branch: ${branch}`);
  process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  shouldIgnoreVercelBuild,
};
