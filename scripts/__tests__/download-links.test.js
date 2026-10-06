const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const config = require('../../docusaurus.config.js');

const projectRoot = path.join(__dirname, '..', '..');
const linuxUrl = 'https://updates.wcpos.com/v1/electron/download/linux-x64';
// Every link target on a page: href="<url>" in MDX or ](<url>) in Markdown.
function extractLinkTargets(content) {
  return Array.from(content.matchAll(/href="([^"]+)"|\]\(([^)\s]+)\)/g), ([, href, markdown]) => href ?? markdown);
}

function readProjectFile(filePath) {
  return fs.readFileSync(path.join(projectRoot, filePath), 'utf8');
}

function extractIconMapKeys() {
  const iconSource = readProjectFile('src/components/Icon.js');
  const iconMapMatch = iconSource.match(/const iconMap = \{(?<body>[\s\S]*?)\n\};/);

  expect(iconMapMatch).not.toBeNull();

  return new Set(
    Array.from(iconMapMatch.groups.body.matchAll(/['"]([^'"]+)['"]\s*:/g), ([, key]) => key)
  );
}

describe('Desktop download links', () => {
  it('uses the /v1/ form for every desktop download link', () => {
    const files = [
      ...globSync('{docs,versioned_docs,i18n}/**/*.{md,mdx,json}', { cwd: projectRoot, nodir: true }),
      'docusaurus.config.js',
      ...globSync('src/**/*.js', { cwd: projectRoot, nodir: true }),
    ];
    const offendingFiles = files.filter((filePath) =>
      readProjectFile(filePath).includes('updates.wcpos.com/electron/download')
    );

    expect(offendingFiles).toEqual([]);
  });

  it('offers Linux on every getting-started home and installation page', () => {
    const pages = globSync(
      '{versioned_docs/version-{1.x,2.x},i18n/*/docusaurus-plugin-content-docs/version-1.x}/getting-started/{index,installation}.mdx',
      { cwd: projectRoot, nodir: true }
    );
    const missingPages = pages.filter(
      (filePath) => !extractLinkTargets(readProjectFile(filePath)).some((target) => target === linuxUrl)
    );

    expect(pages).toHaveLength(26);
    expect(missingPages).toEqual([]);
  });

  it('links the footer Linux item to the linux-x64 download', () => {
    const linuxLink = config.themeConfig.footer.links
      .flatMap(({ items }) => items)
      .find(({ label }) => label === 'WCPOS for Linux');

    expect(linuxLink?.href).toBe(linuxUrl);
  });

  it('maps the linux icon', () => {
    expect(extractIconMapKeys().has('linux')).toBe(true);
  });
});
