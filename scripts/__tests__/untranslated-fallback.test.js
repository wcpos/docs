import {describe, it, expect} from 'vitest';
import {isUntranslatedFallback} from '../../src/utils/untranslatedFallback.js';

describe('isUntranslatedFallback', () => {
  it('does not mark an English source in the default locale', () => {
    expect(isUntranslatedFallback({
      source: '@site/versioned_docs/version-1.x/error-codes/AUTH131.mdx',
      currentLocale: 'en',
      defaultLocale: 'en',
    })).toBe(false);
  });

  it('does not mark a German translation', () => {
    expect(isUntranslatedFallback({
      source: '@site/i18n/de/docusaurus-plugin-content-docs/version-1.x/pos/cart.mdx',
      currentLocale: 'de',
      defaultLocale: 'en',
    })).toBe(false);
  });

  it('does not mark a hi-IN translation', () => {
    expect(isUntranslatedFallback({
      source: '@site/i18n/hi-IN/docusaurus-plugin-content-docs/version-1.x/pos/cart.mdx',
      currentLocale: 'hi-IN',
      defaultLocale: 'en',
    })).toBe(false);
  });

  it('marks an English source under a German locale', () => {
    expect(isUntranslatedFallback({
      source: '@site/versioned_docs/version-1.x/error-codes/AUTH131.mdx',
      currentLocale: 'de',
      defaultLocale: 'en',
    })).toBe(true);
  });

  it('marks another locale’s translation under Spanish', () => {
    expect(isUntranslatedFallback({
      source: '@site/i18n/de/docusaurus-plugin-content-docs/version-1.x/pos/cart.mdx',
      currentLocale: 'es',
      defaultLocale: 'en',
    })).toBe(true);
  });
});
