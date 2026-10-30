const fs = require('fs');
const path = require('path');
const { parseDocsMdxUnits } = require('../docs-translation/mdx-units');
const { decodeDocsUnitSource } = require('../docs-translation/recover');
const { findRenderIssues, repairLiteralEmphasis } = require('../docs-translation/render-check');

const FIXTURES = path.join(__dirname, 'fixtures/render-check');
const SOURCE = 'versioned_docs/version-1.x/getting-started/is-wcpos-right-for-you.mdx';
const fixture = name => fs.readFileSync(path.join(FIXTURES, `is-wcpos-right-for-you.${name}.mdx`), 'utf8');
function units(text) {
  const parsed = parseDocsMdxUnits(SOURCE, text);
  return parsed.units.map(unit => decodeDocsUnitSource(parsed, unit));
}

describe('render-check', () => {
  it('repairs every broken zh-CN unit in the is-wcpos-right-for-you fixture to the hand fix', () => {
    const english = units(fixture('en'));
    const broken = units(fixture('zh-CN.broken'));
    const fixed = units(fixture('zh-CN.fixed'));
    expect([english.length, broken.length, fixed.length]).toEqual([38, 38, 38]);
    expect(broken.map((unit, index) => repairLiteralEmphasis(english[index], unit))).toEqual(fixed);
    expect(broken.filter((unit, index) => unit !== fixed[index])).toHaveLength(9);
  });

  it('flags the broken fixture file and passes the hand-fixed one', () => {
    expect(findRenderIssues(fixture('en'), fixture('zh-CN.broken'))).toEqual(['literal_emphasis']);
    expect(findRenderIssues(fixture('en'), fixture('zh-CN.fixed'))).toEqual([]);
  });

  it('inserts a space before an opener that follows a letter and precedes punctuation', () => {
    expect(repairLiteralEmphasis('Open **"Settings"** now.', '打开**“设置”**页面。')).toBe('打开 **“设置”** 页面。');
  });

  it('leaves an unrepairable literal bold alone and reports it', () => {
    const source = 'when **several orders** differ';
    const translation = 'lorsque **plusieurs commandes ** diffèrent';
    expect(repairLiteralEmphasis(source, translation)).toBe(translation);
    expect(findRenderIssues(source, translation)).toEqual(['literal_emphasis']);
  });

  it('reports mdx_parse only when the English unit parses', () => {
    expect(findRenderIssues('Use the <Badge>Pro</Badge> option.', "Utilisez l'option <Badge>Pro.")).toEqual(['mdx_parse']);
    expect(findRenderIssues('Text {', 'Texte {')).toEqual([]);
  });

  it('ignores Docusaurus heading anchors', () => {
    expect(findRenderIssues('## What is product meta data? {#what-is-product-meta-data}',
      '## Was sind Produkt-Metadaten? {#what-is-product-meta-data}')).toEqual([]);
  });

  it('does not flag literal markers the English already has', () => {
    expect(findRenderIssues('Type ** to start bold.', 'Tapez ** pour commencer le gras.')).toEqual([]);
  });
});
