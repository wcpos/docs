import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import { useLocaleDropdownUtils } from '@site/src/utils/localeDropdownUtils';
import styles from './styles.module.css';

/**
 * Footer language switcher — a native <select>, matching the wcpos.com footer.
 *
 * Navigation reuses the shared, trailingSlash-tolerant locale URL logic (the
 * same one the navbar dropdown used) so switching is correct on every page,
 * including locale homes. Each locale is a separate build, so we hard-navigate.
 */
export default function LocaleSelect() {
  const utils = useLocaleDropdownUtils();
  const {
    i18n: { currentLocale, locales },
  } = useDocusaurusContext();

  const onChange = (e) => {
    const locale = e.target.value;
    if (locale === currentLocale) {
      return;
    }
    window.location.href = utils.getHref(locale);
  };

  return (
    <label className={styles.localeSelect}>
      {/* Globe icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <select
        className={styles.select}
        value={currentLocale}
        onChange={onChange}
        aria-label={translate({
          id: 'theme.navbar.mobileLanguageDropdown.label',
          message: 'Languages',
          description: 'The label for the language switcher',
        })}
      >
        {locales.map((locale) => (
          <option key={locale} value={locale} lang={utils.getLang(locale)}>
            {utils.getLabel(locale)}
          </option>
        ))}
      </select>
    </label>
  );
}
