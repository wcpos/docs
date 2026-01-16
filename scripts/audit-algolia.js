#!/usr/bin/env node
/**
 * Algolia Search Audit Script
 * 
 * This script helps you verify that Algolia search is working correctly
 * across all your documentation languages.
 * 
 * Usage:
 *   node scripts/audit-algolia.js                    # Use public search key (search only)
 *   ALGOLIA_ADMIN_KEY=xxx node scripts/audit-algolia.js  # Use admin key (full audit)
 * 
 * To get your Admin API key:
 *   1. Go to https://dashboard.algolia.com
 *   2. Select your application (9UQMJOIS5T)
 *   3. Go to Settings → API Keys → Admin API Key
 */

const ALGOLIA_APP_ID = '9UQMJOIS5T';
const ALGOLIA_SEARCH_KEY = '1739d8f0c7ec0af3167dd5af39d180d6';
const ALGOLIA_INDEX = 'wcpos';

// Your configured locales from docusaurus.config.js
const LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'pt-BR', 'ko', 'it', 'ar', 'hi-IN', 'zh-CN'];

// Sample test queries per language (common docs terms)
const TEST_QUERIES = {
  en: ['installation', 'cart', 'products', 'settings', 'payment'],
  es: ['instalación', 'carrito', 'productos', 'configuración', 'pago'],
  fr: ['installation', 'panier', 'produits', 'paramètres', 'paiement'],
  de: ['Installation', 'Warenkorb', 'Produkte', 'Einstellungen', 'Zahlung'],
  ja: ['インストール', 'カート', '製品', '設定', '支払い'],
  'pt-BR': ['instalação', 'carrinho', 'produtos', 'configurações', 'pagamento'],
  ko: ['설치', '장바구니', '제품', '설정', '결제'],
  it: ['installazione', 'carrello', 'prodotti', 'impostazioni', 'pagamento'],
  ar: ['التثبيت', 'عربة التسوق', 'المنتجات', 'الإعدادات', 'الدفع'],
  'hi-IN': ['स्थापना', 'कार्ट', 'उत्पाद', 'सेटिंग्स', 'भुगतान'],
  'zh-CN': ['安装', '购物车', '产品', '设置', '付款'],
};

