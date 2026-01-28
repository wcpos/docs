import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Icon from '@site/src/components/Icon';

// Map of category/doc paths to icons
const iconMap = {
  'custom-gateways': 'credit-card',
  'stripe-terminal': 'credit-card',
  'sumup-terminal': 'credit-card',
  'email-invoice': 'envelope',
  'web-checkout': 'globe',
  'gateway-template': 'code',
  'wp-admin': 'sliders',
  'store': 'store',
  'general': 'sliders',
  'checkout': 'cart-shopping',
  'access': 'users',
  'tax': 'calculator',
  'barcode': 'barcode',
  'hotkeys': 'keyboard',
  'theme': 'desktop',
  'receipt-templates': 'receipt',
  'default': 'file-lines',
};

function getIconForPath(path) {
  const pathLower = (path || '').toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (pathLower.includes(key)) {
      return icon;
    }
  }
  return iconMap.default;
}

function DocCard({ to, title, description, icon }) {
  const resolvedIcon = icon || getIconForPath(to);
  
  return (
    <Link to={to} className="link-card">
      <div className="link-card__icon">
        <Icon name={resolvedIcon} />
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

export default function DocCards({ children }) {
  return (
    <div className="link-cards">
      {children}
    </div>
  );
}

export { DocCard };
