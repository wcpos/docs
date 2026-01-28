import React from 'react';

export default function TroubleshootingItem({ question, children }) {
  return (
    <details className="troubleshooting-item">
      <summary>{question}</summary>
      <div className="troubleshooting-content">{children}</div>
    </details>
  );
}
