// Pure, deterministic printer-combination validity. Precedence: first match wins.
// See design spec §6.5.

export function validity(vendor, connection, platform, browser) {
  // 1. iOS has no general USB peripheral support.
  if (platform === 'ios' && connection === 'usb') {
    return { status: 'invalid', reasonKey: 'ios-usb' };
  }
  // 2. Web BT/USB need a Chromium browser. (USB-Generic exception handled at rule 5.)
  if (platform === 'web' && (connection === 'bluetooth' || connection === 'usb')
      && browser !== 'chrome' && browser !== 'edge') {
    return { status: 'invalid', reasonKey: 'web-btusb-browser' };
  }
  // 3. Browsers can't open raw TCP to a Generic network printer.
  if (platform === 'web' && connection === 'network' && vendor === 'generic') {
    return { status: 'invalid', reasonKey: 'web-generic-network' };
  }
  // 4. Web Bluetooth path supports Epson/Star only.
  if (platform === 'web' && connection === 'bluetooth' && vendor === 'generic') {
    return { status: 'invalid', reasonKey: 'web-generic-bt' };
  }
  // 5. Generic USB via WebUSB in Chrome/Edge: real evidence shows it can work — uncertain, verify.
  if (platform === 'web' && connection === 'usb' && vendor === 'generic'
      && (browser === 'chrome' || browser === 'edge')) {
    return { status: 'uncertain', note: 'webusb-generic' };
  }
  // 6. Mobile BT/USB use Epson/Star native SDKs; Generic is network-only.
  if ((platform === 'ios' || platform === 'android')
      && (connection === 'bluetooth' || connection === 'usb') && vendor === 'generic') {
    return { status: 'invalid', reasonKey: 'mobile-generic-btusb' };
  }
  // 7. Desktop Generic is network-only (raw TCP 9100).
  if (platform === 'desktop' && (connection === 'bluetooth' || connection === 'usb') && vendor === 'generic') {
    return { status: 'invalid', reasonKey: 'desktop-generic-btusb' };
  }
  // 8. Otherwise valid; desktop Epson/Star BT/USB is version-dependent.
  if (platform === 'desktop' && (connection === 'bluetooth' || connection === 'usb')) {
    return { status: 'valid', note: 'version-dependent' };
  }
  return { status: 'valid' };
}
