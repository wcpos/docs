import React from 'react';
import Icon from '@site/src/components/Icon';

const platformConfig = {
  web: { icon: 'globe', label: 'Web' },
  windows: { icon: 'windows', label: 'Windows' },
  mac: { icon: 'apple', label: 'Mac' },
  'mac-intel': { icon: 'apple', label: 'Mac (Intel)' },
  'mac-arm': { icon: 'apple', label: 'Mac (Apple Silicon)' },
  ios: { icon: 'apple', label: 'iOS' },
  android: { icon: 'android', label: 'Android' },
};

export function PlatformBadge({ platform, href, label }) {
  const config = platformConfig[platform] || { icon: 'globe', label: platform };
  const displayLabel = label || config.label;

  return (
    <a href={href} className="platform-badge" target="_blank" rel="noopener noreferrer">
      <Icon name={config.icon} />
      <span>{displayLabel}</span>
    </a>
  );
}

export function PlatformBadges({ children }) {
  return (
    <div className="platform-badges">
      {children}
    </div>
  );
}

export default PlatformBadge;
