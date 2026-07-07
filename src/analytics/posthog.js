/**
 * PostHog client module for the docs site.
 *
 * Matches the rest of the WCPOS analytics system (website + plugin landing
 * page) so docs events land in the SAME PostHog project and a visitor is
 * stitched into ONE person across docs.wcpos.com -> wcpos.com via PostHog's
 * own cross-subdomain cookie (set on .wcpos.com by default).
 *
 * Deliberate parity choices, copied from wcpos-com:
 *   - api_host is the self-hosted PostHog origin (ph.wcpos.com). The same
 *     origin also acts as ui_host for toolbar/dashboard links.
 *   - autocapture OFF and capture_pageview OFF: we send explicit, deterministic
 *     events ($pageview on route change, cta_click on key outbound links).
 *   - session recording OFF: docs only needs event analytics, and the self-hosted
 *     /s recording endpoint is not exposed for public browser ingest.
 *   - GDPR: nothing is captured until the visitor grants analytics consent.
 *
 * posthog-js is loaded lazily inside the browser only, so this module is
 * SSR-safe (Docusaurus imports client modules during the server build).
 */
import { readAnalyticsConsent } from './consent';

const PROJECT_API_KEY = 'phc_BhTJzZ7fXMqcD4MiaUJQsQqPkEpu94yoSAthXFBWemvd';
const API_HOST = 'https://ph.wcpos.com';
const UI_HOST = 'https://ph.wcpos.com';

// Outbound destinations that represent the docs -> website/install funnel.
const CTA_HOSTS = ['wcpos.com', 'wordpress.org'];

let ph = null;
let starting = null;
let lastTrackedPath = null;

function capturePageview() {
  if (!ph || typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path === lastTrackedPath) return; // dedupe initial load vs first route hook
  lastTrackedPath = path;
  ph.capture('$pageview');
}

function handleCtaClick(event) {
  if (!ph) return;
  const anchor = event.target?.closest?.('a[href]');
  if (!anchor) return;

  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return;
  }

  const host = url.hostname.replace(/^www\./, '');
  if (!CTA_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return;

  ph.capture('cta_click', {
    href: url.href,
    target_host: host,
    link_text: (anchor.textContent || '').trim().slice(0, 100),
    from_path: window.location.pathname,
  });
}

/**
 * Initialise PostHog. Safe to call repeatedly and before/after consent:
 * it no-ops without consent and only ever initialises once. The consent
 * banner calls this the moment consent is granted.
 */
export async function startPostHog() {
  if (typeof window === 'undefined') return;
  if (ph || starting) return starting;
  if (readAnalyticsConsent() !== 'granted') return;

  starting = (async () => {
    const posthog = (await import('posthog-js')).default;
    posthog.init(PROJECT_API_KEY, {
      api_host: API_HOST,
      ui_host: UI_HOST,
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      persistence: 'localStorage+cookie',
    });
    posthog.register({
      property: 'docs',
      docs_locale: document.documentElement.lang || 'en',
    });
    ph = posthog;
    window.posthog = posthog;
    document.addEventListener('click', handleCtaClick, true);
    capturePageview(); // initial page
  })();

  return starting;
}

// Docusaurus client-module lifecycle: fires on initial load and every SPA nav.
export function onRouteDidUpdate() {
  capturePageview();
}

// Run on load: start immediately if consent was granted in a previous visit.
if (typeof window !== 'undefined') {
  startPostHog();
}
