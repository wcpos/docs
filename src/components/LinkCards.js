import React from 'react';

export default function LinkCards({ title = 'Related Documentation', children }) {
  return (
    <section className="link-cards-section">
      {title && <h2>{title}</h2>}
      <div className="link-cards">{children}</div>
    </section>
  );
}
