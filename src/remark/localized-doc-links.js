const fs = require('fs');
const path = require('path');

function resolveLocalizedDocLink({ siteDir, sourceFilePath, url, locale, defaultLocale = 'en', exists }) {
  if (!locale || locale === defaultLocale || typeof url !== 'string'
    || /^(?:\/|#|@site\/)/.test(url) || /^[a-z][a-z0-9+.-]*:/i.test(url)) return null;

  const suffixIndex = url.search(/[?#]/);
  const pathPart = suffixIndex === -1 ? url : url.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : url.slice(suffixIndex);
  if (!/\.mdx?$/i.test(pathPart)) return null;

  const sourceRel = path.relative(siteDir, sourceFilePath).split(path.sep).join('/');
  const match = sourceRel.match(
    /^(?:versioned_docs|i18n\/[^/]+\/docusaurus-plugin-content-docs)\/version-([^/]+)\/(.+)$/,
  );
  if (!match) return null;

  const [, version, rel] = match;
  const targetRel = path.posix.normalize(
    path.posix.join(path.posix.dirname(rel), decodeURIComponent(pathPart)),
  );
  const targetRels = [targetRel];
  if (!/^\.\.?\//.test(url)) targetRels.push(path.posix.normalize(decodeURIComponent(pathPart)));
  const candidates = new Set();
  for (const target of targetRels) {
    if (target === '..' || target.startsWith('../')) continue;
    candidates.add(`i18n/${locale}/docusaurus-plugin-content-docs/version-${version}/${target}`);
    candidates.add(`versioned_docs/version-${version}/${target}`);
  }
  for (const candidate of candidates) {
    if (exists(path.join(siteDir, candidate))) return '@site/' + candidate + suffix;
  }
  return null;
}

function attacher(options = {}) {
  return (tree, file) => {
    const locale = options.locale ?? process.env.DOCUSAURUS_CURRENT_LOCALE;
    const siteDir = options.siteDir ?? file.cwd ?? process.cwd();
    const exists = options.exists ?? fs.existsSync;

    function walk(node) {
      if (node.type === 'link' || node.type === 'definition') {
        const url = resolveLocalizedDocLink({
          siteDir, sourceFilePath: file.path, url: node.url, locale, exists,
        });
        if (url !== null) node.url = url;
      }
      if (node.children) node.children.forEach(walk);
    }
    walk(tree);
  };
}

module.exports = attacher;
module.exports.resolveLocalizedDocLink = resolveLocalizedDocLink;
