const { createProcessor } = require('@mdx-js/mdx');
const remarkDirective = require('remark-directive').default;
const remarkFrontmatter = require('remark-frontmatter').default;
const remarkGfm = require('remark-gfm').default;

// The same parse stack Docusaurus uses, so a literal ** here is a literal ** on the site.
const processor = createProcessor({ format: 'mdx', remarkPlugins: [remarkFrontmatter, remarkGfm, remarkDirective] });

function parseMdx(text) {
  // Docusaurus strips {#id} heading anchors before MDX sees them; blank them to keep offsets.
  const blanked = text.replace(/[ \t]*\{#[^{}\s]+\}[ \t]*$/gm, match => ' '.repeat(match.length));
  return processor.parse(blanked);
}

function literalEmphasisRuns(text) {
  let tree;
  try { tree = parseMdx(text); } catch { return null; }
  const runs = [];
  const walk = node => {
    if (node.type === 'text') {
      const start = node.position?.start?.offset;
      const end = node.position?.end?.offset;
      // Escapes and entities shift text offsets; report those runs without a position.
      const aligned = start !== undefined && text.slice(start, end) === node.value;
      for (const match of node.value.matchAll(/\*{2,}|_{2,}/g)) {
        runs.push({ marker: match[0].slice(0, 2), offset: aligned ? start + match.index : null, length: match[0].length });
      }
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(tree);
  return runs;
}

function findRenderIssues(source, translation) {
  const sourceRuns = literalEmphasisRuns(source);
  if (sourceRuns === null) return [];
  const translatedRuns = literalEmphasisRuns(translation);
  if (translatedRuns === null) return ['mdx_parse'];
  const count = (runs, marker) => runs.filter(run => run.marker === marker).length;
  return ['**', '__'].some(marker => count(translatedRuns, marker) > count(sourceRuns, marker)) ? ['literal_emphasis'] : [];
}

function classify(char) {
  if (char === undefined || /\s/u.test(char)) return 'space';
  return /[\p{P}\p{S}]/u.test(char) ? 'punct' : 'other';
}

function repairLiteralEmphasis(source, translation) {
  if (!findRenderIssues(source, translation).includes('literal_emphasis')) return translation;
  const insertions = [];
  for (const run of literalEmphasisRuns(translation)) {
    if (run.offset === null) continue;
    const end = run.offset + run.length;
    // Two code units back covers a surrogate pair; Array.from splits by code point.
    const before = classify(Array.from(translation.slice(Math.max(0, run.offset - 2), run.offset)).at(-1));
    const after = classify(Array.from(translation.slice(end, end + 2))[0]);
    // Only the CJK flanking fix: one space between full-width punctuation and a letter.
    if (before === 'punct' && after === 'other') insertions.push(end);
    else if (before === 'other' && after === 'punct') insertions.push(run.offset);
  }
  if (!insertions.length) return translation;
  let edited = translation;
  for (const offset of insertions.sort((a, b) => b - a)) edited = `${edited.slice(0, offset)} ${edited.slice(offset)}`;
  return findRenderIssues(source, edited).length === 0 ? edited : translation;
}

module.exports = { parseMdx, literalEmphasisRuns, findRenderIssues, repairLiteralEmphasis };
