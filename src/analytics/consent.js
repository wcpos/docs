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
 * The cookie is intentionally host-scoped (no Domain attribute), exactly like
 * the website's, so behaviour is identical today. See the migration plan for
 * the optional follow-up to make consent itself carry across subdomains
 * (Domain=.wcpos.com on both properties).
 */
export const ANALYTICS_CONSENT_COOKIE = 'wcpos-analytics-consent';

/** CNIL guidance caps consent validity at 13 months; we re-ask after ~6. */
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

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
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${status}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
