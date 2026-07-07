/* eslint-disable react/prop-types -- Swizzled from an upstream TypeScript
   component (no prop-types). This repo intends react/prop-types off, but a later
   `...react.configs.recommended.rules` spread re-enables it (see the
   LocaleDropdownNavbarItem swizzle for the same note). */
import React from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import LocaleSelect from '@site/src/components/Footer/LocaleSelect';
import ThemeToggle from '@site/src/components/Footer/ThemeToggle';
import SocialLinks from '@site/src/components/Footer/SocialLinks';
import controls from '@site/src/components/Footer/styles.module.css';

/**
 * Swizzled Footer layout.
 *
 * Same link columns as upstream, but the bottom row mirrors wcpos.com: the
 * copyright sits on the left and the utility controls — language switcher,
 * light/dark/system theme toggle, and social links — sit on the right. These
 * controls used to live in the navbar; consolidating them here keeps the two
 * sites' chrome consistent and declutters the header.
 */
export default function FooterLayout({ style, links, logo, copyright }) {
  return (
    <footer
      className={clsx(ThemeClassNames.layout.footer.container, 'footer', {
        'footer--dark': style === 'dark',
      })}
    >
      <div className="container container-fluid">
        {links}
        <div className={controls.bottomBar}>
          <div className={controls.copyright}>
            {logo && <div className="margin-bottom--sm">{logo}</div>}
            {copyright}
          </div>
          <div className={controls.controls}>
            <LocaleSelect />
            <ThemeToggle />
            <SocialLinks />
          </div>
        </div>
      </div>
    </footer>
  );
}
