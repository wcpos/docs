import React from 'react';
import ConsentBanner from '@site/src/components/ConsentBanner';

// Root wraps the whole app and persists across navigation — the right place to
// mount the GDPR consent banner so it appears on every docs page.
export default function Root({ children }) {
  return (
    <>
      {children}
      <ConsentBanner />
    </>
  );
}
