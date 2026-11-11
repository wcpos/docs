/* global describe, it, expect */
const { siteFilters, buildRequest, evaluate } = require('../check-search-health');

const config = require('../../docusaurus.config.js');

describe('siteFilters', () => {
  it('matches the filters the English search box sends', () => {
    expect(siteFilters(require('../../docusaurus.config.js'))).toEqual([
      ['language:en'],
      ['docusaurus_tag:default', 'docusaurus_tag:docs-default-2.x'],
    ]);
  });

  it('follows lastVersion', () => {
    const presets = config.presets.map((p) =>
      Array.isArray(p) && p[0] === '@docusaurus/preset-classic'
        ? [p[0], { ...p[1], docs: { ...p[1].docs, lastVersion: '3.x' } }]
        : p
    );
    const cloned = { ...config, presets };
    expect(siteFilters(cloned)[1]).toContain('docusaurus_tag:docs-default-3.x');
  });
});

describe('buildRequest', () => {
  it('posts both queries to the DSN host', () => {
    const req = buildRequest(config);
    expect(req.url).toBe('https://9uqmjois5t-dsn.algolia.net/1/indexes/*/queries');
    expect(req.body.requests).toHaveLength(2);
    expect(req.body.requests.map((r) => r.indexName)).toEqual(['wcpos', 'wcpos']);
    expect(req.body.requests.map((r) => r.query)).toEqual(['', 'product']);
  });
});

describe('evaluate', () => {
  it('is ok when every query has hits', () => {
    expect(evaluate([{ nbHits: 4776 }, { nbHits: 646 }], config)).toEqual({
      ok: true,
      line: 'search-health OK tag=docs-default-2.x locale=en all=4776 product=646',
    });
  });

  it('fails when one query has 0 hits', () => {
    const result = evaluate([{ nbHits: 4776 }, { nbHits: 0 }], config);
    expect(result.ok).toBe(false);
    expect(result.line.startsWith('search-health FAIL')).toBe(true);
  });

  it('fails when both queries have 0 hits', () => {
    expect(evaluate([{ nbHits: 0 }, { nbHits: 0 }], config).ok).toBe(false);
  });

  it('fails on the wrong number of results', () => {
    expect(evaluate([{ nbHits: 5 }], config).ok).toBe(false);
  });
});
