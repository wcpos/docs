# Language menu English label

## Goal
Change the language menu so the English option displays as `English` instead of `British English`.

## Approach
Use the existing Docusaurus `localeDropdown` and add an explicit label for the `en` locale in `docusaurus.config.js`.

## Why this approach
- Smallest possible change
- No routing or locale-code changes
- Keeps the existing dropdown behavior intact

## Verification
- Add a regression test that loads `docusaurus.config.js` and checks `i18n.localeConfigs.en.label === 'English'`
- Run the targeted Vitest test and the full test suite
