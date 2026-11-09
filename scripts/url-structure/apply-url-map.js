const fs = require('fs');
const path = require('path');

function setSlug(text, slug) {
  return text.replace(/^---(\r?\n)([\s\S]*?)\r?\n---(?=\r?\n|$)/, (frontmatter, newline, body) => {
    let next;
    if (/^slug:/m.test(body)) {
      next = body.replace(/^slug:[^\r\n]*/m, `slug: ${slug}`);
    } else if (/^title:/m.test(body)) {
      next = body.replace(/^title:[^\r\n]*/m, (title) => `${title}${newline}slug: ${slug}`);
    } else {
      next = `slug: ${slug}${newline}${body}`;
    }
    const start = 3 + newline.length;
    return frontmatter.slice(0, start) + next + frontmatter.slice(start + body.length);
  });
}

function buildLinkMap(map, redirects) {
  return Object.fromEntries([
    ...map.docs.map(({ oldRoute, newRoute }) => [oldRoute, newRoute]),
    ...map.categories.map(({ oldRoute, newRoute }) => [oldRoute, newRoute]),
    ...map.removedCategories.map(({ oldRoute, redirectsTo }) => [oldRoute, redirectsTo]),
    ...redirects.filter(({ source }) => !/[:(]/.test(source))
      .map(({ source, destination }) => [source, destination]),
  ]);
}

function rewriteLinks(text, linkMap) {
  return text.replace(/(\]\(|["'{=])(https:\/\/docs\.wcpos\.com)?(\/[^#?)"'`\s}]*)/g,
    (match, before, origin, route) => {
      const key = route.replace(/^\/2\.x(?=\/|$)/, '');
      return Object.hasOwn(linkMap, key) ? before + (origin || '') + linkMap[key] : match;
    });
}

function transformSidebar(sidebarJson, map) {
  const result = JSON.parse(JSON.stringify(sidebarJson));
  function category(labels) {
    let current = { items: result.sidebar };
    for (const label of labels) {
      current = current?.items.find((item) => item.type === 'category' && item.label === label);
    }
    return current;
  }
  for (const { sidebarPath, newRoute } of map.categories) {
    const item = category(sidebarPath);
    item.link = { ...item.link, type: 'generated-index', slug: newRoute };
  }
  for (const { items, fromPath, toPath, position } of map.sidebarMoves) {
    const from = category(fromPath);
    const to = category(toPath);
    if (items.every((id, index) => to.items[position + index]?.id === id)
        && items.every((id) => !from?.items.some((item) => item.id === id))) continue;
    const moved = items.map((id) => {
      const index = from?.items.findIndex((item) => item.id === id) ?? -1;
      if (index === -1) throw new Error(`Missing ${id} in ${fromPath.join(' > ')}`);
      return from.items.splice(index, 1)[0];
    });
    to.items.splice(position, 0, ...moved);
  }
  for (const { sidebarPath } of map.removedCategories) {
    const item = category(sidebarPath);
    if (!item) continue;
    if (item.items.length) throw new Error(`Category is not empty: ${sidebarPath.join(' > ')}`);
    const parent = category(sidebarPath.slice(0, -1));
    parent.items.splice(parent.items.indexOf(item), 1);
  }
  for (const { docId, docEntryIn, refEntryIn } of map.docRefSwaps) {
    category(docEntryIn).items.find((item) => item.id === docId).type = 'doc';
    category(refEntryIn).items.find((item) => item.id === docId).type = 'ref';
  }
  for (const [labels, entries] of Object.entries(map.resultingItems)) {
    const actual = category(labels.split(' > ')).items.map(({ id, label }) => ({ id, label }));
    const expected = entries.map(({ docId, label }) => ({ id: docId, label }));
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${labels} differs:\n- expected ${JSON.stringify(expected)}\n+ actual ${JSON.stringify(actual)}`);
    }
  }
  return result;
}

function docFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? docFiles(file) : /\.mdx?$/.test(file) ? [file] : [];
  });
}

function main() {
  const check = process.argv.includes('--check');
  const map = JSON.parse(fs.readFileSync('scripts/url-structure/apply-map.json', 'utf8'));
  const redirects = JSON.parse(fs.readFileSync(map.redirects, 'utf8'));
  const sourceRoot = 'versioned_docs/version-2.x';
  const localeRoots = fs.readdirSync('i18n', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join('i18n', entry.name, 'docusaurus-plugin-content-docs/version-2.x'))
    .filter((directory) => fs.existsSync(directory));
  const originals = new Map();
  const updated = new Map();
  function read(file) {
    if (!originals.has(file)) originals.set(file, fs.readFileSync(file, 'utf8'));
    return updated.get(file) ?? originals.get(file);
  }
  function update(file, next) {
    const changed = read(file) !== next;
    updated.set(file, next);
    return Number(changed);
  }

  let slugs = 0;
  for (const { file, newRoute } of map.docs) {
    slugs += update(file, setSlug(read(file), newRoute));
    for (const root of localeRoots) {
      const localized = path.join(root, path.relative(sourceRoot, file));
      if (fs.existsSync(localized)) slugs += update(localized, setSlug(read(localized), newRoute));
    }
  }
  console.log(`Slugs: ${slugs} files changed`);

  const sidebarFile = 'versioned_sidebars/version-2.x-sidebars.json';
  const sidebar = transformSidebar(JSON.parse(read(sidebarFile)), map);
  const sidebars = update(sidebarFile, JSON.stringify(sidebar, null, 2) + '\n');
  console.log(`Sidebar: ${sidebars} files changed`);

  const config = JSON.parse(read('vercel.json'));
  config.redirects = redirects;
  const configs = update('vercel.json', JSON.stringify(config, null, 2) + '\n');
  console.log(`Redirects: ${configs} files changed (${redirects.length} rules)`);

  const linkMap = buildLinkMap(map, redirects);
  let links = 0;
  for (const file of [sourceRoot, ...localeRoots].flatMap(docFiles)) {
    links += update(file, rewriteLinks(read(file), linkMap));
  }
  console.log(`Links: ${links} files changed`);

  const changed = [...updated].filter(([file, text]) => originals.get(file) !== text);
  for (const [file, text] of changed) {
    if (check) console.log(file);
    else fs.writeFileSync(file, text);
  }
  if (check && changed.length) process.exitCode = 1;
}

module.exports = { setSlug, rewriteLinks, transformSidebar, buildLinkMap };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
