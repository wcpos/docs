import { describe, it, expect } from 'vitest';
import { consentCookieDomain } from '../consent';

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
