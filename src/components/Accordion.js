import React from 'react';

export default function Accordion({ title = 'Troubleshooting', children }) {
  return (
    <section className="accordion">
      {title && <h2>{title}</h2>}
      <div className="accordion__items">{children}</div>
    </section>
  );
}
