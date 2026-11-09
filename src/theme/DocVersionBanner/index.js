/* eslint-disable react/prop-types -- Wraps an upstream TypeScript theme
   component (no prop-types), like the other swizzles in src/theme. */
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import { useDocsVersion } from '@docusaurus/plugin-content-docs/client';
import { ThemeClassNames } from '@docusaurus/theme-common';
import DocVersionBanner from '@theme-original/DocVersionBanner';

// 1.x readers are often blocked, not lagging: 2.0 needs WooCommerce 9.0 or
// later, so the default "no longer maintained" text is wrong for them
// (wcpos/roadmap#367). Every other version keeps the default banner.
const BLOCKED_VERSION = '1.x';

export default function DocVersionBannerWrapper(props) {
  const { version } = useDocsVersion();
  if (version !== BLOCKED_VERSION) {
    return <DocVersionBanner {...props} />;
  }
  return (
    <div
      className={clsx(
        props.className,
        ThemeClassNames.docs.docVersionBanner,
        'alert alert--warning margin-bottom--md'
      )}
      role="alert"
    >
      <Translate
        id="wcpos.docs.versionBanner.1x"
        description="Banner on every WCPOS 1.x docs page"
        values={{
          upgradeLink: (
            <Link to="/getting-started/upgrading-to-2">
              <Translate
                id="wcpos.docs.versionBanner.1x.upgradeLink"
                description="Link text in the 1.x docs banner, to the 2.0 upgrade guide"
              >
                check before you upgrade
              </Translate>
            </Link>
          ),
        }}
      >
        {
          "You're reading the docs for WCPOS 1.x. WCPOS 2.0 needs WooCommerce 9.0 or later: {upgradeLink}."
        }
      </Translate>
    </div>
  );
}