// Algolia REST API helpers
async function algoliaRequest(endpoint, options = {}) {
  const apiKey = process.env.ALGOLIA_ADMIN_KEY || ALGOLIA_SEARCH_KEY;
  const baseUrl = `https://${ALGOLIA_APP_ID}-dsn.algolia.net`;
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'X-Algolia-Application-Id': ALGOLIA_APP_ID,
      'X-Algolia-API-Key': apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Algolia API error: ${response.status} - ${error.message || response.statusText}`);
  }
  
  return response.json();
}

async function search(query, filters = '') {
  return algoliaRequest(`/1/indexes/${ALGOLIA_INDEX}/query`, {
    method: 'POST',
    body: JSON.stringify({
      query,
      filters,
      hitsPerPage: 10,
      attributesToRetrieve: ['hierarchy', 'url', 'content', 'lang', 'language', 'docusaurus_tag'],
      facets: ['lang', 'language', 'docusaurus_tag', 'version'],
    }),
  });
}

async function getIndexSettings() {
  return algoliaRequest(`/1/indexes/${ALGOLIA_INDEX}/settings`);
}

async function browseIndex(params = {}) {
  return algoliaRequest(`/1/indexes/${ALGOLIA_INDEX}/browse`, {
    method: 'POST',
    body: JSON.stringify({
      hitsPerPage: 1000,
      attributesToRetrieve: ['url', 'lang', 'language', 'docusaurus_tag', 'hierarchy'],
      ...params,
    }),
  });
}

async function getFacets() {
  // Search with empty query to get facet distribution
  return search('', '');
}

// Audit functions
async function auditIndexSettings() {
  console.log('\n📋 INDEX SETTINGS AUDIT');
  console.log('========================\n');
  
  try {
    const settings = await getIndexSettings();
    
    console.log('Index Languages:', settings.indexLanguages || '(not set - using defaults)');
    console.log('Query Languages:', settings.queryLanguages || '(not set - using defaults)');
    console.log('Remove Stop Words:', settings.removeStopWords || false);
    console.log('Ignore Plurals:', settings.ignorePlurals || false);
    console.log('Searchable Attributes:', settings.searchableAttributes?.join(', ') || '(default)');
    console.log('Attributes for Faceting:', settings.attributesForFaceting?.join(', ') || '(none)');
    
    // Check for language-related issues
    if (!settings.indexLanguages || settings.indexLanguages.length === 0) {
      console.log('\n⚠️  Warning: indexLanguages not set. Consider setting to:', LOCALES.map(l => l.split('-')[0]));
    }
    
    return settings;
  } catch (error) {
    if (error.message.includes('403') || error.message.includes('Invalid')) {
      console.log('⚠️  Cannot read index settings with search-only key.');
      console.log('   Run with ALGOLIA_ADMIN_KEY to see full settings.\n');
    } else {
      throw error;
    }
  }
}

async function auditLanguageCoverage() {
  console.log('\n🌍 LANGUAGE COVERAGE AUDIT');
  console.log('===========================\n');
  
  try {
    const result = await getFacets();
    
    console.log('Total records in index:', result.nbHits);
    console.log('\nFacet Distribution:');
    
    // DocSearch uses 'lang' or 'language' or 'docusaurus_tag' for language filtering
    const langFacet = result.facets?.lang || result.facets?.language || {};
    const tagFacet = result.facets?.docusaurus_tag || {};
    const versionFacet = result.facets?.version || {};
    
    if (Object.keys(langFacet).length > 0) {
      console.log('\n  Language (lang):');
      for (const [lang, count] of Object.entries(langFacet).sort((a, b) => b[1] - a[1])) {
        const pct = ((count / result.nbHits) * 100).toFixed(1);
        console.log(`    ${lang}: ${count} records (${pct}%)`);
      }
    }
    
    if (Object.keys(tagFacet).length > 0) {
      console.log('\n  Docusaurus Tags (docusaurus_tag):');
      for (const [tag, count] of Object.entries(tagFacet).sort((a, b) => b[1] - a[1])) {
        const pct = ((count / result.nbHits) * 100).toFixed(1);
        console.log(`    ${tag}: ${count} records (${pct}%)`);
      }
    }
    
    if (Object.keys(versionFacet).length > 0) {
      console.log('\n  Versions:');
      for (const [version, count] of Object.entries(versionFacet).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${version}: ${count} records`);
      }
    }
    
    // Check for missing languages
    const indexedLangs = new Set(Object.keys(langFacet));
    const missingLangs = LOCALES.filter(l => !indexedLangs.has(l) && !indexedLangs.has(l.split('-')[0]));
    
    if (missingLangs.length > 0) {
      console.log('\n⚠️  Missing languages in index:', missingLangs.join(', '));
      console.log('   These may need to be crawled or the crawler config updated.');
    } else if (Object.keys(langFacet).length > 0) {
      console.log('\n✅ All configured languages appear to be indexed!');
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching facets:', error.message);
  }
}

