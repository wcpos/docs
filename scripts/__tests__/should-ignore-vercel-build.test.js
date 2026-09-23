/* global describe, it, expect */
const { shouldIgnoreVercelBuild } = require('../should-ignore-vercel-build');

describe('shouldIgnoreVercelBuild', () => {
  it('skips Vercel preview builds for automated docs translation branches', () => {
    expect(
      shouldIgnoreVercelBuild({ VERCEL_GIT_COMMIT_REF: 'docs-translate/20260923-101500' })
    ).toBe(true);
  });

  it('allows Vercel builds for former Aide branches, main and other branches', () => {
    expect(
      shouldIgnoreVercelBuild({ VERCEL_GIT_COMMIT_REF: 'aide/docs-translations-2026-05-18' })
    ).toBe(false);
    expect(shouldIgnoreVercelBuild({ VERCEL_GIT_COMMIT_REF: 'main' })).toBe(false);
    expect(shouldIgnoreVercelBuild({ VERCEL_GIT_COMMIT_REF: 'feature/docs-update' })).toBe(false);
  });

  it('allows Vercel builds when Vercel does not provide a branch name', () => {
    expect(shouldIgnoreVercelBuild({})).toBe(false);
  });
});
