/**
 * Explicit language preference, shared between the browser and the edge.
 *
 * When a visitor picks a language in the footer <select> (or the retained
 * navbar dropdown), we remember it in a cookie. The Vercel Edge Middleware
 * (middleware.js) reads that cookie when someone hits the site root `/` and
 * lets it override Accept-Language detection — otherwise a German-browser
 * user who deliberately switched to English would be bounced back to /de on
 * every visit to the homepage.
 *
 * This module must stay dependency-free (no Docusaurus imports): it is
 * bundled both into the client theme components and into the edge middleware.
 */

export const LOCALE_PREFERENCE_COOKIE = 'docs-preferred-locale';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function rememberLocalePreference(locale) {
  if (typeof document === 'undefined') {
    return; // SSR / non-browser context
  }
  document.cookie = `${LOCALE_PREFERENCE_COOKIE}=${encodeURIComponent(
    locale
  )};path=/;max-age=${ONE_YEAR_SECONDS};SameSite=Lax`;
}
