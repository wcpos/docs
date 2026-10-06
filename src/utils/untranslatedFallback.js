/**
 * True when a doc rendered in a non-default locale is the English source
 * served as a fallback, i.e. it has no translated copy under i18n/<locale>/.
 * Such pages get robots noindex so only real translations are indexed (and,
 * through the sitemap plugin's noindex filter, listed in locale sitemaps).
 */
export function isUntranslatedFallback({source, currentLocale, defaultLocale}) {
  if (currentLocale === defaultLocale) {
    return false;
  }
  return !source.startsWith(`@site/i18n/${currentLocale}/`);
}
