#!/usr/bin/env node
// Ask the live Algolia index for English records of the default docs version,
// with the same facetFilters the site's search box sends (contextualSearch).
// Exits 0 when every query has hits, 1 when one has 0 hits, 2 when Algolia
// cannot be reached or answers badly. Run daily by the Steward.
// Usage: node scripts/check-search-health.js
const config = require('../docusaurus.config.js');

const QUERIES = [
  '', // counts every English record of the default version
  'product', // a real query that must match on any healthy index
];

function versionTag(cfg) {
  const preset = cfg.presets.find((p) => Array.isArray(p) && p[0] === '@docusaurus/preset-classic');
  return `docs-default-${preset[1].docs.lastVersion}`;
}

/** The facetFilters the default-locale site's search box sends. */
function siteFilters(cfg) {
  return [
    [`language:${cfg.i18n.defaultLocale}`],
    ['docusaurus_tag:default', `docusaurus_tag:${versionTag(cfg)}`],
  ];
}

function buildRequest(cfg) {
  const { appId, apiKey, indexName } = cfg.themeConfig.algolia;
  return {
    url: `https://${appId.toLowerCase()}-dsn.algolia.net/1/indexes/*/queries`,
    headers: {
      'X-Algolia-Application-Id': appId,
      'X-Algolia-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: {
      requests: QUERIES.map((query) => ({
        indexName,
        query,
        hitsPerPage: 0,
        facetFilters: siteFilters(cfg),
      })),
    },
  };
}

function evaluate(results, cfg) {
  const list = Array.isArray(results) ? results : [];
  const counts = QUERIES.map((q, i) => {
    const r = list[i];
    return r && typeof r.nbHits === 'number' ? r.nbHits : 0;
  });
  const ok = list.length === QUERIES.length && counts.every((n) => n > 0);
  const parts = QUERIES.map((q, i) => `${q === '' ? 'all' : q}=${counts[i]}`).join(' ');
  const line = `search-health ${ok ? 'OK' : 'FAIL'} tag=${versionTag(cfg)} locale=${cfg.i18n.defaultLocale} ${parts}`;
  return { ok, line };
}

async function main() {
  const req = buildRequest(config);
  let res, data;
  try {
    res = await fetch(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) });
  } catch (err) {
    console.log(`search-health ERROR ${err && err.message ? err.message : String(err)}`);
    return 2;
  }
  if (!res.ok) {
    console.log(`search-health ERROR ${res.status}`);
    return 2;
  }
  try {
    data = await res.json();
  } catch (err) {
    console.log(`search-health ERROR unparseable JSON: ${err.message}`);
    return 2;
  }
  const { ok, line } = evaluate(data && data.results, config);
  console.log(line);
  return ok ? 0 : 1;
}

module.exports = { QUERIES, siteFilters, buildRequest, evaluate };

if (require.main === module) {
  main().then((code) => process.exit(code));
}
