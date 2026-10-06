/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Translate from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

export default function NotFoundContent({className}) {
  return (
    <main className={clsx('container margin-vert--xl', className)}>
      <div className="row">
        <div className="col col--6 col--offset-3">
          <Heading as="h1" className="hero__title">
            <Translate id="theme.NotFound.title" description="The title of the 404 page">
              Page Not Found
            </Translate>
          </Heading>
          <p>
            <Translate id="theme.NotFound.p1" description="The first paragraph of the 404 page">
              We could not find what you were looking for.
            </Translate>
          </p>
          <form role="search" method="get" action={useBaseUrl('/search')}>
            <label htmlFor="not-found-search">
              <Translate id="notFound.searchLabel" description="404 page: search field label">
                Search the docs
              </Translate>
            </label>
            <div className={styles.searchRow}>
              <input id="not-found-search" type="search" name="q" className={styles.searchInput} />
              <button type="submit" className="button button--primary">
                <Translate id="notFound.searchButton" description="404 page: search submit button">
                  Search
                </Translate>
              </button>
            </div>
          </form>
          <p className={styles.linksIntro}>
            <Translate id="notFound.linksIntro" description="404 page: lead-in to the list of links">
              Or start from one of these pages:
            </Translate>
          </p>
          <ul className={styles.links}>
            <li>
              <Link to="/getting-started/installation">
                <Translate id="notFound.gettingStarted" description="404 page: link to the installation guide">
                  Getting started
                </Translate>
              </Link>
            </li>
            <li>
              <Link to="/error-codes">
                <Translate id="notFound.errorCodes" description="404 page: link to the error code reference">
                  Error codes
                </Translate>
              </Link>
            </li>
            <li>
              <Link href="https://wcpos.com/support">
                <Translate id="notFound.support" description="404 page: link to WCPOS support">
                  Get support
                </Translate>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
