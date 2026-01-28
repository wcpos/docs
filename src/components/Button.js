import React from 'react';
import Icon from '@site/src/components/Icon';

/**
 * Button component for consistent styled buttons/links throughout the docs.
 * 
 * @param {string} href - URL for the button (renders as <a>)
 * @param {string} label - Button text (use this instead of children to avoid MDX <p> wrapping)
 * @param {string} icon - Optional FontAwesome icon name (left side)
 * @param {string} iconRight - Optional FontAwesome icon name (right side)
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' (default: 'secondary')
 * @param {boolean} external - Opens in new tab if true
 * @param {string} size - 'sm' | 'md' (default: 'md')
 */
export function Button({ 
  href, 
  label,
  icon, 
  iconRight,
  variant = 'secondary', 
  external = true,
  size = 'md',
}) {
  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const hasRightIcon = Boolean(iconRight);
  const isDownload = iconRight === 'download';
  
  return (
    <a 
      href={href} 
      className={`doc-button doc-button--${variant} doc-button--${size}${hasRightIcon ? ' doc-button--has-right-icon' : ''}${isDownload ? ' doc-button--download' : ''}`}
      {...externalProps}
    >
      {icon && <Icon name={icon} />}
      <span>{label}</span>
      {iconRight && <Icon name={iconRight} className="doc-button-icon-right" />}
    </a>
  );
}

/**
 * ButtonGroup wraps multiple buttons with consistent spacing.
 */
export function ButtonGroup({ children, direction = 'row' }) {
  return (
    <div className={`doc-button-group doc-button-group--${direction}`}>
      {children}
    </div>
  );
}

export default Button;
