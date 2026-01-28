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
      <h4 className="feature-card__title">{title}</h4>
      <div className="feature-card__description">{children}</div>
    </div>
  );
}
