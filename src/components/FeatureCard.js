import React from 'react';
import Icon from '@site/src/components/Icon';

export default function FeatureCard({ icon, title, children, variant }) {
  const className = variant === 'pro' 
    ? 'feature-card feature-card--pro' 
    : 'feature-card';

  return (
    <div className={className}>
      {icon && (
        <div className="feature-card__icon">
          <Icon name={icon} size="lg" />
        </div>
      )}
      <h3 className="feature-card__title">{title}</h3>
      <div className="feature-card__description">{children}</div>
    </div>
  );
}
