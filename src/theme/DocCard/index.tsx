import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {
  useDocById,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
import {usePluralForm} from '@docusaurus/theme-common';
import isInternalUrl from '@docusaurus/isInternalUrl';
import {translate} from '@docusaurus/Translate';
import Icon from '@site/src/components/Icon';

import type {Props} from '@theme/DocCard';
import type {
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from '@docusaurus/plugin-content-docs';

// Map paths/labels to icons
const iconMap: Record<string, string> = {
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
  'templates': 'receipt',
  'products': 'box',
  'pos-only': 'store',
  'sync': 'arrow-rotate-right',
  'orders': 'file-invoice',
  'customers': 'users',
  'reports': 'chart-pie',
  'support': 'circle-question',
  'troubleshooting': 'warning',
  'performance': 'bolt',
  'logs': 'terminal',
  'payment': 'credit-card',
  'settings': 'sliders',
};

function getIconName(href: string, label: string): string {
  const searchStr = `${href} ${label}`.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (searchStr.includes(key)) {
      return icon;
    }
  }
  return 'file-lines';
}

function useCategoryItemsPlural() {
  const {selectMessage} = usePluralForm();
  return (count: number) =>
    selectMessage(
      count,
      translate(
        {
          message: '1 item|{count} items',
          id: 'theme.docs.DocCard.categoryDescription.plurals',
          description:
            'The default description for a category card in the generated index about how many items this category includes',
        },
        {count},
      ),
    );
}

function CardLayout({
  href,
  iconName,
  title,
  description,
}: {
  href: string;
  iconName: string;
  title: string;
  description?: string;
}): ReactNode {
  return (
    <Link href={href} className="link-card">
      <div className="link-card__icon">
        <Icon name={iconName} />
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

function CardCategory({item}: {item: PropSidebarItemCategory}): ReactNode {
  const href = findFirstSidebarItemLink(item);
  const categoryItemsPlural = useCategoryItemsPlural();

  if (!href) {
    return null;
  }

  const iconName = getIconName(href, item.label);

  return (
    <CardLayout
      href={href}
      iconName={iconName}
      title={item.label}
      description={item.description ?? categoryItemsPlural(item.items.length)}
    />
  );
}

function CardLink({item}: {item: PropSidebarItemLink}): ReactNode {
  const doc = useDocById(item.docId ?? undefined);
  const iconName = isInternalUrl(item.href) 
    ? getIconName(item.href, item.label)
    : 'link';

  return (
    <CardLayout
      href={item.href}
      iconName={iconName}
      title={item.label}
      description={item.description ?? doc?.description}
    />
  );
}

export default function DocCard({item}: Props): ReactNode {
  switch (item.type) {
    case 'link':
      return <CardLink item={item} />;
    case 'category':
      return <CardCategory item={item} />;
    default:
      throw new Error(`unknown item type ${JSON.stringify(item)}`);
  }
}
