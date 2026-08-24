/* global describe, it, expect */
const { lookupError } = require('../lookup');
const catalogue = require('../../../data/error-catalogue.json');

describe('ErrorMeta lookup', () => {
  it('resolves a known code to its facts', () => {
    const meta = lookupError('AUTH331', catalogue);
    expect(meta).toMatchObject({
      code: 'AUTH331',
      symbol: 'WCPOS_PLUGIN_OUTDATED',
      severity: 'error',
      introducedIn: '1.10.0',
    });
  });

  it('returns null for an unknown code', () => {
    expect(lookupError('NOPE999', catalogue)).toBeNull();
  });

  it('every manifest code resolves to complete facts', () => {
    const codes = Object.keys(catalogue.codes);
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) {
      const meta = lookupError(code, catalogue);
      expect(meta).not.toBeNull();
      expect(meta.symbol).toBeTruthy();
      expect(meta.domain).toBeTruthy();
      expect(meta.severity).toBeTruthy();
      expect(meta.introducedIn).toBeTruthy();
    }
  });
});
