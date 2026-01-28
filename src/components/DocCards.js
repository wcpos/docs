import React from 'react';
import Link from '@docusaurus/Link';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';
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

function getIconForItem(item) {
  // Try to match by docId or label
  const id = item.docId || item.href || '';
  const label = (item.label || '').toLowerCase();
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (id.includes(key) || label.includes(key)) {
      return icon;
    }
  }
  return iconMap.default;
}

function DocCard({ item }) {
  const href = item.href || (item.docId ? `/${item.docId.replace(/\//g, '/')}` : '#');
  const icon = getIconForItem(item);
  
  return (
    <Link to={href} className="link-card">
      <div className="link-card__icon">
        <Icon name={icon} />
      </div>
      <div className="link-card__content">
        <span className="link-card__title">{item.label}</span>
        {item.description && (
          <span className="link-card__description">{item.description}</span>
        )}
        {item.customProps?.description && (
          <span className="link-card__description">{item.customProps.description}</span>
        )}
      </div>
      <div className="link-card__arrow">
        <Icon name="chevron-right" />
      </div>
    </Link>
  );
}

export default function DocCards({ items }) {
  // If no items provided, get from current sidebar category
  const category = useCurrentSidebarCategory();
  const itemsToRender = items || category?.items || [];

  if (!itemsToRender.length) {
    return null;
  }

  return (
    <div className="link-cards">
      {itemsToRender.map((item, index) => (
        <DocCard key={item.docId || item.href || index} item={item} />
      ))}
    </div>
  );
}
