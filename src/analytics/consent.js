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

/**
 * Collect every value stored under `name` in a Cookie-header-formatted string
 * ("a=1; b=2; a=3"). One name can appear more than once when same-name cookies
 * exist at different scopes — e.g. a legacy host-scoped `wcpos-analytics-consent`
 * alongside the shared `.wcpos.com` one this change introduces.
 */
function collectCookieValues(cookieString, name) {
  const prefix = `${name}=`;
  const values = [];

  for (const part of cookieString.split('; ')) {
    if (!part.startsWith(prefix)) {
      continue;
    }
    try {
      values.push(decodeURIComponent(part.slice(prefix.length)));
    } catch {
      // Malformed % sequences in user-controlled cookies must fail closed
      // (skip this entry), not crash consent reads.
    }
  }

  return values;
}

/**
 * Reconcile possibly-conflicting consent values into one decision: denial wins
 * over consent, which wins over "undecided".
 *
 * Deliberately fail-closed. During the migration to the shared `.wcpos.com`
 * cookie an existing visitor can briefly carry both a stale host-scoped cookie
 * and the new shared one; a browser exposes both under the same name with no
 * way to tell which is newer. If they disagree we must never let a leftover
 * `granted` override a later `denied` — analytics stays off unless every
 * present value agrees it may run. Mirrors the website's consent.ts.
 */
export function mostRestrictiveConsent(values) {
  let sawGranted = false;

  for (const value of values) {
    const parsed = parseAnalyticsConsent(value);
    if (parsed === 'denied') {
      return 'denied';
    }
    if (parsed === 'granted') {
      sawGranted = true;
    }
  }

  return sawGranted ? 'granted' : null;
}

/** Client-side read of the consent decision. Returns null when undecided. */
export function readAnalyticsConsent() {
  if (typeof document === 'undefined') {
    return null;
  }

  return mostRestrictiveConsent(
    collectCookieValues(document.cookie, ANALYTICS_CONSENT_COOKIE),
  );
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

  if (domain) {
    // We just wrote the shared `.wcpos.com` cookie. Expire any legacy
    // host-scoped cookie of the same name (deleting without a Domain attribute
    // targets only the host-scoped entry, leaving the shared cookie intact) so
    // a stale host `granted` can never outlive — and shadow — this decision.
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  }
}
