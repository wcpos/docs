import { rewrite, next } from '@vercel/edge';
import { LOCALE_PREFERENCE_COOKIE } from './src/utils/localePreference';

/**
 * Edge middleware, two independent concerns:
 *
 * 1. Content negotiation for AI agents.
 *
 *    When a request to a canonical doc URL carries `Accept: text/markdown`
 *    (e.g. Claude Code's WebFetch sends such a header), serve the clean
 *    Markdown file that @signalwire/docusaurus-plugin-llms-txt already
 *    generates for that route, instead of the full HTML page.
 *
 *    This must run in Edge Middleware rather than `vercel.json` rewrites:
 *    with `cleanUrls: true`, every doc route resolves to a real index.html on
 *    the filesystem, and vercel.json rewrites are only consulted *after* the
 *    filesystem — so a rewrite would never fire. Middleware runs before the
 *    filesystem, so it can intercept.
 *
 * 2. Browser-language detection on the site root.
 *
 *    Docusaurus builds each locale as a fully static site, so nothing else
 *    can send a German-browser visitor of `/` to `/de` — detection has to
 *    happen here. Only the root redirects: deep links keep the language they
 *    were shared in, and localized search traffic already lands on localized
 *    URLs via the hreflang alternates every page emits.
 *
 *    An explicit choice in the language switcher wins over Accept-Language:
 *    the switcher stores a preference cookie (src/utils/localePreference.js)
 *    which this middleware honours, so picking English sticks even for
 *    non-English browsers.
 *
 * Normal browser traffic on non-root pages returns immediately via next()
 * and is never rewritten. Any unexpected error also falls through to next(),
 * so a bug here can degrade to "no redirect" but cannot break page serving.
 */

// Only run on extension-less paths (doc routes). Anything containing a "." —
// /pos.md, /sitemap.xml, /llms.txt, /assets/*.js, /img/*.png — is skipped, so
// existing files and assets are served untouched and never doubled to .md.md.
export const config = {
  matcher: ['/((?!.*\\.).*)'],
};

// Must mirror i18n.locales in docusaurus.config.js (a test enforces this).
export const LOCALES = [
  'en',
  'es',
  'fr',
  'de',
  'nl',
  'ja',
  'pt-BR',
  'ko',
  'it',
  'ar',
  'hi-IN',
  'zh-CN',
];
const DEFAULT_LOCALE = 'en';

// URL prefixes served as a locale "home" directory. These map to */index.md;
// every other route maps to <route>.md (mirrors the plugin's output exactly).
const LOCALE_HOME = new RegExp(
  `^/(${LOCALES.filter((l) => l !== DEFAULT_LOCALE).join('|')})$`
);

/**
 * Parse an Accept-Language header into tags ordered by descending quality.
 * Wildcards and malformed entries are dropped.
 */
export function parseAcceptLanguage(header) {
  return (header || '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter(({ tag, q }) => tag && tag !== '*' && q > 0)
    .sort((a, b) => b.q - a.q);
}

/**
 * Best supported locale for an Accept-Language header, or null when nothing
 * matches. Exact tag matches win (case-insensitive), then primary-subtag
 * matches: de-AT -> de, pt-PT -> pt-BR, zh-TW -> zh-CN.
 */
export function pickLocale(acceptLanguage) {
  for (const { tag } of parseAcceptLanguage(acceptLanguage)) {
    const lowered = tag.toLowerCase();
    const exact = LOCALES.find((l) => l.toLowerCase() === lowered);
    if (exact) {
      return exact;
    }
    const primary = lowered.split('-')[0];
    const partial = LOCALES.find(
      (l) => l.split('-')[0].toLowerCase() === primary
    );
    if (partial) {
      return partial;
    }
  }
  return null;
}

function readCookie(cookieHeader, name) {
  for (const pair of (cookieHeader || '').split(';')) {
    const [key, ...rest] = pair.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

/**
 * Locale-home path (e.g. "/de") the site root should redirect to, or null to
 * serve the default-locale homepage. Explicit cookie preference beats
 * Accept-Language; an unknown cookie value is ignored.
 */
export function resolveRootRedirect({ cookieHeader, acceptLanguage }) {
  const preferred = readCookie(cookieHeader, LOCALE_PREFERENCE_COOKIE);
  if (preferred && LOCALES.includes(preferred)) {
    return preferred === DEFAULT_LOCALE ? null : `/${preferred}`;
  }
  const detected = pickLocale(acceptLanguage);
  if (detected && detected !== DEFAULT_LOCALE) {
    return `/${detected}`;
  }
  return null;
}

export default function middleware(request) {
  try {
    const url = new URL(request.url);
    const accept = request.headers.get('accept') || '';

    if (accept.includes('text/markdown')) {
      const path = url.pathname.replace(/\/+$/, ''); // strip trailing slash

      let mdPath;
      if (path === '') {
        mdPath = '/index.md'; // site home
      } else if (LOCALE_HOME.test(path)) {
        mdPath = `${path}/index.md`; // locale home, e.g. /es -> /es/index.md
      } else {
        mdPath = `${path}.md`; // every other route
      }

      url.pathname = mdPath;
      return rewrite(url);
    }

    // Browser-language detection: site root only.
    if (url.pathname === '/' || url.pathname === '') {
      const target = resolveRootRedirect({
        cookieHeader: request.headers.get('cookie'),
        acceptLanguage: request.headers.get('accept-language'),
      });
      if (target) {
        url.pathname = target;
        return new Response(null, {
          status: 302,
          headers: {
            Location: url.toString(),
            // Per-user response: never let a shared cache replay it.
            'Cache-Control': 'no-store',
            Vary: 'Accept-Language, Cookie',
          },
        });
      }
    }

    return next();
  } catch (_e) {
    return next(); // fail safe: never break normal page serving
  }
}
