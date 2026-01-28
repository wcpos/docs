import React from 'react';
import Icon from '@site/src/components/Icon';

export default function UseCaseCard({ icon, title, children }) {
  return (
    <div className="use-case-card">
      <div className="use-case-header">
        <Icon name={icon} size="lg" />
        <h4>{title}</h4>
      </div>
      <div className="use-case-content">{children}</div>
    </div>
  );
}
