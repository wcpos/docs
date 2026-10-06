const fs = require('fs');
const path = require('path');
const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../vercel.json'), 'utf8')
);

describe('Vercel headers and build configuration', () => {
  it('keeps the three header rules in the specified order', () => {
    expect(config.headers.map(({ source }) => source)).toEqual([
      '/assets/(.*)', '/:locale/assets/(.*)', '/(.*)',
    ]);
  });

  it.each(['/assets/(.*)', '/:locale/assets/(.*)'])(
    'caches hashed assets at %s immutably for one year', (source) => {
      const rule = config.headers.find((entry) => entry.source === source);
      const cache = rule.headers.find(({ key }) => key === 'Cache-Control');
      expect(cache.value).toContain('immutable');
      expect(cache.value).toContain('max-age=31536000');
    }
  );

  it('sets exactly the specified security headers on every response', () => {
    const rule = config.headers.find(({ source }) => source === '/(.*)');
    expect(rule.headers).toEqual([
      { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]);
  });

  it('deepens git history and still runs the normal build on git failure', () => {
    expect(config.buildCommand).toContain('git fetch --unshallow');
    expect(config.buildCommand.endsWith('npm run build')).toBe(true);
    expect(config.buildCommand).toBe(
      "git fetch --unshallow --quiet || echo 'vercel build: could not unshallow; last-update dates may be wrong'; npm run build"
    );
  });

  it('preserves clean URLs and redirects', () => {
    expect(config.cleanUrls).toBe(true);
    expect(Array.isArray(config.redirects)).toBe(true);
    expect(config.redirects.length).toBeGreaterThan(0);
  });
});
