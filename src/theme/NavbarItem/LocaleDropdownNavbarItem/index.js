/* eslint-disable react/prop-types -- Swizzled from an upstream TypeScript
   component (no prop-types). This repo intends react/prop-types off: it is set
   to 'off' in eslint.config.mjs, but a later `...react.configs.recommended.rules`
   spread re-enables it. */
import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import IconLanguage from '@theme/Icon/Language';
import { useLocaleDropdownUtils } from '@site/src/utils/localeDropdownUtils';
import { rememberLocalePreference } from '@site/src/utils/localePreference';
import styles from './styles.module.css';

/**
 * Swizzled (ejected) copy of theme-classic's LocaleDropdownNavbarItem.
 *
 * Behavioural changes vs. upstream:
 * - how the "same page in another locale" URL is computed — see
 *   src/utils/localeDropdownUtils.js for the trailingSlash-tolerant stripping
 *   and why it exists (facebook/docusaurus#9170, #9514). That logic is shared
 *   with the footer locale <select>.
 * - picking a locale stores it as an explicit preference cookie so the edge
 *   middleware's Accept-Language detection respects it (middleware.js).
 *
 * Note: the navbar no longer configures a `localeDropdown` item (the language
 * switcher lives in the footer now, mirroring wcpos.com). This component is
 * retained so re-adding a navbar dropdown stays a one-line config change.
 */
export default function LocaleDropdownNavbarItem({
  mobile,
  dropdownItemsBefore,
  dropdownItemsAfter,
  queryString,
  ...props
}) {
  const utils = useLocaleDropdownUtils();
  const {
    i18n: { currentLocale, locales },
  } = useDocusaurusContext();
  const localeItems = locales.map((locale) => {
    let className = '';
    if (locale === currentLocale) {
      // Match upstream: select the right Infima active class. Can't use isActive
      // because the target URLs contain `pathname://` and aren't NavLinks.
      className = mobile ? 'menu__link--active' : 'dropdown__link--active';
    }
    return {
      label: utils.getLabel(locale),
      lang: utils.getLang(locale),
      to: utils.getURL(locale, { queryString }),
      target: '_self',
      autoAddBaseUrl: false,
      className,
      // Explicit choice: overrides the edge middleware's Accept-Language
      // detection on the site root (see middleware.js).
      onClick: () => rememberLocalePreference(locale),
    };
  });
  const items = [...dropdownItemsBefore, ...localeItems, ...dropdownItemsAfter];
  const dropdownLabel = mobile
    ? translate({
        message: 'Languages',
        id: 'theme.navbar.mobileLanguageDropdown.label',
        description: 'The label for the mobile language switcher dropdown',
      })
    : utils.getLabel(currentLocale);
  return (
    <DropdownNavbarItem
      {...props}
      mobile={mobile}
      label={
        <>
          <IconLanguage className={styles.iconLanguage} />
          {dropdownLabel}
        </>
      }
      items={items}
    />
  );
}
