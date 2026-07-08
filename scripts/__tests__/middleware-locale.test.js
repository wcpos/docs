import { describe, it, expect } from 'vitest';
import middleware, {
  LOCALES,
  parseAcceptLanguage,
  pickLocale,
  resolveRootRedirect,
} from '../../middleware.js';
import { LOCALE_PREFERENCE_COOKIE } from '../../src/utils/localePreference.js';
import config from '../../docusaurus.config.js';

describe('middleware LOCALES', () => {
  it('mirrors i18n.locales in docusaurus.config.js', () => {
    expect(LOCALES).toEqual(config.i18n.locales);
  });
});

describe('parseAcceptLanguage', () => {
  it('orders tags by descending quality', () => {
    expect(parseAcceptLanguage('en;q=0.5, de, fr;q=0.8')).toEqual([
      { tag: 'de', q: 1 },
      { tag: 'fr', q: 0.8 },
      { tag: 'en', q: 0.5 },
    ]);
  });

  it('drops wildcards, empty entries, and q=0 tags', () => {
    expect(parseAcceptLanguage('*, ,de;q=0, fr;q=0.9')).toEqual([
      { tag: 'fr', q: 0.9 },
    ]);
  });

  it('handles empty and missing headers', () => {
    expect(parseAcceptLanguage('')).toEqual([]);
    expect(parseAcceptLanguage(null)).toEqual([]);
  });
});

describe('pickLocale', () => {
  it('matches exact tags case-insensitively', () => {
    expect(pickLocale('pt-br')).toBe('pt-BR');
    expect(pickLocale('de')).toBe('de');
  });

  it('falls back to primary-subtag matches', () => {
    expect(pickLocale('de-AT')).toBe('de');
    expect(pickLocale('pt-PT')).toBe('pt-BR');
    expect(pickLocale('zh-TW')).toBe('zh-CN');
    expect(pickLocale('hi')).toBe('hi-IN');
  });

  it('respects quality ordering across tags', () => {
    expect(pickLocale('de;q=0.7, ja;q=0.9')).toBe('ja');
    // en-US wins -> primary match on en
    expect(pickLocale('en-US, de;q=0.9')).toBe('en');
  });

  it('returns null when nothing is supported', () => {
    expect(pickLocale('sw, xx-YY')).toBeNull();
    expect(pickLocale('')).toBeNull();
  });
});

describe('resolveRootRedirect', () => {
  it('redirects non-English browsers to their locale home', () => {
    expect(
      resolveRootRedirect({
        cookieHeader: '',
        acceptLanguage: 'de-DE,de;q=0.9',
      })
    ).toBe('/de');
    expect(
      resolveRootRedirect({ cookieHeader: null, acceptLanguage: 'pt-PT' })
    ).toBe('/pt-BR');
  });

  it('serves English when the browser prefers it or sends nothing', () => {
    expect(
      resolveRootRedirect({
        cookieHeader: '',
        acceptLanguage: 'en-US,en;q=0.9',
      })
    ).toBeNull();
    expect(
      resolveRootRedirect({ cookieHeader: '', acceptLanguage: '' })
    ).toBeNull();
    expect(
      resolveRootRedirect({ cookieHeader: null, acceptLanguage: null })
    ).toBeNull();
  });

  it('lets an explicit cookie preference override Accept-Language', () => {
    // German browser, deliberately switched to English: stay on /.
    expect(
      resolveRootRedirect({
        cookieHeader: `${LOCALE_PREFERENCE_COOKIE}=en`,
        acceptLanguage: 'de-DE,de;q=0.9',
      })
    ).toBeNull();
    // English browser, deliberately switched to Japanese: go to /ja.
    expect(
      resolveRootRedirect({
        cookieHeader: `foo=bar; ${LOCALE_PREFERENCE_COOKIE}=ja; baz=1`,
        acceptLanguage: 'en-US',
      })
    ).toBe('/ja');
  });

  it('ignores unknown cookie values and falls back to detection', () => {
    expect(
      resolveRootRedirect({
        cookieHeader: `${LOCALE_PREFERENCE_COOKIE}=xx`,
        acceptLanguage: 'fr',
      })
    ).toBe('/fr');
  });
});

describe('middleware end-to-end', () => {
  const request = (url, headers = {}) => new Request(url, { headers });

  it('302-redirects the site root for a non-English browser', () => {
    const res = middleware(
      request('https://docs.wcpos.com/', {
        accept: 'text/html',
        'accept-language': 'de-DE,de;q=0.9,en;q=0.8',
      })
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://docs.wcpos.com/de');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('serves the site root untouched for an English browser', () => {
    const res = middleware(
      request('https://docs.wcpos.com/', {
        accept: 'text/html',
        'accept-language': 'en-US,en;q=0.9',
      })
    );
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('never redirects deep links, whatever the browser language', () => {
    const res = middleware(
      request('https://docs.wcpos.com/pos', {
        accept: 'text/html',
        'accept-language': 'de-DE',
      })
    );
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('still rewrites markdown requests (content negotiation unchanged)', () => {
    const res = middleware(
      request('https://docs.wcpos.com/pos', { accept: 'text/markdown' })
    );
    expect(res.headers.get('x-middleware-rewrite')).toBe(
      'https://docs.wcpos.com/pos.md'
    );
  });

  it('markdown negotiation wins over locale detection on the root', () => {
    const res = middleware(
      request('https://docs.wcpos.com/', {
        accept: 'text/markdown',
        'accept-language': 'de-DE',
      })
    );
    expect(res.headers.get('x-middleware-rewrite')).toBe(
      'https://docs.wcpos.com/index.md'
    );
  });
});
