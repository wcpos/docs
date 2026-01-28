import React from 'react';
import Icon from '@site/src/components/Icon';

export default function SupportContact({ discord = true, email = true }) {
  return (
    <div className="support-contact">
      {discord && (
        <a
          href="https://wcpos.com/discord"
          target="_blank"
          rel="noopener noreferrer"
          className="support-contact__item"
        >
          <Icon name="discord" />
          <span>Discord Community</span>
        </a>
      )}
      {email && (
        <a href="mailto:support@wcpos.com" className="support-contact__item">
          <Icon name="envelope" />
          <span>support@wcpos.com</span>
        </a>
      )}
    </div>
  );
}
