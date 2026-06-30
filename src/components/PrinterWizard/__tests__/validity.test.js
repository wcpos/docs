import { describe, it, expect } from 'vitest';
import { validity } from '../validity';

describe('validity precedence', () => {
  it('iOS + USB is invalid regardless of vendor', () => {
    expect(validity('epson', 'usb', 'ios')).toEqual({ status: 'invalid', reasonKey: 'ios-usb' });
    expect(validity('generic', 'usb', 'ios')).toEqual({ status: 'invalid', reasonKey: 'ios-usb' });
  });

  it('web + network + generic is invalid (no raw TCP)', () => {
    expect(validity('generic', 'network', 'web', 'chrome')).toEqual({ status: 'invalid', reasonKey: 'web-generic-network' });
  });

  it('web + BT/USB on Safari/Firefox is invalid', () => {
    expect(validity('epson', 'usb', 'web', 'safari')).toEqual({ status: 'invalid', reasonKey: 'web-btusb-browser' });
    expect(validity('star', 'bluetooth', 'web', 'firefox')).toEqual({ status: 'invalid', reasonKey: 'web-btusb-browser' });
  });

  it('web + USB + generic in Chrome/Edge is uncertain (WebUSB), not a hard wall', () => {
    expect(validity('generic', 'usb', 'web', 'chrome').status).toBe('uncertain');
    expect(validity('generic', 'usb', 'web', 'edge').status).toBe('uncertain');
  });

  it('web + BT + generic is invalid', () => {
    expect(validity('generic', 'bluetooth', 'web', 'chrome')).toEqual({ status: 'invalid', reasonKey: 'web-generic-bt' });
  });

  it('mobile + BT/USB + generic is invalid', () => {
    expect(validity('generic', 'bluetooth', 'android')).toEqual({ status: 'invalid', reasonKey: 'mobile-generic-btusb' });
    expect(validity('generic', 'usb', 'android')).toEqual({ status: 'invalid', reasonKey: 'mobile-generic-btusb' });
  });

  it('desktop + BT/USB + generic is invalid', () => {
    expect(validity('generic', 'usb', 'desktop')).toEqual({ status: 'invalid', reasonKey: 'desktop-generic-btusb' });
  });

  it('common happy paths are valid', () => {
    expect(validity('star', 'network', 'desktop').status).toBe('valid');
    expect(validity('epson', 'network', 'web', 'chrome').status).toBe('valid');
    expect(validity('star', 'bluetooth', 'ios').status).toBe('valid');
    expect(validity('generic', 'network', 'desktop').status).toBe('valid');
  });

  it('desktop epson/star BT/USB is valid but flagged version-dependent', () => {
    const r = validity('epson', 'usb', 'desktop');
    expect(r.status).toBe('valid');
    expect(r.note).toBe('version-dependent');
  });
});
