const { setSlug, setFrontmatterKey, rewriteLinks, rewriteLegacyLinks, transformSidebar, buildLinkMap } = require('../url-structure/apply-url-map');

const emptyMap = {
  docs: [], categories: [], removedCategories: [], sidebarMoves: [], docRefSwaps: [], resultingItems: {},
};

describe('setSlug', () => {
  it('inserts after title:', () => {
    expect(setSlug('---\ntitle: Page\ndescription: "A: B"\n---\nBody\n', '/new'))
      .toBe('---\ntitle: Page\nslug: /new\ndescription: "A: B"\n---\nBody\n');
  });

  it('inserts as the first key when there is no title:', () => {
    expect(setSlug('---\r\nsidebar_label: Page\r\n---\r\nBody', '/new'))
      .toBe('---\r\nslug: /new\r\nsidebar_label: Page\r\n---\r\nBody');
  });

  it('replaces an existing slug:', () => {
    expect(setSlug('---\ntitle: Page\nslug: /old\n---\nslug: /body\n', '/new'))
      .toBe('---\ntitle: Page\nslug: /new\n---\nslug: /body\n');
  });

  it('is idempotent', () => {
    const once = setSlug('---\ntitle: Page\n---\nBody', '/new');
    expect(setSlug(once, '/new')).toBe(once);
  });
});

describe('setFrontmatterKey', () => {
  it('replaces an existing title:', () => {
    expect(setFrontmatterKey('---\r\ntitle: Old\r\ndescription: "A: B"\r\n---\r\ntitle: Body\r\n', 'title', 'New'))
      .toBe('---\r\ntitle: New\r\ndescription: "A: B"\r\n---\r\ntitle: Body\r\n');
  });

  it('inserts sidebar_label: after title:', () => {
    expect(setFrontmatterKey('---\ntitle: Page\nslug: /page\n---\nBody\n', 'sidebar_label', 'Label'))
      .toBe('---\ntitle: Page\nsidebar_label: Label\nslug: /page\n---\nBody\n');
  });

  it('quotes a value containing a colon and space or starting with an apostrophe', () => {
    const text = '---\ntitle: Old\n---\nBody';
    expect(setFrontmatterKey(text, 'title', 'Page: Details'))
      .toBe('---\ntitle: "Page: Details"\n---\nBody');
    expect(setFrontmatterKey(text, 'title', "'New'"))
      .toBe('---\ntitle: "\'New\'"\n---\nBody');
  });

  it('leaves an apostrophe inside a value unquoted', () => {
    expect(setFrontmatterKey('---\ntitle: Old\n---\n', 'title', "What's New"))
      .toBe('---\ntitle: What\'s New\n---\n');
  });

  it('is idempotent', () => {
    const once = setFrontmatterKey('---\r\nslug: /page\r\n---\r\nBody', 'title', 'Page');
    expect(once).toBe('---\r\ntitle: Page\r\nslug: /page\r\n---\r\nBody');
    expect(setFrontmatterKey(once, 'title', 'Page')).toBe(once);
    const empty = setFrontmatterKey('---\n---\nBody', 'title', 'Page');
    expect(empty).toBe('---\ntitle: Page\n---\nBody');
    expect(setFrontmatterKey(empty, 'title', 'Page')).toBe(empty);
  });
});

describe('rewriteLinks', () => {
  const links = { '/pos/register': '/pos/open-the-register', '/pos': '/sell' };

  it('rewrites a Markdown link and keeps its #fragment', () => {
    expect(rewriteLinks('[Register](/pos/register#open)', links))
      .toBe('[Register](/pos/open-the-register#open)');
  });

  it('rewriteLinks leaves inline code alone', () => {
    expect(rewriteLinks('`/pos` and [x](/pos)', { '/pos': '/new' }))
      .toBe('`/pos` and [x](/new)');
  });

  it('rewrites to="…" and href="…"', () => {
    expect(rewriteLinks('<LinkCard to="/pos/register" /><a href="/pos/register">Open</a>', links))
      .toBe('<LinkCard to="/pos/open-the-register" /><a href="/pos/open-the-register">Open</a>');
  });

  it('drops the /2.x prefix', () => {
    expect(rewriteLinks('[Register](/2.x/pos/register)', links))
      .toBe('[Register](/pos/open-the-register)');
  });

  it('keeps the https://docs.wcpos.com origin', () => {
    expect(rewriteLinks('[Register](https://docs.wcpos.com/2.x/pos/register#open)', links))
      .toBe('[Register](https://docs.wcpos.com/pos/open-the-register#open)');
  });

  it('leaves /pos/checkout alone when only /pos is mapped', () => {
    expect(rewriteLinks('[Checkout](/pos/checkout)', { '/pos': '/sell' }))
      .toBe('[Checkout](/pos/checkout)');
  });

  it('leaves a relative link ../pos/register alone', () => {
    expect(rewriteLinks('[Register](../pos/register)', links)).toBe('[Register](../pos/register)');
  });

  it('keeps queries and accepts each specified delimiter', () => {
    const text = "'/pos/register?view=all#open' `/pos/register` {/pos/register} =/pos/register ";
    expect(rewriteLinks(text, links)).toBe(
      "'/pos/open-the-register?view=all#open' `/pos/register` {/pos/open-the-register} =/pos/open-the-register "
    );
  });

  it('leaves slug lines and paths without a link delimiter unchanged', () => {
    const text = '---\nslug: /pos/register\n---\n/pos/register (https://docs.wcpos.com/pos/register)';
    expect(rewriteLinks(text, links)).toBe(text);
  });
});

