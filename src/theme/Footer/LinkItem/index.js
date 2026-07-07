/* eslint-disable react/prop-types -- Swizzled from an upstream TypeScript
   component (no prop-types); this repo re-enables the rule via a later spread. */
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';

/**
 * WCPOS-owned hosts (the marketing site + its subdomains). Links to these read
 * as part of the same product, so we suppress the external-link icon — only
 * truly third-party links (github.com, wordpress.org, app stores) keep it.
 */
function isWcposOwned(href) {
  try {
    const { hostname } = new URL(href, 'https://docs.wcpos.com');
    return hostname === 'wcpos.com' || hostname.endsWith('.wcpos.com');
  } catch (_e) {
    return false;
  }
}

/**
 * Swizzled Footer link item — identical to upstream except the external-link
 * icon only renders for genuinely external destinations, not for wcpos.com.
 */
export default function FooterLinkItem({ item }) {
  const { to, href, label, prependBaseUrlToHref, className, ...props } = item;
  const toUrl = useBaseUrl(to);
  const normalizedHref = useBaseUrl(href, { forcePrependBaseUrl: true });
  const showExternalIcon = href && !isInternalUrl(href) && !isWcposOwned(href);

  return (
    <Link
      className={clsx('footer__link-item', className)}
      {...(href
        ? {
            href: prependBaseUrlToHref ? normalizedHref : href,
          }
        : {
            to: toUrl,
          })}
      {...props}
    >
      {label}
      {showExternalIcon && <IconExternalLink />}
    </Link>
  );
}
