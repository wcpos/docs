import { rewrite, next } from '@vercel/edge';

/**
 * Content negotiation for AI agents.
 *
 * When a request to a canonical doc URL carries `Accept: text/markdown`
 * (e.g. Claude Code's WebFetch sends such a header), serve the clean Markdown
 * file that @signalwire/docusaurus-plugin-llms-txt already generates for that
 * route, instead of the full HTML page.
 *
 * This must run in Edge Middleware rather than `vercel.json` rewrites: with
 * `cleanUrls: true`, every doc route resolves to a real index.html on the
 * filesystem, and vercel.json rewrites are only consulted *after* the
 * filesystem — so a rewrite would never fire. Middleware runs before the
 * filesystem, so it can intercept.
 *
 * Normal browser traffic (Accept: text/html) returns immediately via next()
 * and is never rewritten. Any unexpected error also falls through to next(),
 * so this can only ever serve markdown to markdown clients — it cannot break
 * the HTML site.
 */

// Only run on extension-less paths (doc routes). Anything containing a "." —
// /pos.md, /sitemap.xml, /llms.txt, /assets/*.js, /img/*.png — is skipped, so
// existing files and assets are served untouched and never doubled to .md.md.
export const config = {
  matcher: ['/((?!.*\\.).*)'],
};

// URL prefixes served as a locale "home" directory. These map to */index.md;
// every other route maps to <route>.md (mirrors the plugin's output exactly).
const LOCALE_HOME = /^\/(es|fr|de|nl|ja|pt-BR|ko|it|ar|hi-IN|zh-CN)$/;

export default function middleware(request) {
  try {
    const accept = request.headers.get('accept') || '';
    if (!accept.includes('text/markdown')) {
      return next();
    }

    const url = new URL(request.url);
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
  } catch (_e) {
    return next(); // fail safe: never break normal page serving
  }
}
