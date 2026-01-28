import React from 'react';

export default function StepCard({ number, title, children, isLast }) {
  return (
    <div className={`step-card ${isLast ? 'step-card--last' : ''}`}>
      <div className="step-card__timeline">
        <div className="step-card__number">{number}</div>
        {!isLast && <div className="step-card__line" />}
      </div>
      <div className="step-card__content">
        <h4 className="step-card__title">{title}</h4>
        <div className="step-card__body">{children}</div>
      </div>
    </div>
  );
}
