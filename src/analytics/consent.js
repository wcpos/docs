/**
 * GDPR analytics consent — mirrors the website's mechanism
 * (wcpos-com/src/lib/analytics/consent.ts) so a visitor sees one consistent
 * model across *.wcpos.com.
 *
 * Consent is stored in the `wcpos-analytics-consent` cookie:
 *   - missing  -> no decision yet: banner shown, analytics disabled
 *   - 'granted' -> analytics enabled
 *   - 'denied'  -> analytics disabled
 *
 * The cookie is scoped to `.wcpos.com` (see consentCookieDomain) so a decision
 * made on either property carries across the whole family — accept/decline once
 * on wcpos.com and docs.wcpos.com honours it without showing its own banner,
 * and vice versa. The website's writer sets the same Domain, so both ends agree.
 */
export const ANALYTICS_CONSENT_COOKIE = 'wcpos-analytics-consent';

/** CNIL guidance caps consent validity at 13 months; we re-ask after ~6. */
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

/**
 * Cookie Domain that shares the consent decision across every *.wcpos.com
 * property. Returns null for any other host — localhost dev, Vercel preview
 * deploys, unit tests — because a browser silently rejects a `Domain=.wcpos.com`
 * cookie set from a host that isn't under wcpos.com, which would break consent
 * persistence there. Kept as a pure function of the hostname so it is testable
 * without a DOM.
 */
export function consentCookieDomain(hostname) {
  return hostname === 'wcpos.com' || hostname.endsWith('.wcpos.com')
    ? '.wcpos.com'
    : null;
}

export function parseAnalyticsConsent(value) {
  return value === 'granted' || value === 'denied' ? value : null;
}

function readDocumentCookie(name) {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${name}=`;
  const match = document.cookie
    .split('; ')
    .find((part) => part.startsWith(prefix));

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    // Malformed % sequences in user-controlled cookies must fail closed.
    return null;
  }
}

/** Client-side read of the consent decision. Returns null when undecided. */
export function readAnalyticsConsent() {
  return parseAnalyticsConsent(readDocumentCookie(ANALYTICS_CONSENT_COOKIE));
}

/**
 * Client-side write of the consent decision.
 *
 * Secure follows the actual page protocol rather than NODE_ENV: WebKit rejects
 * Secure cookies set over plain http (no localhost exemption), and local dev
 * serves over http://localhost.
 */
export function writeAnalyticsConsent(status) {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const domain = consentCookieDomain(window.location.hostname);
  const domainAttr = domain ? `; Domain=${domain}` : '';
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${status}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}${domainAttr}`;
}
