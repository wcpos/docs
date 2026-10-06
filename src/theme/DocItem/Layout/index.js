import React from 'react';
import Head from '@docusaurus/Head';
import {useDoc, useDocsVersion} from '@docusaurus/plugin-content-docs/client';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {isUntranslatedFallback} from '@site/src/utils/untranslatedFallback';
import CopyPageButton from 'docusaurus-plugin-copy-page-button/react';
import Layout from '@theme-original/DocItem/Layout';

/**
 * Wraps the default doc layout to advertise the clean Markdown version of each
 * page to AI agents and crawlers via `<link rel="alternate" type="text/markdown">`.
 *
 * Why: server-log studies of real AI crawler traffic (e.g. dri.es, Cloudflare)
 * show that agents discover a page's Markdown almost exclusively through an
 * explicit alternate link / .md URL — they do NOT rely on `Accept: text/markdown`
 * content negotiation. The `.md` files themselves are generated per route by
 * @signalwire/docusaurus-plugin-llms-txt; this just makes them discoverable
 * from the rendered HTML page (the same pattern Mintlify-hosted docs ship).
 *
 * The href must mirror the plugin's output exactly:
 *   - site/locale home ("/", "/es/") -> "/index.md", "/es/index.md"
 *   - every other route ("/pos/", "/getting-started/connect") -> "<route>.md"
 */
export default function LayoutWrapper(props) {
  const {pathname} = useLocation();
  const {i18n} = useDocusaurusContext();
  const {metadata} = useDoc();
  const version = useDocsVersion();
  // English source served under a locale URL: keep it out of search and the
  // locale sitemap. Versions that are noindex already (0.4.x) are left alone.
  const noIndexFallback =
    !version.noIndex &&
    isUntranslatedFallback({
      source: metadata.source,
      currentLocale: i18n.currentLocale,
      defaultLocale: i18n.defaultLocale,
    });

  // URL prefixes served as a locale "home" directory: "/" for the default
  // locale, "/<localePath>/" for the others. Only these map to */index.md.
  const localeHomes = new Set(
    i18n.locales.map((locale) => {
      const localePath = i18n.localeConfigs[locale]?.path ?? locale;
      return locale === i18n.defaultLocale ? '/' : `/${localePath}/`;
    }),
  );

  const clean = pathname.replace(/\/+$/, '');
  const mdHref = localeHomes.has(pathname) ? `${clean}/index.md` : `${clean}.md`;

  return (
    <>
      <Head>
        <link rel="alternate" type="text/markdown" href={mdHref} />
        {noIndexFallback && <meta name="robots" content="noindex" />}
      </Head>
      {/* Plugin auto-injection is off because it raced hydration. */}
      <div id="copy-page-button-container" className="copy-page-button-row">
        <CopyPageButton
          enabledActions={['copy', 'view', 'chatgpt', 'claude', 'perplexity', 'gemini']}
        />
      </div>
      <Layout {...props} />
    </>
  );
}
