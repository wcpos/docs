import React from 'react';
import Icon from '@site/src/components/Icon';

/**
 * A consistent "coming soon" callout for features that are planned but not yet
 * shipped. Keep these greppable — when a feature ships, replace the <ComingSoon>
 * block with real documentation.
 *
 * Usage:
 *   <ComingSoon>Split payments are planned.</ComingSoon>
 *   <ComingSoon href="https://github.com/orgs/wcpos/projects/4">...</ComingSoon>
 */
export default function ComingSoon({
  children,
  href = 'https://github.com/orgs/wcpos/projects/4',
}) {
  return (
    <div className="coming-soon">
      <span className="coming-soon__badge">
        <Icon name="rocket" />
        Coming soon
      </span>
      <div className="coming-soon__body">
        {children}{' '}
        <a href={href} target="_blank" rel="noopener noreferrer">
          Follow it on the roadmap →
        </a>
      </div>
    </div>
  );
}
