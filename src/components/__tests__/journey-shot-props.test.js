import { describe, it, expect } from 'vitest';
import { journeyShotProps } from '../journey-shot-props';

const box = (x, y, width, height) => ({ box: { x, y, width, height } });
const capture = (device, step, pins) => ({
  file: `${device}--j2-${step}.png`,
  step,
  device,
  colorScheme: 'light',
  scale: 'regular',
  pins,
  viewport: { width: 1000, height: 800 },
});
const manifest = {
  page: 'pos/checkout/index.mdx',
  locale: 'en',
  captures: [
    capture('tablet', 5, [box(200, 120, 300, 60), box(100, 400, 10, 20)]),
    capture('tablet', 6, [box(0, 0, 1, 1)]),
    capture('phone', 5, []),
    capture('phone', 6, [box(321, 233, 30, 1)]),
  ],
};
const props = (options) => journeyShotProps(manifest, options);

describe('journeyShotProps', () => {
  it('chooses the capture by device and step among two of each', () => {
    expect(props({ device: 'phone', step: 6 }).src).toMatch(/phone--j2-6/);
    expect(props({ device: 'tablet', step: 6 }).src).toMatch(/tablet--j2-6/);
  });

  it('builds src from the page directory and locale', () => {
    const { src } = props({ device: 'tablet', step: 5 });
    expect(src).toBe('/img/2.x/pos/checkout/en/tablet--j2-5.png');
  });

  it('puts a wide box pin 12 px inside its left edge, a 10 px box at 5 px', () => {
    const [wide, narrow] = props({ device: 'tablet', step: 5 }).pins;
    expect(wide[0]).toBe(21.2); // (200 + 12) / 1000
    expect(narrow[0]).toBe(10.5); // (100 + 5) / 1000
  });

  it('puts y at the vertical centre of the box', () => {
    const [wide, narrow] = props({ device: 'tablet', step: 5 }).pins;
    expect(wide[1]).toBe(18.8); // (120 + 30) / 800 = 18.75%
    expect(narrow[1]).toBe(51.3); // (400 + 10) / 800 = 51.25%
  });

  it('rounds to one decimal place', () => {
    // x: (321 + 12) / 1000 = 33.3%; y: (233 + 0.5) / 800 = 29.1875%
    expect(props({ device: 'phone', step: 6 }).pins).toEqual([[33.3, 29.2]]);
  });

  it('keeps the manifest pin order', () => {
    const { pins } = props({ device: 'tablet', step: 5 });
    // prettier-ignore
    expect(pins).toEqual([[21.2, 18.8], [10.5, 51.3]]);
  });

  it('throws naming device and step when no capture matches', () => {
    const desktop = { device: 'desktop', step: 5 };
    expect(() => props(desktop)).toThrow(/desktop.*step 5/);
    const dark = { device: 'tablet', step: 5, colorScheme: 'dark' };
    expect(() => props(dark)).toThrow(/tablet.*step 5/);
  });

  it('returns an empty pin list for a capture with no pins', () => {
    expect(props({ device: 'phone', step: 5 }).pins).toEqual([]);
  });
});
