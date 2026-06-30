import { describe, it, expect } from 'vitest';
import { summarize } from '../summary';

describe('summarize', () => {
  it('renders the collected fields as labelled lines', () => {
    const text = summarize({
      currentId: 'support',
      answers: {
        platform: 'web', browser: 'chrome', scheme: 'https', version: '1.9.6',
        connection: 'network', vendor: 'star', model: 'MCP31LB',
        ip: '192.168.0.25', port: '443', width: '80mm', symptom: 'sent-success-nothing-prints',
        selftestCert: 'none', selftest9100: 'enabled', selftestDhcp: 'on',
      },
    });
    expect(text).toContain('Platform: web');
    expect(text).toContain('Version: 1.9.6');
    expect(text).toContain('Connection: network');
    expect(text).toContain('Vendor: star');
    expect(text).toContain('Self-test: cert=none, tcp9100=enabled, dhcp=on');
    expect(text).toContain('Stuck at: support');
  });

  it('omits fields that were never answered', () => {
    const text = summarize({ currentId: 'support', answers: { platform: 'desktop' } });
    expect(text).toContain('Platform: desktop');
    expect(text).not.toContain('Vendor:');
  });
});
