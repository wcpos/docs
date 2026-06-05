const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

function readProjectFile(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', '..', filePath), 'utf8');
}

function extractIconMapKeys() {
  const iconSource = readProjectFile('src/components/Icon.js');
  const iconMapMatch = iconSource.match(/const iconMap = \{(?<body>[\s\S]*?)\n\};/);

  expect(iconMapMatch).not.toBeNull();

  return new Set(
    Array.from(iconMapMatch.groups.body.matchAll(/['"]([^'"]+)['"]\s*:/g), ([, key]) => key)
  );
}

function extractFeatureCardIconUsages() {
  const projectRoot = path.join(__dirname, '..', '..');
  const mdxFiles = globSync('{docs,versioned_docs,i18n}/**/*.mdx', {
    cwd: projectRoot,
    nodir: true,
  });

  return mdxFiles.flatMap((filePath) => {
    const content = readProjectFile(filePath);
    return Array.from(content.matchAll(/<FeatureCard\b[^>]*\bicon=["']([^"']+)["']/g), ([, icon]) => ({
      filePath,
      icon,
    }));
  });
}

describe('FeatureCard icon usage', () => {
  it('only uses names registered in the shared icon map', () => {
    const iconMapKeys = extractIconMapKeys();
    const missingIcons = extractFeatureCardIconUsages()
      .filter(({ icon }) => !iconMapKeys.has(icon))
      .map(({ filePath, icon }) => `${filePath}: ${icon}`);

    expect(missingIcons).toEqual([]);
  });
});
