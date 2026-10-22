#!/usr/bin/env node
// Tell IndexNow engines (Bing/Copilot, ...) which docs pages changed so they re-crawl
// soon after a production deploy. Run by .github/workflows/indexnow.yml.
// Usage: node scripts/indexnow-ping.js [--dry-run] [paths...]  (or paths on stdin)
// A notification must never fail a deploy: every outcome exits 0.
const fs = require('fs');
const path = require('path');

// Production origin; matches `url` in docusaurus.config.js.
const SITE_URL = 'https://docs.wcpos.com';
// Public by protocol design: IndexNow proves ownership by fetching static/<key>.txt.
const INDEXNOW_KEY = 'b8359e29a734ed3f589470e1430b942d';
// Shared endpoint; IndexNow forwards to every participating engine.
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
// Protocol maximum URLs per request.
const MAX_URLS = 10000;
// Don't let a slow endpoint hold the workflow runner.
const REQUEST_TIMEOUT_MS = 30000;

// Only the current version (1.x) is built and served at the site root;
// 0.4.x is noindex, 2.x is unbuilt, docs/ is excluded (includeCurrentVersion: false).
const EN_RE = /^versioned_docs\/version-1\.x\/(.+)\.mdx?$/;
const I18N_RE = /^i18n\/([^/]+)\/docusaurus-plugin-content-docs\/version-1\.x\/(.+)\.mdx?$/;

function readSlug(fileText) {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fileText || '');
  const line = block && /^slug:\s*(.+?)\s*$/m.exec(block[1]);
  return line ? line[1].replace(/^(['"])(.*)\1$/, '$2') : null;
}

/** Map a repo-relative file path (+ its file text) to its public URL, or null. */
function fileToUrl(filePath, fileText = '') {
  const rel = filePath.replace(/\\/g, '/');
  const en = EN_RE.exec(rel);
  const i18n = I18N_RE.exec(rel);
  if (!en && !i18n) return null;
  const locale = en ? null : i18n[1];
  const docPath = en ? en[1] : i18n[2];

  const dir = path.posix.dirname(docPath) === '.' ? '' : path.posix.dirname(docPath);
  const slug = readSlug(fileText);
  let route;
  if (slug) route = slug.startsWith('/') ? slug : path.posix.join('/', dir, slug);
  else if (path.posix.basename(docPath) === 'index') route = `/${dir}`;
  else route = `/${docPath}`;

  route = route.replace(/\/+$/, ''); // trailingSlash: false; slug "/" becomes the root
  return `${SITE_URL}${locale ? `/${locale}` : ''}${route}`;
}

function buildPayload(urlList) {
  return {
    host: new URL(SITE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList,
  };
}

function collectUrls(files, readFile) {
  const urls = new Set();
  for (const file of files) {
    let text = '';
    try { text = readFile(file); } catch { /* unreadable: map by path alone */ }
    const url = fileToUrl(file, text);
    if (url) urls.add(url);
  }
  return [...urls].slice(0, MAX_URLS);
}

async function main(argv = process.argv.slice(2)) {
  const dryRun = argv.includes('--dry-run');
  let files = argv.filter((arg) => arg !== '--dry-run');
  if (files.length === 0 && !process.stdin.isTTY) {
    files = fs.readFileSync(0, 'utf8').split('\n');
  }
  files = files.map((f) => f.trim()).filter(Boolean);

  const urls = collectUrls(files, (f) => fs.readFileSync(f, 'utf8'));
  if (urls.length === 0) {
    console.log('IndexNow: no current-version docs pages changed; nothing to send.');
    return;
  }
  const payload = buildPayload(urls);
  console.log(`IndexNow: ${urls.length} URL(s):\n${urls.join('\n')}`);
  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    console.log(`IndexNow: HTTP ${res.status} ${res.statusText}`);
    if (!res.ok) console.log(await res.text().catch(() => ''));
  } catch (err) {
    console.log(`IndexNow: request failed (ignored): ${err.message}`);
  }
}

if (require.main === module) {
  main()
    .catch((err) => console.log(`IndexNow: error (ignored): ${err.message}`))
    .finally(() => { process.exitCode = 0; });
}

module.exports = { fileToUrl, readSlug, buildPayload, collectUrls, INDEXNOW_KEY };
