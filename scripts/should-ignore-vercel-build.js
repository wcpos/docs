#!/usr/bin/env node

const DOCS_TRANSLATION_BRANCH_PREFIX = 'docs-translate/';

function shouldIgnoreVercelBuild(env = process.env) {
  const branch = env.VERCEL_GIT_COMMIT_REF || '';
  return branch.startsWith(DOCS_TRANSLATION_BRANCH_PREFIX);
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
