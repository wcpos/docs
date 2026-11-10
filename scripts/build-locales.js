// One process for all 12 locales ran out of memory on Vercel's 8 GB build
// machine on the first Faster production deploy (2026-11-10).
// Separate processes release memory between locales. The default locale
// goes first because its build empties build/.
const { spawnSync } = require('child_process');

function buildPlan(argv, { defaultLocale, locales }) {
  if (locales.length === 0 || !locales.includes(defaultLocale)) {
    throw new Error('locales must include the default locale');
  }
  if (new Set(locales).size !== locales.length) {
    throw new Error('locales must not contain duplicates');
  }
  if (argv.some((arg) => arg === '--locale' || arg.startsWith('--locale='))) {
    return [['build', ...argv]];
  }
  return [
    defaultLocale,
    ...locales.filter((locale) => locale !== defaultLocale),
  ].map((locale) => ['build', '--locale', locale, ...argv]);
}

function main() {
  const config = require('../docusaurus.config.js');
  const plan = buildPlan(process.argv.slice(2), config.i18n);
  const bin = require.resolve('@docusaurus/core/bin/docusaurus.mjs');

  for (const [index, entry] of plan.entries()) {
    const localeIndex = entry.findIndex(
      (arg) => arg === '--locale' || arg.startsWith('--locale=')
    );
    const locale =
      entry[localeIndex] === '--locale'
        ? entry[localeIndex + 1]
        : entry[localeIndex].slice('--locale='.length);
    if (plan.length > 1) {
      console.log(`build-locales: ${index + 1}/${plan.length} ${locale}`);
    }
    const start = Date.now();
    const result = spawnSync(process.execPath, [bin, ...entry], {
      stdio: 'inherit',
    });
    const seconds = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`build-locales: ${locale} done in ${seconds}s`);
    if (result.error || result.signal || result.status !== 0) {
      const status = result.error || result.signal ? 1 : result.status;
      console.error(
        `build-locales: ${locale} failed (${result.signal || status})`
      );
      process.exitCode = status;
      return;
    }
  }
  process.exitCode = 0;
}

if (require.main === module) {
  main();
}

module.exports = { buildPlan };
