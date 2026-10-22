/* global describe, it, expect */
const fs = require('fs');
const path = require('path');
const { fileToUrl, readSlug, buildPayload, collectUrls, INDEXNOW_KEY } = require('../indexnow-ping');

const fm = (body) => `---\ntitle: Page\n${body}\n---\n\n# Page\n`;

describe('fileToUrl', () => {
  it('maps the English root page with slug: / to the site root', () => {
    expect(fileToUrl('versioned_docs/version-1.x/getting-started/index.mdx', fm('slug: /'))).toBe(
      'https://docs.wcpos.com'
    );
  });

  it('maps a nested English page to its path', () => {
    expect(fileToUrl('versioned_docs/version-1.x/settings/checkout.mdx', fm('sidebar_position: 2'))).toBe(
      'https://docs.wcpos.com/settings/checkout'
    );
  });

  it('maps a category index.mdx to its directory', () => {
    expect(fileToUrl('versioned_docs/version-1.x/error-codes/index.mdx', fm(''))).toBe(
      'https://docs.wcpos.com/error-codes'
    );
  });

  it('prefixes translated pages with their locale', () => {
    expect(
      fileToUrl('i18n/pt-BR/docusaurus-plugin-content-docs/version-1.x/orders/refunds.mdx', fm(''))
    ).toBe('https://docs.wcpos.com/pt-BR/orders/refunds');
    expect(
      fileToUrl('i18n/de/docusaurus-plugin-content-docs/version-1.x/getting-started/index.mdx', fm('slug: /'))
    ).toBe('https://docs.wcpos.com/de');
  });

  it('honours absolute and relative slugs', () => {
    expect(fileToUrl('versioned_docs/version-1.x/pos/cart.mdx', fm('slug: "/checkout/cart"'))).toBe(
      'https://docs.wcpos.com/checkout/cart'
    );
    expect(fileToUrl('versioned_docs/version-1.x/pos/cart.mdx', fm("slug: basket"))).toBe(
      'https://docs.wcpos.com/pos/basket'
    );
  });

  it('ignores 0.4.x, 2.x, docs/ and non-doc files', () => {
    expect(fileToUrl('versioned_docs/version-0.4.x/intro.md', '')).toBeNull();
    expect(fileToUrl('versioned_docs/version-2.x/pos/cart.mdx', '')).toBeNull();
    expect(fileToUrl('i18n/de/docusaurus-plugin-content-docs/version-2.x/pos/cart.mdx', '')).toBeNull();
    expect(fileToUrl('docs/pos/cart.mdx', '')).toBeNull();
    expect(fileToUrl('versioned_docs/version-1.x/payment/stripe.tsx', '')).toBeNull();
    expect(fileToUrl('i18n/de/docusaurus-plugin-content-docs/version-1.x.json', '')).toBeNull();
  });

  it('maps .md like .mdx, since Docusaurus serves both', () => {
    expect(fileToUrl('versioned_docs/version-1.x/pos/cart.md', '')).toBe('https://docs.wcpos.com/pos/cart');
    expect(fileToUrl('versioned_docs/version-1.x/pos/cart.mdx', '')).toBe('https://docs.wcpos.com/pos/cart');
  });
});

describe('readSlug', () => {
  it('reads slug only from the frontmatter block', () => {
    expect(readSlug(fm("slug: '/a'"))).toBe('/a');
    expect(readSlug('---\ntitle: x\n---\nslug: /not-frontmatter\n')).toBeNull();
    expect(readSlug('')).toBeNull();
  });
});

describe('key file', () => {
  it('static/<key>.txt holds exactly the key IndexNow will verify', () => {
    const file = path.join(__dirname, '..', '..', 'static', `${INDEXNOW_KEY}.txt`);
    expect(fs.readFileSync(file, 'utf8')).toBe(INDEXNOW_KEY);
  });
});

describe('collectUrls and buildPayload', () => {
  it('dedupes URLs and builds the IndexNow payload', () => {
    const urls = collectUrls(
      ['versioned_docs/version-1.x/pos/cart.mdx', 'versioned_docs/version-1.x/pos/cart.mdx', 'README.md'],
      () => {
        throw new Error('deleted');
      }
    );
    expect(urls).toEqual(['https://docs.wcpos.com/pos/cart']);
    expect(buildPayload(urls)).toEqual({
      host: 'docs.wcpos.com',
      key: INDEXNOW_KEY,
      keyLocation: `https://docs.wcpos.com/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    });
  });
});
