const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
// lightningcss and browserslist are not direct dependencies: resolve them from
// @docusaurus/faster (a direct dependency), the copies its CSS minimizer uses.
const fasterRequire = createRequire(require.resolve('@docusaurus/faster'));
const browserslist = fasterRequire('browserslist');
const { transform, browserslistToTargets } = fasterRequire('lightningcss');

const repoRoot = path.resolve(__dirname, '../..');
const cssPath = path.join(repoRoot, 'src/css/custom.css');

// Same targets as the Docusaurus Faster CSS minimizer: getLightningCssMinimizerOptions()
// in node_modules/@docusaurus/faster/lib/index.js calls browserslist() (the
// "browserslist" field of package.json, production env during a build) and
// passes browserslistToTargets(queries) to LightningCssMinimizerRspackPlugin.
// The env is pinned here because vitest sets NODE_ENV=test.
function fasterTargets() {
  const queries = browserslist(undefined, { path: repoRoot, env: 'production' });
  return browserslistToTargets(queries);
}

function minifiedCustomCss() {
  const { code } = transform({
    filename: 'custom.css',
    code: fs.readFileSync(cssPath),
    minify: true,
    targets: fasterTargets(),
  });
  return code.toString();
}

// Walk minified CSS and return every style rule with the at-rule preludes
// (e.g. "@media (width>=997px)") that enclose it.
function styleRules(css) {
  const rules = [];
  const stack = [];
  let buf = '';
  let quote = null;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (quote) {
      buf += ch;
      if (ch === '\\') {
        buf += css[++i] ?? '';
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
    } else if (ch === '{') {
      const prelude = buf.trim();
      buf = '';
      if (prelude.startsWith('@')) {
        stack.push({ atRule: prelude });
      } else {
        stack.push({ selector: prelude, atRules: stack.filter((s) => s.atRule).map((s) => s.atRule) });
      }
    } else if (ch === '}') {
      const open = stack.pop();
      if (open && open.selector !== undefined) {
        rules.push({ selector: open.selector, atRules: open.atRules, body: buf });
      }
      buf = '';
    } else {
      buf += ch;
    }
  }
  return rules;
}

// The rule styles the .navbar element itself: some selector in the list has
// .navbar (not .navbar__inner, .navbar-sidebar, …) in its last compound.
function targetsNavbar(selectorList) {
  return selectorList.split(',').some((sel) => {
    const compounds = sel.trim().split(/\s*[\s>+~]\s*/);
    return /\.navbar(?![\w-])/.test(compounds[compounds.length - 1]);
  });
}

function backdropDeclarations(body) {
  return body
    .split(';')
    .map((decl) => decl.trim())
    .filter((decl) => /^(-webkit-)?backdrop-filter\s*:/i.test(decl))
    .map((decl) => decl.slice(decl.indexOf(':') + 1).trim());
}

const DESKTOP_MEDIA = /@media[^{]*\((?:min-width\s*:\s*997px|width\s*>=\s*997px)\)/i;

describe('navbar backdrop-filter in the minified build CSS', () => {
  const css = minifiedCustomCss();
  const blurred = styleRules(css)
    .filter((rule) => targetsNavbar(rule.selector))
    .flatMap((rule) =>
      backdropDeclarations(rule.body)
        .filter((value) => !/^none(\s*!important)?$/i.test(value))
        .map((value) => ({ ...rule, value }))
    );

  it('keeps the frosted-glass blur on the desktop navbar', () => {
    expect(blurred.length).toBeGreaterThan(0);
  });

  it('applies backdrop-filter to .navbar only inside a min-width: 997px media query', () => {
    // backdrop-filter makes .navbar the containing block for the position:fixed
    // mobile drawer (.navbar-sidebar), clipping it to the 64px navbar.
    const outsideDesktop = blurred
      .filter((rule) => !rule.atRules.some((atRule) => DESKTOP_MEDIA.test(atRule)))
      .map((rule) => `${[...rule.atRules, rule.selector].join(' ')} { backdrop-filter: ${rule.value} }`);
    expect(outsideDesktop).toEqual([]);
  });
});
