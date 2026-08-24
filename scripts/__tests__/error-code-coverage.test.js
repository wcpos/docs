/* global describe, it, expect */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkCoverage, domainPrefix } = require('../check-error-code-coverage');

describe('error-code coverage contract', () => {
  it('every registry-backed code has a help page (no dead "Learn more" links)', () => {
    const { missing } = checkCoverage();
    expect(missing).toEqual([]);
  });

  it('no stale error-code page claims a registry code that no longer exists', () => {
    const { stale } = checkCoverage();
    expect(stale).toEqual([]);
  });

  it('checks the whole manifest', () => {
    const { checked } = checkCoverage();
    expect(checked).toBeGreaterThan(0);
  });

  it('domainPrefix isolates the domain namespace', () => {
    expect(domainPrefix('AUTH331')).toBe('AUTH');
    expect(domainPrefix('SYNC101')).toBe('SYNC');
    // legacy namespaces resolve to their own prefix, not a registry domain
    expect(domainPrefix('SY01001')).toBe('SY');
    expect(domainPrefix('API01001')).toBe('API');
  });

  it('detects mismatched ErrorMeta props and stale pages in retired domains', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'error-code-coverage-'));
    const pagesDir = path.join(root, 'pages');
    const manifestPath = path.join(root, 'manifest.json');
    fs.mkdirSync(pagesDir);
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        codes: {
          AUTH331: { domain: 'AUTH' },
          CLIENT101: { domain: 'CLIENT' },
        },
      })
    );
    fs.writeFileSync(
      path.join(pagesDir, 'AUTH331.mdx'),
      '<ErrorMeta code="CLIENT101" />'
    );
    fs.writeFileSync(
      path.join(pagesDir, 'CLIENT101.mdx'),
      '<ErrorMeta code="NOPE999" />'
    );
    fs.writeFileSync(path.join(pagesDir, 'SYNC999.mdx'), '# Retired domain');
    fs.writeFileSync(path.join(pagesDir, 'API999.mdx'), '# Legacy domain');

    try {
      expect(checkCoverage({ manifestPath, pagesDir })).toMatchObject({
        missing: [],
        stale: ['SYNC999'],
        metaMismatches: [
          'AUTH331.mdx: ErrorMeta code "CLIENT101" must match "AUTH331"',
          'CLIENT101.mdx: ErrorMeta code "NOPE999" must match "CLIENT101"',
        ],
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
