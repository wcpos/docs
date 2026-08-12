/* global describe, it, expect */
const { shouldIgnoreVercelBuild } = require('../should-ignore-vercel-build');

describe('shouldIgnoreVercelBuild', () => {
  it('skips Vercel preview builds for Aide docs translation branches', () => {
    expect(
      shouldIgnoreVercelBuild({ VERCEL_GIT_COMMIT_REF: 'aide/docs-translations-2026-05-18' })
    ).toBe(true);
  });

  it('allows Vercel builds for main and non-Aide branches', () => {
    expect(shouldIgnoreVercelBuild({ VERCEL_GIT_COMMIT_REF: 'main' })).toBe(false);
    expect(shouldIgnoreVercelBuild({ VERCEL_GIT_COMMIT_REF: 'feature/docs-update' })).toBe(false);
  });

  it('allows Vercel builds when Vercel does not provide a branch name', () => {
    expect(shouldIgnoreVercelBuild({})).toBe(false);
  });
});
