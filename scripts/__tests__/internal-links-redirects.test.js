const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '../..');
const redirects = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).redirects;

function closeParen(s, i) {
  let depth = 0;
  for (let k = i; k < s.length; k++) {
    if (s[k] === '(') depth++;
    else if (s[k] === ')' && --depth === 0) return k + 1;
  }
  throw new Error(`unbalanced ( in ${s}`);
}

function compile(source) {
  let re = ''; let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (c === ':') {
      const name = /^:([A-Za-z0-9_]+)/.exec(source.slice(i))[1]; i += name.length + 1;
      let inner = null;
      if (source[i] === '(') { const j = closeParen(source, i); inner = source.slice(i + 1, j - 1); i = j; }
      const mod = /[*+?]/.test(source[i] || '') ? source[i++] : '';
      inner ??= mod === '*' || mod === '+' ? '.*' : '[^/]+';
      re += mod === '*' ? `(${inner})?` : `(${inner})`;
    } else if (c === '(') { const j = closeParen(source, i); re += `(${source.slice(i + 1, j - 1)})`; i = j; }
    else { re += c.replace(/[.+?^${}|[\]\\]/g, '\\$&'); i += 1; }
  }
  return new RegExp(`^${re}/?$`);
}

const rules = redirects.map((rule) => ({ ...rule, regex: compile(rule.source) }));
const sourceRoot = 'versioned_docs/version-2.x';
const localeRoots = fs.readdirSync(path.join(root, 'i18n'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({ directory: `i18n/${entry.name}/docusaurus-plugin-content-docs/version-2.x`, locale: entry.name }))
  .filter(({ directory }) => fs.existsSync(path.join(root, directory)));

function docFiles(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? docFiles(file) : /\.mdx?$/.test(file) ? [file] : [];
  });
}

const docs = [{ directory: sourceRoot, locale: '' }, ...localeRoots].flatMap(({ directory, locale }) =>
  docFiles(directory).map((file) => {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/.exec(text)?.[1] || '';
    const slug = /^slug:[ \t]*(.*)$/m.exec(frontmatter);
    const defaultRoute = ('/' + file.slice(directory.length + 1).replace(/\.mdx?$/, '')).replace(/\/index$/, '') || '/';
    const route = slug ? slug[1].trim().replace(/^(['"])(.*)\1$/, '$2') : defaultRoute;
    return { file, text, slug, route: (locale ? `/${locale}` : '') + route };
  })
);

it('no 2.x internal link points at a redirect source', () => {
  const hits = [];
  for (const { file, text } of docs) {
    const links = text.matchAll(/(\]\(|["'{=])(https:\/\/docs\.wcpos\.com)?(\/[^#?)"'`\s}]*)/g);
    for (const [, , origin, route] of links) {
      if (path.extname(route) || /^\/(?:1\.x|img|assets|0\.4\.x)\//.test(route)) continue;
      for (const { source, regex } of rules) {
        if (regex.test(route)) hits.push(`${file}: ${(origin || '') + route} → ${source}`);
      }
    }
  }
  expect(hits, hits.join('\n')).toEqual([]);
});

it('no 2.x page route is a redirect source', () => {
  const hits = [];
  for (const { file, route } of docs) {
    for (const { source, regex } of rules) {
      if (regex.test(route)) hits.push(`${file}: ${route} → ${source}`);
    }
  }
  expect(hits, hits.join('\n')).toEqual([]);
});

it('every 2.x error code lives at /error-codes/{CODE}', () => {
  for (const { file, slug } of docs.filter(({ file }) =>
    file.startsWith(`${sourceRoot}/error-codes/`) && file.endsWith('.mdx') && path.basename(file) !== 'index.mdx')) {
    const code = path.basename(file, '.mdx');
    expect(code, file).toMatch(/^[A-Z]+\d+$/);
    expect(slug, `${file} must use its default route`).toBeNull();
    const matching = rules.filter(({ regex }) => regex.test(`/error-codes/${code}`)).map(({ source }) => source);
    expect(matching, `${file}: ${matching.join(', ')}`).toEqual([]);
  }
});

it('the redirect list has no duplicate sources and no chains', () => {
  const sources = redirects.map(({ source }) => source);
  const duplicates = sources.filter((source, index) => sources.indexOf(source) !== index);
  const chains = [];
  for (const { source, destination } of redirects) {
    for (const next of rules) {
      if (next.regex.test(destination.split('#')[0])) chains.push(`${source} → ${destination} → ${next.source}`);
    }
  }
  expect(duplicates, duplicates.join('\n')).toEqual([]);
  expect(chains, chains.join('\n')).toEqual([]);
});
