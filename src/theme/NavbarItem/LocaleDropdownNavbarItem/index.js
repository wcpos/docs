/* eslint-disable react/prop-types -- Swizzled from an upstream TypeScript
   component (no prop-types). This repo intends react/prop-types off: it is set
   to 'off' in eslint.config.mjs, but a later `...react.configs.recommended.rules`
   spread re-enables it. */
import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';
import { translate } from '@docusaurus/Translate';
import {
  mergeSearchStrings,
  useHistorySelector,
} from '@docusaurus/theme-common';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import IconLanguage from '@theme/Icon/Language';
import styles from './styles.module.css';

/**
 * Swizzled (ejected) copy of theme-classic's LocaleDropdownNavbarItem.
 *
 * The ONLY behavioural change vs. upstream is how the "same page in another
 * locale" URL is computed.
 *
 * Upstream uses `useAlternatePageUtils().createUrl`, which strips the current
 * locale via `pathname.replace(localeBaseUrl)`. The locale baseUrl always ends
 * in a slash (e.g. "/nl/"), but our locale-home pages are served WITHOUT a
 * trailing slash ("/nl", because vercel.json sets `trailingSlash: false`). So
 * the replace fails to strip the locale and the dropdown produces stacked URLs
 * like "/nl//de" -> "/nl/de" — breaking language switching from any locale
 * home. See facebook/docusaurus#9170 and #9514.
 *
 * Here we strip the current locale by its known baseUrl, tolerant of a missing
 * trailing slash, so switching is correct on every page (including locale
 * homes) and SSR/client agree (no hydration mismatch). This changes nothing
 * about routing, generated URLs, or SEO — only the dropdown's hrefs.
 */
function useLocaleDropdownUtils() {
  const {
    siteConfig,
    i18n: { currentLocale, localeConfigs },
  } = useDocusaurusContext();
  const { pathname } = useLocation();
  const search = useHistorySelector((history) => history.location.search);
  const hash = useHistorySelector((history) => history.location.hash);

  const getLocaleConfig = (locale) => {
    const localeConfig = localeConfigs[locale];
    if (!localeConfig) {
      throw new Error(
        `Docusaurus bug, no locale config found for locale=${locale}`
      );
    }
    return localeConfig;
  };

  // The current page path relative to the current locale, tolerant of a missing
  // trailing slash. Examples (current locale = nl, baseUrl "/nl/"):
  //   "/nl"      -> "/"            (locale home)
  //   "/nl/foo"  -> "/foo"
  // For the default locale (baseUrl "/") the path is already unprefixed.
  const currentBaseNoSlash = getLocaleConfig(currentLocale).baseUrl.replace(
    /\/$/,
    ''
  );
  let pageSuffix;
  if (currentBaseNoSlash === '') {
    pageSuffix = pathname;
  } else if (pathname === currentBaseNoSlash) {
    pageSuffix = '/';
  } else if (pathname.startsWith(`${currentBaseNoSlash}/`)) {
    pageSuffix = pathname.slice(currentBaseNoSlash.length);
  } else {
    pageSuffix = pathname;
  }

  const createLocalizedPath = (locale) => {
    const targetBaseUrl = getLocaleConfig(locale).baseUrl; // always ends with "/"
    if (pageSuffix === '/') {
      return targetBaseUrl;
    }
    return `${targetBaseUrl.replace(/\/$/, '')}${pageSuffix}`;
  };

  const getBaseURLForLocale = (locale) => {
    const localeConfig = getLocaleConfig(locale);
    const localizedPath = createLocalizedPath(locale);
    const isSameDomain = localeConfig.url === siteConfig.url;
    // Same domain -> shorter relative path; `pathname://` forces a full reload
    // (each locale is a separate build). Cross domain -> fully-qualified URL.
    return isSameDomain
      ? `pathname://${localizedPath}`
      : `${localeConfig.url}${localizedPath}`;
  };

  return {
    getURL: (locale, options) => {
      const finalSearch = mergeSearchStrings(
        [search, options.queryString],
        'append'
      );
      return `${getBaseURLForLocale(locale)}${finalSearch}${hash}`;
    },
    getLabel: (locale) => getLocaleConfig(locale).label,
    getLang: (locale) => getLocaleConfig(locale).htmlLang,
  };
}

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
