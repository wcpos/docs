/* global describe, it, expect */
const { buildPlan } = require('../build-locales');
const config = require('../../docusaurus.config.js');

describe('buildPlan', () => {
  it('builds all 12 configured locales once, with English first', () => {
    const plan = buildPlan([], config.i18n);
    expect(plan).toHaveLength(12);
    expect(plan[0]).toEqual(['build', '--locale', 'en']);
    const locales = plan.map((entry) => entry[2]);
    expect(new Set(locales)).toEqual(new Set(config.i18n.locales));
    for (const locale of config.i18n.locales) {
      expect(locales.filter((value) => value === locale)).toHaveLength(1);
    }
  });

  it('passes a separate locale argument through unchanged', () => {
    expect(buildPlan(['--locale', 'en'], config.i18n)).toEqual([
      ['build', '--locale', 'en'],
    ]);
  });

  it('passes an equals locale argument and other arguments through unchanged', () => {
    expect(buildPlan(['--locale=de', '--out-dir', 'x'], config.i18n)).toEqual([
      ['build', '--locale=de', '--out-dir', 'x'],
    ]);
  });

  it('puts the default first and forwards arguments to every locale', () => {
    expect(
      buildPlan(['--out-dir', 'x'], {
        defaultLocale: 'b',
        locales: ['a', 'b', 'c'],
      })
    ).toEqual([
      ['build', '--locale', 'b', '--out-dir', 'x'],
      ['build', '--locale', 'a', '--out-dir', 'x'],
      ['build', '--locale', 'c', '--out-dir', 'x'],
    ]);
  });

  it.each([
    { defaultLocale: 'z', locales: ['a'] },
    { defaultLocale: 'a', locales: [] },
    { defaultLocale: 'a', locales: ['a', 'a'] },
  ])('rejects invalid locale configuration: %j', (i18n) => {
    expect(() => buildPlan([], i18n)).toThrow(Error);
  });
});
