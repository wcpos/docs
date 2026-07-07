import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';
import {
  mergeSearchStrings,
  useHistorySelector,
} from '@docusaurus/theme-common';

/**
 * Shared "same page in another locale" URL logic.
 *
 * Extracted from the swizzled LocaleDropdownNavbarItem so the footer locale
 * <select> and the (retained) navbar dropdown compute switch URLs the exact
 * same way — one source of truth for the trailingSlash-tolerant stripping that
 * fixes the /nl//de locale-home bug (see the NavbarItem swizzle header and
 * facebook/docusaurus#9170, #9514).
 *
 * `getURL`  -> a Docusaurus <Link> target (uses `pathname://` for same-domain
 *              locales to force a full reload, since each locale is its own build).
 * `getHref` -> a plain navigable URL for `window.location` / a native <select>.
 */
export function useLocaleDropdownUtils() {
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

  const isSameDomain = (locale) =>
    getLocaleConfig(locale).url === siteConfig.url;

  const getBaseURLForLocale = (locale) => {
    const localizedPath = createLocalizedPath(locale);
    // Same domain -> shorter relative path; `pathname://` forces a full reload
    // (each locale is a separate build). Cross domain -> fully-qualified URL.
    return isSameDomain(locale)
      ? `pathname://${localizedPath}`
      : `${getLocaleConfig(locale).url}${localizedPath}`;
  };

  const getPlainURLForLocale = (locale) => {
    const localizedPath = createLocalizedPath(locale);
    return isSameDomain(locale)
      ? localizedPath
      : `${getLocaleConfig(locale).url}${localizedPath}`;
  };

  const finalSearch = (queryString) =>
    mergeSearchStrings([search, queryString], 'append');

  return {
    getURL: (locale, options = {}) =>
      `${getBaseURLForLocale(locale)}${finalSearch(options.queryString)}${hash}`,
    getHref: (locale, options = {}) =>
      `${getPlainURLForLocale(locale)}${finalSearch(options.queryString)}${hash}`,
    getLabel: (locale) => getLocaleConfig(locale).label,
    getLang: (locale) => getLocaleConfig(locale).htmlLang,
  };
}
