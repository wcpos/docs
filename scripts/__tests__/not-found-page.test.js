const fs = require('fs');
const path = require('path');
const config = require('../../docusaurus.config.js');
const root = path.join(__dirname, '../..');
const ids = [
  'notFound.searchLabel', 'notFound.searchButton', 'notFound.linksIntro',
  'notFound.gettingStarted', 'notFound.errorCodes', 'notFound.support',
];
const english = JSON.parse(fs.readFileSync(path.join(root, 'i18n/en/code.json'), 'utf8'));

describe('404 page translations', () => {
  it.each(config.i18n.locales)('provides all six messages for %s', (locale) => {
    const translations = JSON.parse(
      fs.readFileSync(path.join(root, 'i18n', locale, 'code.json'), 'utf8')
    );
    for (const id of ids) {
      expect(translations[id]).toBeDefined();
      expect(typeof translations[id].message).toBe('string');
      expect(translations[id].message.trim().length).toBeGreaterThan(0);
    }
    if (locale !== 'en') {
      expect(translations['notFound.searchLabel'].message).not.toBe(
        english['notFound.searchLabel'].message
      );
    }
  });
});

describe('404 page content', () => {
  const source = fs.readFileSync(
    path.join(root, 'src/theme/NotFound/Content/index.js'), 'utf8'
  );

  it('uses translated text, the search query field and the recovery links', () => {
    for (const text of [...ids, 'name="q"', "'/search'",
      '/getting-started/installation', '/error-codes', 'https://wcpos.com/support']) {
      expect(source).toContain(text);
    }
  });
});
