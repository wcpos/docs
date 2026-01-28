import React from 'react';

export default function StepCard({ number, title, children }) {
  return (
    <div className="step-card">
      <div className="step-card__number">{number}</div>
      <div className="step-card__content">
        <h4 className="step-card__title">{title}</h4>
        <div className="step-card__body">{children}</div>
      </div>
    </div>
  );
}
