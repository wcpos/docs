import React from 'react';
import Link from '@docusaurus/Link';
import Icon from '@site/src/components/Icon';

export default function LinkCard({ to, title, description }) {
  return (
    <Link to={to} className="link-card">
      <div className="link-card__content">
        <h4 className="link-card__title">{title}</h4>
        {description && (
          <p className="link-card__description">{description}</p>
        )}
      </div>
      <div className="link-card__arrow">
        <Icon name="arrow-right" />
      </div>
    </Link>
  );
}
