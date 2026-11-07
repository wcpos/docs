import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import config from '../../docusaurus.config.js';
import indexnow from '../indexnow-ping.js';
import completeness from '../check-translation-completeness.js';
import middleware from '../../middleware.js';

// The 2.x launch flip: 2.x at the root, 1.x at /1.x, 0.4.x unbuilt. Every route
// is computed from versioned_docs, so a page added to 1.x only, or a redirect
// that would swallow a live page, fails here rather than on the public site.

const root = path.join(__dirname, '../..');
const { readSlug } = indexnow;
const { AUDIT_EXCLUDE_DEFAULT } = completeness;
const { redirects } = JSON.parse(
  fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')
);
const { defaultLocale, locales } = config.i18n;

/** Doc routes ("/", "/pos/cart") of a version, the way Docusaurus derives them. */
function routesOf(version) {
  const base = path.join(root, 'versioned_docs', `version-${version}`);
  const routes = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_')) continue; // partials are not pages
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.mdx?$/.test(entry.name)) continue;
      const docPath = path
        .relative(base, full)
        .split(path.sep)
        .join('/')
        .replace(/\.mdx?$/, '');
      const docDir =
        path.posix.dirname(docPath) === '.' ? '' : path.posix.dirname(docPath);
      const slug = readSlug(fs.readFileSync(full, 'utf8'));
      let route;
      if (slug)
        route = slug.startsWith('/')
          ? slug
          : path.posix.join('/', docDir, slug);
      else if (path.posix.basename(docPath) === 'index') route = `/${docDir}`;
      else route = `/${docPath}`;
      routes.add(route.replace(/\/+$/, '') || '/');
    }
  };
  walk(base);
  return routes;
}

/** The public path of a route in a locale, optionally under a version prefix. */
function served(route, locale, prefix = '') {
  const localePrefix = locale === defaultLocale ? '' : `/${locale}`;
  return `${localePrefix}${prefix}${route === '/' ? '' : route}` || '/';
}

/**
 * Compile the subset of Vercel's path-to-regexp syntax that vercel.json uses:
 * literal segments, `:name`, `:name(pattern)` and a trailing `/:name*`. Anything
 * else throws, so a new construct cannot silently match nothing. Vercel matches
 * case-insensitively, so this does too.
 */
function compileSource(source) {
  let re = '';
  const names = [];
  let i = 0;
  while (i < source.length) {
    if (source[i] === ':') {
      const name = /^:([A-Za-z_]\w*)/.exec(source.slice(i))[1];
      i += name.length + 1;
      let pattern = '[^/]+';
      if (source[i] === '(') {
        let depth = 0;
        let j = i;
        for (; j < source.length; j++) {
          if (source[j] === '\\') j++;
          else if (source[j] === '(') depth++;
          else if (source[j] === ')' && --depth === 0) break;
        }
        pattern = source.slice(i + 1, j);
        i = j + 1;
      }
      names.push(name);
      if (source[i] === '*') {
        if (!re.endsWith('\\/') || i !== source.length - 1)
          throw new Error(`unsupported: ${source}`);
        re = `${re.slice(0, -2)}(?:\\/(.*))?`;
        i++;
      } else {
        re += `(${pattern})`;
      }
    } else if (/[()?+*{}]/.test(source[i])) {
      throw new Error(`unsupported construct in ${source}`);
    } else {
      re += source[i].replace(/[.\\^$|[\]/]/g, '\\$&');
      i++;
    }
  }
  return { regex: new RegExp(`^${re}\\/?$`, 'i'), names };
}

const compiled = redirects.map((rule) => ({
  ...rule,
  ...compileSource(rule.source),
}));

/** The first redirect Vercel would apply to a path, with its resolved destination. */
function redirectFor(pathname) {
  for (const rule of compiled) {
    const match = rule.regex.exec(pathname);
    if (!match) continue;
    const destination = rule.names.reduce(
      (dest, name, index) =>
        dest.replace(new RegExp(`:${name}\\*?(?=/|$)`), match[index + 1] || ''),
      rule.destination
    );
    return {
      source: rule.source,
      destination: destination.replace(/\/+$/, '') || '/',
    };
  }
  return null;
}

const routes2 = routesOf('2.x');
const routes1 = routesOf('1.x');
const oneOnly = [...routes1].filter((route) => !routes2.has(route)).sort();

