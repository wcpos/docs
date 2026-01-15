import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCashRegister,
  faGift,
  faReceipt,
  faUsers,
  faChartLine,
  faHeartPulse,
  faCircleQuestion,
  faCartShopping,
  faSliders,
  faPlus,
  faArrowRight,
  faEllipsisVertical,
  faXmark,
  faPrint,
  faEnvelope,
  faSearch,
  faBarcode,
  faCheck,
  faClock,
  faExclamationTriangle,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';

// Map of icon names to FontAwesome icons
const iconMap = {
  'cash-register': faCashRegister,
  'gift': faGift,
  'gifts': faGift,
  'receipt': faReceipt,
  'users': faUsers,
  'chart-line': faChartLine,
  'chart-mixed-up-circle-dollar': faChartLine,
  'heart-pulse': faHeartPulse,
  'circle-question': faCircleQuestion,
  'comment-question': faCircleQuestion,
  'cart-shopping': faCartShopping,
  'sliders': faSliders,
  'plus': faPlus,
  'arrow-right': faArrowRight,
  'ellipsis-vertical': faEllipsisVertical,
  'xmark': faXmark,
  'print': faPrint,
  'envelope': faEnvelope,
  'search': faSearch,
  'barcode': faBarcode,
  'check': faCheck,
  'clock': faClock,
  'warning': faExclamationTriangle,
  'info': faCircleInfo,
};

export default function Icon({ name, size = '1x', color, className, ...props }) {
  const icon = iconMap[name];
  
  if (!icon) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }

  return (
    <FontAwesomeIcon 
      icon={icon} 
      size={size}
      color={color}
      className={className}
      {...props}
    />
  );
}
