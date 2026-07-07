import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useColorMode } from '@docusaurus/theme-common';
import { translate } from '@docusaurus/Translate';
import styles from './styles.module.css';

const SunIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const MonitorIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

/**
 * Footer theme switcher — Light / Dark / System, matching wcpos.com.
 *
 * Docusaurus 3.10 models "system" as a null color-mode choice: setColorMode(null)
 * follows the OS (when themeConfig.colorMode.respectPrefersColorScheme is true),
 * 'light'/'dark' pin an explicit choice. colorModeChoice is null | 'light' | 'dark'.
 *
 * We only apply the active highlight after mount: the server can't know the
 * visitor's stored choice, so a first render with no highlight keeps SSR and
 * client markup identical (no hydration mismatch), then the effect lights it up.
 */
export default function ThemeToggle() {
  const { colorModeChoice, setColorMode } = useColorMode();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // colorModeChoice is null (system) | 'light' | 'dark' — `|| 'system'` maps the
  // null case; it's never '' or 0, so this is equivalent to nullish coalescing
  // (which the repo's eslint parser doesn't accept).
  const active = mounted ? colorModeChoice || 'system' : null;

  const options = [
    {
      key: 'light',
      icon: SunIcon,
      label: translate({
        id: 'theme.colorToggle.light',
        message: 'Light',
        description: 'Light theme button',
      }),
      onClick: () => setColorMode('light'),
    },
    {
      key: 'dark',
      icon: MoonIcon,
      label: translate({
        id: 'theme.colorToggle.dark',
        message: 'Dark',
        description: 'Dark theme button',
      }),
      onClick: () => setColorMode('dark'),
    },
    {
      key: 'system',
      icon: MonitorIcon,
      label: translate({
        id: 'theme.colorToggle.system',
        message: 'System',
        description: 'System theme button',
      }),
      onClick: () => setColorMode(null),
    },
  ];

  return (
    <div
      className={styles.themeToggle}
      role="group"
      aria-label={translate({
        id: 'theme.colorToggle.groupLabel',
        message: 'Theme',
        description: 'Theme switcher group label',
      })}
    >
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          className={clsx(
            styles.themeButton,
            active === o.key && styles.themeButtonActive
          )}
          onClick={o.onClick}
          title={o.label}
          aria-label={o.label}
          aria-pressed={active === o.key}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
