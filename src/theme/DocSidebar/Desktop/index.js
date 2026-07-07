/* eslint-disable react/prop-types -- Swizzled from an upstream TypeScript
   component (no prop-types); this repo re-enables the rule via a later spread. */
import React from 'react';
import clsx from 'clsx';
import { useThemeConfig } from '@docusaurus/theme-common';
import { translate } from '@docusaurus/Translate';
import Logo from '@theme/Logo';
import Content from '@theme/DocSidebar/Desktop/Content';
import styles from './styles.module.css';

/**
 * Swizzled DocSidebar/Desktop.
 *
 * The only change vs. upstream: instead of the default full-width "collapse"
 * bar pinned to the bottom of the sidebar (which, paired with the floating
 * expand chevron on the collapsed rail, reads as two clunky mystery buttons),
 * we render a single small chevron at the TOP of the sidebar that toggles it.
 * The collapsed-state expand affordance is the rail itself (see the swizzled
 * ExpandButton). onCollapse is the same toggle handler upstream passes down.
 */
const ChevronLeft = (
  <svg
    className="wcpos-sidebar-chevron"
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
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

function DocSidebarDesktop({ path, sidebar, onCollapse, isHidden }) {
  const {
    navbar: { hideOnScroll },
    docs: {
      sidebar: { hideable },
    },
  } = useThemeConfig();

  return (
    <div
      className={clsx(
        styles.sidebar,
        hideOnScroll && styles.sidebarWithHideableNavbar,
        isHidden && styles.sidebarHidden
      )}
    >
      {hideOnScroll && <Logo tabIndex={-1} className={styles.sidebarLogo} />}
      {hideable && (
        <div className="wcpos-sidebar-toolbar">
          <button
            type="button"
            className="wcpos-sidebar-collapse"
            onClick={onCollapse}
            title={translate({
              id: 'theme.docs.sidebar.collapseButtonTitle',
              message: 'Collapse sidebar',
              description:
                'The title attribute for collapse button of doc sidebar',
            })}
            aria-label={translate({
              id: 'theme.docs.sidebar.collapseButtonAriaLabel',
              message: 'Collapse sidebar',
              description:
                'The title attribute for collapse button of doc sidebar',
            })}
          >
            {ChevronLeft}
          </button>
        </div>
      )}
      <Content path={path} sidebar={sidebar} />
    </div>
  );
}

export default React.memo(DocSidebarDesktop);
