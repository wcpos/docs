#!/usr/bin/env node

const AIDE_DOCS_TRANSLATION_BRANCH_PREFIX = 'aide/docs-translations-';
// Rolling branch the wcpos/monorepo registry sync force-pushes generated
// error-code pages to (wcpos/monorepo#1152). Like translation branches, it is
// gated by the build.yml Actions check instead of a Vercel preview (docs#254).
const REGISTRY_ERROR_PAGES_BRANCH = 'registry/error-code-pages';

function shouldIgnoreVercelBuild(env = process.env) {
  const branch = env.VERCEL_GIT_COMMIT_REF || '';
  return (
    branch.startsWith(AIDE_DOCS_TRANSLATION_BRANCH_PREFIX) ||
    branch === REGISTRY_ERROR_PAGES_BRANCH
  );
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
