/* global describe, it, expect */
const {
  filterTranslationSourceFiles,
  gitLines,
  resolveChangedFiles,
} = require('../detect-doc-translation-changes');
const { pollTaskUntilTerminal, resolvePollUrl } = require('../wait-for-openclaw-task');

describe('filterTranslationSourceFiles', () => {
  it('keeps docs, English i18n JSON, sidebars, and Docusaurus config', () => {
    expect(
      filterTranslationSourceFiles([
        'versioned_docs/version-1.x/getting-started/index.mdx',
        'versioned_docs/version-1.x/api/reference.md',
        'i18n/en/docusaurus-plugin-content-docs/version-1.x.json',
        'versioned_sidebars/version-1.x-sidebars.json',
        'sidebars.js',
        'docusaurus.config.js',
        'src/css/custom.css',
        'i18n/de/docusaurus-plugin-content-docs/version-1.x/foo.mdx',
        'README.md',
      ])
    ).toEqual([
      'docusaurus.config.js',
      'i18n/en/docusaurus-plugin-content-docs/version-1.x.json',
      'sidebars.js',
      'versioned_docs/version-1.x/api/reference.md',
      'versioned_docs/version-1.x/getting-started/index.mdx',
      'versioned_sidebars/version-1.x-sidebars.json',
    ]);
  });

  it('deduplicates and sorts out-of-order paths for stable workflow output', () => {
    expect(
      filterTranslationSourceFiles([
        'versioned_docs/version-1.x/z.mdx',
        'sidebars.js',
        'versioned_docs/version-1.x/a.mdx',
        'sidebars.js',
        'docusaurus.config.js',
      ])
    ).toEqual([
      'docusaurus.config.js',
      'sidebars.js',
      'versioned_docs/version-1.x/a.mdx',
      'versioned_docs/version-1.x/z.mdx',
    ]);
  });
});

describe('resolveChangedFiles', () => {
  it('uses explicit files before git diff output', () => {
    expect(
      resolveChangedFiles({
        explicitFiles: ['versioned_docs/version-1.x/a.mdx'],
        diffFiles: ['src/ignored.js'],
        allFiles: ['versioned_docs/version-1.x/b.mdx'],
      })
    ).toEqual(['versioned_docs/version-1.x/a.mdx']);
  });

  it('falls back to all files when no changed source files are detected', () => {
    expect(
      resolveChangedFiles({
        explicitFiles: [],
        diffFiles: ['src/ignored.js'],
        allFiles: ['versioned_docs/version-1.x/b.mdx'],
      })
    ).toEqual(['versioned_docs/version-1.x/b.mdx']);
  });
});

describe('gitLines', () => {
  it('throws a clear error when git diff fails instead of returning an empty list', () => {
    const failingGit = () => {
      const error = new Error('Command failed: git diff');
      error.stderr = 'fatal: bad revision origin/main...HEAD';
      throw error;
    };

    expect(() =>
      gitLines(['diff', '--name-only', 'origin/main...HEAD'], failingGit)
    ).toThrow(
      'Git command failed (git diff --name-only origin/main...HEAD): fatal: bad revision origin/main...HEAD'
    );
  });
});


describe('resolvePollUrl', () => {
  it('resolves relative poll URLs against the configured OpenClaw base URL', () => {
    expect(
      resolvePollUrl('/translation/tasks/123', 'https://openclaw.example/base')
    ).toBe('https://openclaw.example/translation/tasks/123');
  });

  it('allows absolute poll URLs on the configured OpenClaw origin', () => {
    expect(
      resolvePollUrl(
        'https://openclaw.example/translation/tasks/123',
        'https://openclaw.example/base'
      )
    ).toBe('https://openclaw.example/translation/tasks/123');
  });

  it('rejects absolute poll URLs on a different origin before polling', () => {
    expect(() =>
      resolvePollUrl(
        'https://attacker.example/translation/tasks/123',
        'https://openclaw.example/base'
      )
    ).toThrow(
      'OpenClaw poll_url origin https://attacker.example does not match configured OPENCLAW_BASE_URL origin https://openclaw.example'
    );
  });
});


describe('pollTaskUntilTerminal', () => {
  it('caps request timeout and sleep to the remaining global deadline', async () => {
    const originalNow = Date.now;
    let now = 1000;
    const signals = [];
    const sleeps = [];
    let fetchCalls = 0;

    Date.now = () => now;

    try {
      await expect(
        pollTaskUntilTerminal({
          pollUrl: 'https://openclaw.example/tasks/123',
          apiToken: 'test-token',
          timeoutMs: 50,
          intervalMs: 10000,
          logger: { log() {} },
          createTimeoutSignal(ms) {
            signals.push(ms);
            return undefined;
          },
          async fetchImpl() {
            fetchCalls += 1;
            return {
              ok: true,
              async json() {
                return { status: 'running' };
              },
            };
          },
          async sleep(ms) {
            sleeps.push(ms);
            now += ms;
          },
        })
      ).rejects.toThrow(
        'Timed out waiting for OpenClaw task at https://openclaw.example/tasks/123 to reach a terminal state; last status=running'
      );
    } finally {
      Date.now = originalNow;
    }

    expect(fetchCalls).toBe(1);
    expect(signals).toEqual([50]);
    expect(sleeps).toEqual([50]);
  });
});
