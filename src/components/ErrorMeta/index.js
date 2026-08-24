import React from 'react';
import Translate from '@docusaurus/Translate';
import catalogue from '@site/src/data/error-catalogue.json';
import { lookupError } from './lookup';
import styles from './styles.module.css';

/**
 * ErrorMeta — renders the factual "Details" box of an error-code help page
 * (code + symbol, severity, introduced-in) from the data-only facts manifest
 * (`src/data/error-catalogue.json`), which is bot-synced from the monorepo
 * registry. The facts are IMPORTED, never hand-copied into the page, so they
 * cannot drift from the runtime catalogue. The page owns everything else — the
 * prose, images, wizards — and is free to be as rich as it needs to be.
 *
 * Usage in an error-code .mdx:  <ErrorMeta code="AUTH331" />
 */

export default function ErrorMeta({ code }) {
  const meta = lookupError(code, catalogue);

  if (!meta) {
    // A page referencing an unknown code is a coverage-contract violation; the
    // CI check catches it. Fail loudly in dev, render nothing in production.
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `ErrorMeta: "${code}" is not in the error catalogue manifest. ` +
          `Every error-code page must map to a registry code (see ` +
          `scripts/check-error-code-coverage.js).`
      );
    }
    return null;
  }

  return (
    <dl className={styles.meta}>
      <div className={styles.row}>
        <dt>
          <Translate id="errorMeta.code" description="Error details: code label">
            Code
          </Translate>
        </dt>
        <dd>
          <code>{meta.code}</code> (<code>{meta.symbol}</code>)
        </dd>
      </div>
      <div className={styles.row}>
        <dt>
          <Translate
            id="errorMeta.severity"
            description="Error details: severity label"
          >
            Severity
          </Translate>
        </dt>
        <dd>{meta.severity}</dd>
      </div>
      <div className={styles.row}>
        <dt>
          <Translate
            id="errorMeta.introducedIn"
            description="Error details: introduced-in label"
          >
            Introduced in
          </Translate>
        </dt>
        <dd>WCPOS {meta.introducedIn}</dd>
      </div>
    </dl>
  );
}