async function auditSearchQuality() {
  console.log('\n🔍 SEARCH QUALITY AUDIT');
  console.log('========================\n');
  
  const results = {};
  
  // First, get the actual lang values from the index
  const facetResult = await getFacets();
  const indexedLangs = Object.keys(facetResult.facets?.lang || {});
  console.log('Languages in index:', indexedLangs.join(', '));
  
  // Map our locale codes to what's in the index
  const localeToIndexLang = {
    'en': 'en-GB',
    'en-GB': 'en-GB',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'ja': 'ja',
    'pt-BR': 'pt-BR',
    'ko': 'ko',
    'it': 'it',
    'ar': 'ar',
    'hi-IN': 'hi-IN',
    'zh-CN': 'zh-CN',
  };
  
  for (const locale of LOCALES) {
    const queries = TEST_QUERIES[locale] || TEST_QUERIES.en;
    const localeResults = [];
    const indexLang = localeToIndexLang[locale] || locale;
    const isIndexed = indexedLangs.includes(indexLang);
    
    console.log(`\nTesting ${locale} (index: ${indexLang}) ${isIndexed ? '' : '⚠️ NOT IN INDEX'}...`);
    
    if (!isIndexed) {
      results[locale] = [{ query: '(skipped)', hits: 0, error: 'Language not indexed' }];
      continue;
    }
    
    for (const query of queries.slice(0, 3)) { // Test first 3 queries per language
      try {
        // Filter by lang facet
        const filters = `lang:"${indexLang}"`;
        
        const result = await search(query, filters);
        localeResults.push({
          query,
          hits: result.nbHits,
          topResult: result.hits[0]?.hierarchy?.lvl1 || result.hits[0]?.url || '(no results)',
        });
        
        const status = result.nbHits > 0 ? '✅' : '❌';
        console.log(`  ${status} "${query}": ${result.nbHits} results`);
        
      } catch (error) {
        console.log(`  ⚠️  "${query}": Error - ${error.message}`);
        localeResults.push({ query, hits: 0, error: error.message });
      }
    }
    
    results[locale] = localeResults;
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('==========\n');
  
  for (const [locale, localeResults] of Object.entries(results)) {
    const totalHits = localeResults.reduce((sum, r) => sum + r.hits, 0);
    const avgHits = (totalHits / localeResults.length).toFixed(1);
    const hasResults = localeResults.some(r => r.hits > 0);
    const notIndexed = localeResults[0]?.error === 'Language not indexed';
    
    if (notIndexed) {
      console.log(`⚠️  ${locale}: NOT INDEXED - needs crawler config update`);
    } else {
      const status = hasResults ? '✅' : '❌';
      console.log(`${status} ${locale}: avg ${avgHits} hits/query`);
    }
  }
  
  return results;
}

async function sampleRecords() {
  console.log('\n📄 SAMPLE RECORDS');
  console.log('==================\n');
  
  try {
    const result = await browseIndex({ hitsPerPage: 5 });
    
    console.log('Sample records from index:\n');
    for (const hit of result.hits.slice(0, 5)) {
      console.log(`  URL: ${hit.url}`);
      console.log(`  Lang: ${hit.lang || hit.language || '(not set)'}`);
      console.log(`  Tag: ${hit.docusaurus_tag || '(not set)'}`);
      console.log(`  Title: ${hit.hierarchy?.lvl0 || hit.hierarchy?.lvl1 || '(no title)'}`);
      console.log('');
    }
  } catch (error) {
    if (error.message.includes('403') || error.message.includes('Invalid')) {
      console.log('⚠️  Cannot browse records with search-only key.');
      console.log('   Run with ALGOLIA_ADMIN_KEY to see sample records.\n');
    } else {
      throw error;
    }
  }
}

// Main
async function main() {
  console.log('🔎 ALGOLIA SEARCH AUDIT FOR WCPOS DOCS');
  console.log('======================================');
  console.log(`App ID: ${ALGOLIA_APP_ID}`);
  console.log(`Index: ${ALGOLIA_INDEX}`);
  console.log(`Using: ${process.env.ALGOLIA_ADMIN_KEY ? 'Admin API Key' : 'Search-only API Key'}`);
  
  try {
    await auditIndexSettings();
    await auditLanguageCoverage();
    await sampleRecords();
    await auditSearchQuality();
    
    console.log('\n\n📚 NEXT STEPS');
    console.log('==============\n');
    console.log('1. Check the Algolia Dashboard for more details:');
    console.log('   https://dashboard.algolia.com/apps/9UQMJOIS5T/explorer/browse/wcpos\n');
    console.log('2. If languages are missing, check your DocSearch crawler config:');
    console.log('   https://crawler.algolia.com/\n');
    console.log('3. To trigger a re-crawl, go to the crawler dashboard and click "Restart crawl"\n');
    console.log('4. For detailed analytics, check:');
    console.log('   https://dashboard.algolia.com/apps/9UQMJOIS5T/analytics\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