describe('the launch flip config', () => {
  it('serves 2.x at the root and 1.x beside it, and no longer builds 0.4.x', () => {
    const docs = config.presets.find(
      ([name]) => name === '@docusaurus/preset-classic'
    )[1].docs;
    expect(docs.lastVersion).toBe('2.x');
    expect(docs.onlyIncludeVersions).toEqual(['2.x', '1.x']);
    expect(((docs.versions || {})['1.x'] || {}).noIndex).toBeFalsy();
  });

  it('has 1.x-only pages to redirect (the legacy error codes, at least)', () => {
    expect(oneOnly).toContain('/error-codes/API01001');
    expect(oneOnly).toContain('/getting-started/testing-the-beta');
  });
});

describe('root URLs of 1.x-only pages redirect to /1.x', () => {
  it.each(locales)('in %s, each lands on the same built 1.x page', (locale) => {
    const built1 = new Set(
      [...routes1].map((route) => served(route, locale, '/1.x'))
    );
    for (const route of oneOnly) {
      const from = served(route, locale);
      const hit = redirectFor(from);
      expect(hit, `${from} has no redirect`).not.toBeNull();
      expect(hit.destination, from).toBe(served(route, locale, '/1.x'));
      expect(
        built1.has(hit.destination),
        `${hit.destination} is not built`
      ).toBe(true);
    }
  });
});

describe('no redirect takes a live page off the site', () => {
  it.each(locales)(
    'in %s, no 2.x root route or /1.x route matches a redirect',
    (locale) => {
      const live = [
        ...[...routes2].map((route) => served(route, locale)),
        ...[...routes1].map((route) => served(route, locale, '/1.x')),
      ];
      const caught = live
        .map((pathname) => [pathname, redirectFor(pathname)])
        .filter(([, hit]) => hit)
        .map(([pathname, hit]) => `${pathname} <- ${hit.source}`);
      expect(caught).toEqual([]);
    }
  );

  it('leaves new-scheme codes at the root and sends legacy ones to /1.x', () => {
    expect(redirectFor('/error-codes/SYNC101')).toBeNull();
    expect(redirectFor('/de/error-codes/SYNC101')).toBeNull();
    expect(redirectFor('/error-codes/SY01001').destination).toBe(
      '/1.x/error-codes/SY01001'
    );
    expect(redirectFor('/ja/error-codes/py').destination).toBe(
      '/ja/1.x/error-codes/py'
    );
  });

  it.each(locales)('sends %s 0.4.x URLs to the locale home', (locale) => {
    const home = served('/', locale);
    for (const route of ['/', '/getting-started/installation']) {
      const hit = redirectFor(served(route, locale, '/0.4.x'));
      expect(hit && hit.destination).toBe(home);
    }
  });
});

describe('the translation queue', () => {
  it('queues 2.x and still skips 0.4.x', () => {
    const exclude = new RegExp(AUDIT_EXCLUDE_DEFAULT);
    expect(exclude.test('version-2.x')).toBe(false);
    expect(exclude.test('versioned_docs/version-2.x/pos/cart.mdx')).toBe(false);
    expect(
      exclude.test('i18n/en/docusaurus-plugin-content-docs/version-2.x.json')
    ).toBe(false);
    expect(exclude.test('versioned_docs/version-0.4.x/intro.md')).toBe(true);
  });
});

describe('Markdown negotiation under /1.x', () => {
  const markdown = (url) =>
    middleware(new Request(url, { headers: { accept: 'text/markdown' } }));

  it.each(['/1.x', '/1.x/pos/cart', '/de/1.x/pos/cart'])(
    'lets %s fall through to the HTML page (1.x has no .md routes)',
    (pathname) => {
      const res = markdown(`https://docs.wcpos.com${pathname}`);
      expect(res.headers.get('x-middleware-rewrite')).toBeNull();
      expect(res.headers.get('x-middleware-next')).toBe('1');
    }
  );

  it('still rewrites root-version pages to their .md', () => {
    expect(
      markdown('https://docs.wcpos.com/pos/cart').headers.get(
        'x-middleware-rewrite'
      )
    ).toBe('https://docs.wcpos.com/pos/cart.md');
    expect(
      markdown('https://docs.wcpos.com/de/1.xylophone').headers.get(
        'x-middleware-rewrite'
      )
    ).toBe('https://docs.wcpos.com/de/1.xylophone.md');
  });
});
