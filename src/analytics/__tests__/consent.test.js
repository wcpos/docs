import { describe, it, expect } from 'vitest';
import { consentCookieDomain, mostRestrictiveConsent } from '../consent';

describe('consentCookieDomain', () => {
  it('scopes consent to .wcpos.com on the production family so a decision is shared', () => {
    expect(consentCookieDomain('wcpos.com')).toBe('.wcpos.com');
    expect(consentCookieDomain('docs.wcpos.com')).toBe('.wcpos.com');
    expect(consentCookieDomain('www.wcpos.com')).toBe('.wcpos.com');
  });

  it('stays host-scoped (null) off the wcpos.com family so the cookie is not rejected', () => {
    // localhost dev, e2e, and Vercel preview deploys must keep working: a
    // Domain=.wcpos.com cookie set from these hosts would be dropped by the browser.
    expect(consentCookieDomain('localhost')).toBeNull();
    expect(consentCookieDomain('docs-git-preview.vercel.app')).toBeNull();
    // A lookalike suffix must not match — only wcpos.com itself or a real subdomain.
    expect(consentCookieDomain('notwcpos.com')).toBeNull();
  });
});

describe('mostRestrictiveConsent', () => {
  it('lets denial win over a coexisting grant (fail-closed)', () => {
    // Migration case: a stale host-scoped `granted` alongside a later shared
    // `denied` must resolve to denied, whatever order they appear in.
    expect(mostRestrictiveConsent(['granted', 'denied'])).toBe('denied');
    expect(mostRestrictiveConsent(['denied', 'granted'])).toBe('denied');
  });

  it('returns granted only when every present value grants', () => {
    expect(mostRestrictiveConsent(['granted'])).toBe('granted');
    expect(mostRestrictiveConsent(['granted', 'granted'])).toBe('granted');
  });

  it('returns null when nothing has been decided, ignoring junk values', () => {
    expect(mostRestrictiveConsent([])).toBeNull();
    expect(mostRestrictiveConsent([undefined, null, '', 'yes'])).toBeNull();
    // A junk value must not mask a real grant.
    expect(mostRestrictiveConsent(['yes', 'granted'])).toBe('granted');
  });
});
