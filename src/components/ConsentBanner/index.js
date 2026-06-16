import React, { useEffect, useState } from 'react';
import Translate from '@docusaurus/Translate';
import {
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from '@site/src/analytics/consent';
import { startPostHog } from '@site/src/analytics/posthog';
import styles from './styles.module.css';

/**
 * GDPR analytics consent banner — same model and copy as the website
 * (wcpos-com ConsentBanner). Shown only when no decision has been recorded.
 * Accepting starts PostHog in the same session; declining keeps it off.
 *
 * Renders nothing on the server / before mount to avoid a hydration flash.
 */
export default function ConsentBanner() {
  const [decided, setDecided] = useState(true);

  useEffect(() => {
    setDecided(readAnalyticsConsent() !== null);
  }, []);

  if (decided) {
    return null;
  }

  const decide = (status) => {
    writeAnalyticsConsent(status);
    if (status === 'granted') {
      startPostHog();
    }
    setDecided(true);
  };

  return (
    <div className={styles.banner} role="region" aria-label="Cookie consent">
      <p className={styles.text}>
        <Translate id="consent.text">
          We use an anonymous analytics cookie to understand how the docs are
          used. No ads, no third-party tracking.
        </Translate>{' '}
        <a
          href="https://wcpos.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          <Translate id="consent.privacy">Privacy policy</Translate>
        </a>
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.decline}
          onClick={() => decide('denied')}
        >
          <Translate id="consent.decline">Decline</Translate>
        </button>
        <button
          type="button"
          className={styles.accept}
          onClick={() => decide('granted')}
        >
          <Translate id="consent.accept">Accept</Translate>
        </button>
      </div>
    </div>
  );
}
