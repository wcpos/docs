/* eslint-disable react/prop-types -- Swizzled from an upstream TypeScript
   component (no prop-types); this repo re-enables the rule via a later spread. */
import React from 'react';
import { translate } from '@docusaurus/Translate';

/**
 * Swizzled expand affordance for the collapsed sidebar rail.
 *
 * Matches the swizzled collapse chevron (DocSidebar/Desktop): a single clean
 * chevron near the top, but the whole rail stays clickable (styled in
 * custom.css as .wcpos-sidebar-expand, position:absolute inset:0). Replaces the
 * default filled block + double-arrow icon.
 */
const ChevronRight = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default function DocRootLayoutSidebarExpandButton({ toggleSidebar }) {
  return (
    <div
      className="wcpos-sidebar-expand"
      title={translate({
        id: 'theme.docs.sidebar.expandButtonTitle',
        message: 'Expand sidebar',
        description:
          'The ARIA label and title attribute for expand button of doc sidebar',
      })}
      aria-label={translate({
        id: 'theme.docs.sidebar.expandButtonAriaLabel',
        message: 'Expand sidebar',
        description:
          'The ARIA label and title attribute for expand button of doc sidebar',
      })}
      tabIndex={0}
      role="button"
      onKeyDown={toggleSidebar}
      onClick={toggleSidebar}
    >
      {ChevronRight}
    </div>
  );
}
