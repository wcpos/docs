/* global describe, it, expect */
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
});
