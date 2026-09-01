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

  it('lists every error-code help page in the versioned sidebar', () => {
    const sidebar = require('../../versioned_sidebars/version-1.x-sidebars.json');
    const docIds = new Set();
    const visit = (value) => {
      if (typeof value === 'string') docIds.add(value);
      else if (Array.isArray(value)) value.forEach(visit);
      else if (value) Object.values(value).forEach(visit);
    };
    visit(sidebar);

    const pagesDir = path.join(
      __dirname,
      '../../versioned_docs/version-1.x/error-codes'
    );
    const missing = fs
      .readdirSync(pagesDir)
      .filter((file) => /^[A-Z]+[0-9]+\.mdx$/.test(file))
      .map((file) => `error-codes/${file.slice(0, -4)}`)
      .filter((docId) => !docIds.has(docId));

    expect(missing).toEqual([]);
  });

  it('checks the whole manifest', () => {
    const { checked } = checkCoverage();
    expect(checked).toBeGreaterThan(0);
  });

  it('every manifest code is reachable through the versioned sidebar', () => {
    const { unreachable } = checkCoverage();
    expect(unreachable).toEqual([]);
  });

  it('flags a manifest code missing from the sidebar as unreachable', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'error-code-sidebar-'));
    const pagesDir = path.join(root, 'pages');
    const manifestPath = path.join(root, 'manifest.json');
    const sidebarPath = path.join(root, 'sidebars.json');
    fs.mkdirSync(pagesDir);
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        codes: { AUTH331: { domain: 'AUTH' }, SYNC341: { domain: 'SYNC' } },
      })
    );
    fs.writeFileSync(
      path.join(pagesDir, 'AUTH331.mdx'),
      '<ErrorMeta code="AUTH331" />'
    );
    fs.writeFileSync(
      path.join(pagesDir, 'SYNC341.mdx'),
      '<ErrorMeta code="SYNC341" />'
    );
    // SYNC341 has a page and a manifest entry but no sidebar entry — the exact
    // shape that shipped unreachable on 2026-09-01.
    fs.writeFileSync(
      sidebarPath,
      JSON.stringify({ sidebar: [{ items: ['error-codes/AUTH331'] }] })
    );

    try {
      expect(
        checkCoverage({ manifestPath, pagesDir, sidebarPath })
      ).toMatchObject({ unreachable: ['SYNC341'] });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
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
