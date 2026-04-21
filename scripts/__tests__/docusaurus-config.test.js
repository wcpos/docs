const config = require('../../docusaurus.config.js');

describe('docusaurus locale configuration', () => {
  it('labels the English locale as English in the language menu', () => {
    expect(config.i18n.localeConfigs.en.label).toBe('English');
  });
});
