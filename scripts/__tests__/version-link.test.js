import { versionedTo } from '../../src/components/version-link.js';

const next = { path: '/2.x', isLast: false };

describe('versionedTo', () => {
  it('leaves links on the latest version unchanged', () => {
    expect(versionedTo('/payment', { path: '/', isLast: true })).toBe('/payment');
  });

  it('prefixes links on a non-latest version', () => {
    expect(versionedTo('/payment', next)).toBe('/2.x/payment');
  });

  it('keeps the fragment', () => {
    expect(versionedTo('/receipts/at-checkout#email-receipt', next)).toBe(
      '/2.x/receipts/at-checkout#email-receipt',
    );
  });

  it('leaves links already inside the version unchanged', () => {
    expect(versionedTo('/2.x/payment', next)).toBe('/2.x/payment');
    expect(versionedTo('/2.x', next)).toBe('/2.x');
  });

  it('does not treat a sibling prefix as inside', () => {
    expect(versionedTo('/2.xtra', next)).toBe('/2.x/2.xtra');
  });

  it('drops a trailing slash on the version path', () => {
    expect(versionedTo('/payment', { path: '/2.x/', isLast: false })).toBe('/2.x/payment');
  });

  it('leaves links unchanged with no version', () => {
    expect(versionedTo('/payment', undefined)).toBe('/payment');
  });

  it('leaves external, protocol-relative, hash, relative and missing links alone', () => {
    for (const to of ['https://wcpos.com', '//wcpos.com/a', '#top', './sibling', undefined]) {
      expect(versionedTo(to, next)).toBe(to);
    }
  });
});
