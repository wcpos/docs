import React from 'react';
import Link from '@docusaurus/Link';
import Icon from '@site/src/components/Icon';

export default function LinkCard({ to, title, description, icon = 'file-lines' }) {
  return (
    <Link to={to} className="link-card">
      <div className="link-card__icon">
        <Icon name={icon} />
      </div>
      <div className="link-card__content">
        <span className="link-card__title">{title}</span>
        {description && (
          <span className="link-card__description">{description}</span>
        )}
      </div>
      <div className="link-card__arrow">
        <Icon name="chevron-right" />
      </div>
    </Link>
  );
}
