import React from 'react';

export default function AccordionItem({ question, children }) {
  return (
    <details className="accordion__item">
      <summary>{question}</summary>
      <div className="accordion__content">{children}</div>
    </details>
  );
}
