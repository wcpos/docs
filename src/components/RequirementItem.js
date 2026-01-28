import React from 'react';
import Icon from '@site/src/components/Icon';

export default function RequirementItem({ label, children }) {
  return (
    <div className="requirement-item">
      <div className="requirement-item__icon">
        <Icon name="check" />
      </div>
      <div className="requirement-item__content">
        <span className="requirement-item__label">{label}:</span>{' '}
        <span className="requirement-item__value">{children}</span>
      </div>
    </div>
  );
}
