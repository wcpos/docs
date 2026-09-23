const { parseDocsMdxUnits } = require('./mdx-units');
const { validateDocsMdxStructure, validateProtectedTermsInText } = require('./docs-qa');

const STRUCTURAL_ISSUE_CODES = new Set([
  'code_block_changed', 'import_changed', 'link_url_changed', 'inline_code_changed',
  'inline_code_punctuation_changed', 'inline_code_spacing_changed', 'protected_term_removed',
]);
const CJK_LOCALES = new Set(['ja', 'ko', 'zh-CN']);

function decodeDocsUnitSource(parsed, unit) {
  const { source, range } = unit;
  const before = parsed.source[range.start - 1];
  const after = parsed.source[range.end];
  if (unit.type === 'frontmatter') {
    if (before === '"' && after === '"') {
      const escapes = {
        '0': '\0', a: '\x07', b: '\b', t: '\t', n: '\n', v: '\v', f: '\f', r: '\r',
        e: '\x1b', ' ': ' ', '"': '"', '/': '/', '\\': '\\',
        N: '\u0085', _: '\u00a0', L: '\u2028', P: '\u2029',
      };
      return source.replace(/\\(x[\da-fA-F]{2}|u[\da-fA-F]{4}|U[\da-fA-F]{8}|[0abtnvfre "\/\\N_LP])/g, (_match, escape) => (
        escape.length > 1 ? String.fromCodePoint(parseInt(escape.slice(1), 16)) : escapes[escape]
      ));
    }
    return before === "'" && after === "'" ? source.replaceAll("''", "'") : source;
  }
  const quote = unit.attrQuote ?? before ?? '"';
  if (unit.type === 'link_title') {
    return source.replaceAll(`\\${quote}`, quote);
  }
  if (unit.type === 'jsx_attr') {
    if (unit.attrSyntax === 'braced') {
      // Apply escapes only backslashes and the enclosing quote in JS strings.
      return source.replace(/\\([\\"'])/g, (match, char) => char === '\\' || char === quote ? char : match);
    }
    return quote === '"' ? source.replaceAll('&quot;', '"') : source.replaceAll('&#39;', "'");
  }
  return source;
}

function unitKey(unit, decodedSource) {
  return [unit.type, unit.key ?? '', unit.attr ?? '', decodedSource].join('\u0000');
}

function unitFingerprint(unit) {
  const urls = Array.from(unit.source.matchAll(/\]\(([^\s)]+)|\b(?:href|src)="([^"]*)"/g), (match) => match[1] ?? match[2]);
  return JSON.stringify([unit.type, unit.key ?? '', unit.attr ?? '', urls]);
}

function alignUnits(oldUnits, targetUnits) {
  const old = oldUnits.map(unitFingerprint);
  const target = targetUnits.map(unitFingerprint);
  const pairs = [];

  function align(a0, a1, b0, b1) {
    if (a1 - a0 === b1 - b0 && old.slice(a0, a1).every((fingerprint, index) => fingerprint === target[b0 + index])) {
      for (let a = a0; a < a1; a += 1) pairs.push([a, b0 + a - a0]);
      return;
    }
    const oldPositions = new Map();
    const targetPositions = new Map();
    for (let a = a0; a < a1; a += 1) {
      oldPositions.set(old[a], oldPositions.has(old[a]) ? -1 : a);
    }
    for (let b = b0; b < b1; b += 1) {
      targetPositions.set(target[b], targetPositions.has(target[b]) ? -1 : b);
    }
    const matches = [];
    for (const [fingerprint, a] of oldPositions) {
      const b = targetPositions.get(fingerprint);
      if (a !== -1 && b !== undefined && b !== -1) matches.push([a, b]);
    }

    // Track the smallest target index ending each increasing subsequence length.
    const tails = [];
    const previous = [];
    for (let index = 0; index < matches.length; index += 1) {
      let low = 0;
      let high = tails.length;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (matches[tails[middle]][1] < matches[index][1]) low = middle + 1;
        else high = middle;
      }
      previous[index] = low > 0 ? tails[low - 1] : -1;
      tails[low] = index;
    }
    if (tails.length === 0) return;
    const anchors = [];
    for (let index = tails[tails.length - 1]; index !== -1; index = previous[index]) {
      anchors.push(matches[index]);
    }
    anchors.reverse();
    for (const [a, b] of anchors) {
      align(a0, a, b0, b);
      pairs.push([a, b]);
      a0 = a + 1;
      b0 = b + 1;
    }
    align(a0, a1, b0, b1);
  }

  align(0, old.length, 0, target.length);
  return pairs;
}

function pairLooksRight({ source, translation, locale, file }) {
  if (translation.trim() === '') return false;
  const issues = [
    ...validateDocsMdxStructure(source, translation, file, locale),
    ...validateProtectedTermsInText(source, translation, file),
  ];
  if (issues.some((issue) => STRUCTURAL_ISSUE_CODES.has(issue.code))) return false;
  if (JSON.stringify((source.match(/\d+/g) ?? []).sort()) !== JSON.stringify((translation.match(/\d+/g) ?? []).sort())) return false;
  if (source.length >= 40) {
    const ratio = translation.length / source.length;
    const [min, max] = CJK_LOCALES.has(locale) ? [0.1, 2] : [0.3, 3];
    if (ratio < min || ratio > max) return false;
  }
  return true;
}

function recoverTranslations({ file, locale, oldEnglishPath, oldEnglish, target }) {
  const oldParsed = parseDocsMdxUnits(oldEnglishPath, oldEnglish);
  const targetParsed = parseDocsMdxUnits(file, target);
  const translations = new Map();
  let paired = 0;
  let rejected = 0;
  for (const [oldIndex, targetIndex] of alignUnits(oldParsed.units, targetParsed.units)) {
    const oldUnit = oldParsed.units[oldIndex];
    const source = decodeDocsUnitSource(oldParsed, oldUnit);
    const translation = decodeDocsUnitSource(targetParsed, targetParsed.units[targetIndex]);
    if (pairLooksRight({ source, translation, locale, file })) {
      const key = unitKey(oldUnit, source);
      if (!translations.has(key)) translations.set(key, translation);
      paired += 1;
    } else {
      rejected += 1;
    }
  }
  return { translations, paired, rejected };
}

module.exports = {
  decodeDocsUnitSource, unitKey, unitFingerprint, alignUnits, pairLooksRight,
  recoverTranslations, STRUCTURAL_ISSUE_CODES, CJK_LOCALES,
};
