/* global describe, expect, it */
const fs = require('node:fs');
const path = require('node:path');

describe('docs PostHog analytics configuration', () => {
  const posthogClient = fs.readFileSync(
    path.join(__dirname, '../../src/analytics/posthog.js'),
    'utf8'
  );

  it('uses the self-hosted PostHog origin for browser ingest', () => {
    expect(posthogClient).toContain("const API_HOST = 'https://ph.wcpos.com'");
    expect(posthogClient).not.toContain('https://analytics.wcpos.com');
  });

  it('does not start browser session recording on the docs site', () => {
    expect(posthogClient).toContain('disable_session_recording: true');
  });
});