describe('rewriteLegacyLinks', () => {
  const links = { '/coupons': '/1.x/coupons' };

  it('rewrites a Markdown link and keeps its #fragment', () => {
    expect(rewriteLegacyLinks('[Coupons](/coupons#x)', links)).toBe('[Coupons](/1.x/coupons#x)');
  });

  it('leaves to="…" unchanged', () => {
    const text = '<LinkCard to="/coupons" />';
    expect(rewriteLegacyLinks(text, links)).toBe(text);
  });

  it('leaves an already versioned link unchanged', () => {
    const text = '[Coupons](/1.x/coupons)';
    expect(rewriteLegacyLinks(text, links)).toBe(text);
  });

  it('leaves /pos unchanged when only /pos/cart is mapped', () => {
    expect(rewriteLegacyLinks('[POS](/pos)', { '/pos/cart': '/1.x/pos/cart' })).toBe('[POS](/pos)');
  });

  it('preserves origins, queries and link titles', () => {
    expect(rewriteLegacyLinks('[Coupons](https://docs.wcpos.com/coupons?view=all#x "Title")', links))
      .toBe('[Coupons](https://docs.wcpos.com/1.x/coupons?view=all#x "Title")');
  });

  it('leaves href, inline code and relative links unchanged', () => {
    const text = '<a href="/coupons">Coupons</a> `/coupons` `[Coupons](/coupons)` '
      + '``[Coupons](/coupons) `code` `` [Coupons](../coupons)';
    expect(rewriteLegacyLinks(text, links)).toBe(text);
  });
});

describe('transformSidebar', () => {
  it('sets a generated-index slug', () => {
    const sidebar = { sidebar: [{ type: 'category', label: 'Settings', items: [],
      link: { type: 'generated-index', title: 'Settings overview' } }] };
    const result = transformSidebar(sidebar, { ...emptyMap,
      categories: [{ sidebarPath: ['Settings'], newRoute: '/settings' }] });
    expect(result.sidebar[0].link).toEqual({
      type: 'generated-index', title: 'Settings overview', slug: '/settings',
    });
    expect(sidebar.sidebar[0].link).not.toHaveProperty('slug');
  });

  it('moves items to a position and removes the emptied category', () => {
    const a = { type: 'doc', id: 'a', label: 'A', key: 'keep' };
    const b = { type: 'doc', id: 'b', label: 'B' };
    const c = { type: 'doc', id: 'c', label: 'C' };
    const sidebar = { sidebar: [
      { type: 'category', label: 'Source', items: [b, a] },
      { type: 'category', label: 'Target', items: [c, { type: 'doc', id: 'd', label: 'D' }] },
    ] };
    const map = { ...emptyMap,
      sidebarMoves: [{ items: ['a', 'b'], fromPath: ['Source'], toPath: ['Target'], position: 1 }],
      removedCategories: [{ sidebarPath: ['Source'] }],
      resultingItems: { Target: ['c', 'a', 'b', 'd'].map((docId) => ({ docId, label: docId.toUpperCase() })) },
    };
    const result = transformSidebar(sidebar, map);
    expect(result.sidebar).toEqual([{ type: 'category', label: 'Target',
      items: [c, a, b, { type: 'doc', id: 'd', label: 'D' }] }]);
    expect(transformSidebar(result, map)).toEqual(result);
    expect(sidebar.sidebar[0].items).toEqual([b, a]);
  });

  it('swaps doc and ref', () => {
    const sidebar = { sidebar: [
      { type: 'category', label: 'Home', items: [{ type: 'ref', id: 'a', label: 'A', key: 'ref-a' }] },
      { type: 'category', label: 'Related', items: [{ type: 'doc', id: 'a', label: 'Also A' }] },
    ] };
    const map = { ...emptyMap,
      docRefSwaps: [{ docId: 'a', docEntryIn: ['Home'], refEntryIn: ['Related'] }] };
    const result = transformSidebar(sidebar, map);
    expect(result.sidebar[0].items).toEqual([{ type: 'doc', id: 'a', label: 'A', key: 'ref-a' }]);
    expect(result.sidebar[1].items).toEqual([{ type: 'ref', id: 'a', label: 'Also A' }]);
    expect(transformSidebar(result, map)).toEqual(result);
  });

  it('throws when the resulting items differ', () => {
    const sidebar = { sidebar: [{ type: 'category', label: 'Target',
      items: [{ type: 'doc', id: 'a', label: 'Wrong' }] }] };
    expect(() => transformSidebar(sidebar, { ...emptyMap,
      resultingItems: { Target: [{ docId: 'a', label: 'A' }] } }))
      .toThrow('Target differs:\n- expected [{"id":"a","label":"A"}]\n+ actual [{"id":"a","label":"Wrong"}]');
  });

  it('rejects removal of a nonempty category', () => {
    const sidebar = { sidebar: [{ type: 'category', label: 'Source', items: [{ type: 'doc', id: 'a' }] }] };
    expect(() => transformSidebar(sidebar, { ...emptyMap,
      removedCategories: [{ sidebarPath: ['Source'] }] })).toThrow('Category is not empty: Source');
  });
});

it('builds the link map from documents, categories, removed categories and literal redirects', () => {
  const map = { ...emptyMap,
    docs: [{ oldRoute: '/old-doc', newRoute: '/new-doc' }],
    categories: [{ oldRoute: '/category/old', newRoute: '/new-category' }],
    removedCategories: [{ oldRoute: '/category/removed', redirectsTo: '/new-doc' }],
  };
  expect(buildLinkMap(map, [
    { source: '/legacy', destination: '/new-doc#section' },
    { source: '/:locale/legacy', destination: '/:locale/new-doc' },
    { source: '/legacy/(.*)', destination: '/new-doc' },
  ])).toEqual({
    '/old-doc': '/new-doc', '/category/old': '/new-category',
    '/category/removed': '/new-doc', '/legacy': '/new-doc#section',
  });
});
