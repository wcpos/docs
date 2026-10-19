import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { fieldMatches, normalizeSearch, suggestTerms, typeLabel } from '../fieldIndexSearch';

const pages = [
  ['versioned_docs/version-1.x/receipts/receipt-data.mdx', 'en'],
  ['versioned_docs/version-2.x/receipts/receipt-data.mdx', 'en'],
  ['i18n/es/docusaurus-plugin-content-docs/version-1.x/receipts/receipt-data.mdx', 'es'],
];

function readFieldArrays(page) {
  const source = readFileSync(page, 'utf8');
  return [...source.matchAll(/<FieldIndex\b/g)].map((occurrence) => {
    const prop = /\bfields=\{\s*\[/.exec(source.slice(occurrence.index));
    if (!prop) throw new Error(`Missing fields in ${page}`);
    const start = occurrence.index + prop.index + prop[0].lastIndexOf('[');
    const stack = [];
    let quote = '';
    for (let i = start; i < source.length; i++) {
      const char = source[i];
      if (quote) {
        if (char === '\\') i++;
        else if (char === quote) quote = '';
        continue;
      }
      if (char === "'" || char === '"' || char === '`') {
        quote = char;
      } else if (char === '[' || char === '{') {
        stack.push(char);
      } else if (char === ']' || char === '}') {
        const opening = stack.pop();
        if (opening !== (char === ']' ? '[' : '{')) throw new Error(`Unbalanced fields in ${page}`);
        if (!stack.length) return runInNewContext('(' + source.slice(start, i + 1) + ')');
      }
    }
    throw new Error(`Unclosed fields in ${page}`);
  });
}

describe.each(pages)('%s (%s)', (page, locale) => {
  it('every suggestion finds a row on the real pages', () => {
    const arrays = readFieldArrays(page);
    expect(arrays).toHaveLength(2);
    for (const fields of arrays) {
      const terms = suggestTerms(fields, locale);
      expect(terms).toHaveLength(2);
      for (const term of terms) {
        expect(fields.filter((f) => fieldMatches(f, term, {})).length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

it('es lines suggestions avoid the old miss', () => {
  const [fields] = readFieldArrays(pages[2][0]);
  expect(fields.filter((f) => fieldMatches(f, 'ahorros', {}))).toEqual([]);
  for (const term of suggestTerms(fields, 'es')) {
    expect(fields.filter((f) => fieldMatches(f, term, {})).length).toBeGreaterThanOrEqual(1);
  }
});

it('normalizeSearch folds Latin accents only', () => {
  expect(normalizeSearch('Descripción ÑU')).toBe('descripcion nu');
  expect(normalizeSearch('が')).not.toBe(normalizeSearch('か'));
  expect(normalizeSearch('が').normalize('NFD')).toContain('\u3099');
  expect(normalizeSearch('की')).toBe('की');
  expect(normalizeSearch(undefined)).toBe('');
  expect(normalizeSearch(42)).toBe('');
});

const labels = {
  types: { string: 'cadena', null: 'nulo' },
  badges: { money: 'dinero' },
};

it('fieldMatches is accent-insensitive and searches labels', () => {
  const field = { name: 'x', type: 'string/null', desc: 'Precio de venta', badges: ['money'] };
  for (const query of ['precio', 'PRECIÓ', 'cadena/nulo', 'dinero', 'string/null', 'money', 'x', '']) {
    expect(fieldMatches(field, query, labels)).toBe(true);
  }
  expect(fieldMatches(field, 'ahorro', labels)).toBe(false);
  expect(fieldMatches({ sample: [{ k: 'total_display' }] }, 'total_display', {})).toBe(true);
  expect(fieldMatches({}, 'precio')).toBe(false);
  expect(fieldMatches(undefined, '')).toBe(true);
});

it('fieldMatches trims the query', () => {
  const field = { name: 'x', type: 'string/null', desc: 'Precio de venta', badges: ['money'] };
  for (const query of [' precio', 'precio ', '  PRECIÓ  ', '   ']) {
    expect(fieldMatches(field, query, labels)).toBe(true);
  }
  expect(fieldMatches(field, ' ahorro ', labels)).toBe(false);
});

describe('suggestTerms rules', () => {
  it('removes code spans and takes distinct longest words in field order', () => {
    const fields = [
      { desc: 'Uses `line_total` value' },
      { desc: 'Discounted amount' },
      { desc: 'Discounted amount again' },
    ];
    expect(suggestTerms(fields, 'en')).toEqual(['value', 'discounted']);
    expect(suggestTerms(fields, 'en', 3)).toEqual(['value', 'discounted']);
    expect(suggestTerms(fields, 'en', 1)).toEqual(['value']);
    expect(suggestTerms(fields, 'en', 0)).toEqual([]);
  });

  it('keeps the first word on ties and removes strike markers', () => {
    expect(suggestTerms([{ desc: '~First~ value' }], 'en')).toEqual(['first']);
  });

  it('finds Japanese words that occur in the description', () => {
    const field = { desc: '割引後の合計金額' };
    const terms = suggestTerms([field], 'ja');
    expect(terms.length).toBeGreaterThanOrEqual(1);
    for (const term of terms) expect(field.desc).toContain(term);
  });

  it('handles empty fields, missing descriptions and invalid locales', () => {
    expect(suggestTerms(undefined, 'en')).toEqual([]);
    expect(suggestTerms([{}], 'en')).toEqual([]);
    expect(suggestTerms([], 'en')).toEqual([]);
    expect(suggestTerms([null, { desc: 42 }], 'en')).toEqual([]);
    expect(suggestTerms([{ desc: 'value' }], 'invalid_locale')).toEqual([]);
    expect(suggestTerms([{ desc: 'value' }], undefined)).toEqual(['value']);
  });
});

it('typeLabel maps compound parts and preserves unknown types', () => {
  expect(typeLabel('string/null', labels)).toBe('cadena/nulo');
  expect(typeLabel('date', labels)).toBe('date');
  expect(typeLabel('string', undefined)).toBe('string');
  expect(typeLabel('string/date', labels)).toBe('cadena/date');
  expect(typeLabel('string', { badges: {} })).toBe('string');
  expect(typeLabel(undefined, labels)).toBe('');
});
