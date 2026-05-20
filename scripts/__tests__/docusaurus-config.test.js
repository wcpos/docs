const config = require('../../docusaurus.config.js');

describe('docusaurus locale configuration', () => {
  it('labels the English locale as English in the language menu', () => {
    expect(config.i18n.localeConfigs.en.label).toBe('English');
  });

  it('includes Dutch as a supported locale with a native label', () => {
    expect(config.i18n.locales).toContain('nl');
    expect(config.i18n.localeConfigs.nl.label).toBe('Nederlands');
  });
});
