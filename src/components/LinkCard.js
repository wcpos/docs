import React from 'react';
import Link from '@docusaurus/Link';
import { useActiveVersion } from '@docusaurus/plugin-content-docs/client';
import Icon from '@site/src/components/Icon';
import { versionedTo } from '@site/src/components/version-link';

export default function LinkCard({ to, title, description, icon = 'file-lines' }) {
  // Resolve `to` against the page's own version, not a literal prefix: after
  // the flip the next version moves to the root and a hard-coded path breaks.
  const version = useActiveVersion();
  return (
    <Link to={versionedTo(to, version)} className="link-card">
      <div className="link-card__icon">
        <Icon name={icon} />
      </div>
      <div className="link-card__content">
        <span className="link-card__title">{title}</span>
        {description && (
          <span className="link-card__description">{description}</span>
        )}
      </div>
      <div className="link-card__arrow">
        <Icon name="chevron-right" />
      </div>
    </Link>
  );
}
