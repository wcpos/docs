import React, { useEffect, useRef } from 'react';

export default function AccordionItem({ question, children }) {
  const ref = useRef(null);

  // Open this item when the URL hash targets an element inside it, so
  // anchor links (e.g. a table of contents or the receipt map) can
  // deep-link into collapsed content.
  useEffect(() => {
    const openForHash = () => {
      const { hash } = window.location;
      if (!hash || !ref.current || ref.current.open) return;
      let id = hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch (e) {
        // malformed escape — use the raw hash
      }
      const target = document.getElementById(id);
      if (target && ref.current.contains(target)) {
        ref.current.open = true;
        requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
      }
    };
    openForHash();
    window.addEventListener('hashchange', openForHash);
    return () => window.removeEventListener('hashchange', openForHash);
  }, []);

  return (
    <details ref={ref} className="accordion__item">
      <summary>{question}</summary>
      <div className="accordion__content">{children}</div>
    </details>
  );
}
