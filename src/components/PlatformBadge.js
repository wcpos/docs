import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWindows, 
  faApple, 
  faAndroid 
} from '@fortawesome/free-brands-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

const platformConfig = {
  web: { icon: faGlobe, label: 'Web' },
  windows: { icon: faWindows, label: 'Windows' },
  mac: { icon: faApple, label: 'Mac' },
  'mac-intel': { icon: faApple, label: 'Mac (Intel)' },
  'mac-arm': { icon: faApple, label: 'Mac (Apple Silicon)' },
  ios: { icon: faApple, label: 'iOS' },
  android: { icon: faAndroid, label: 'Android' },
};

export function PlatformBadge({ platform, href, label }) {
  const config = platformConfig[platform] || { icon: faGlobe, label: platform };
  const displayLabel = label || config.label;

  return (
    <a href={href} className="platform-badge" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={config.icon} />
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
