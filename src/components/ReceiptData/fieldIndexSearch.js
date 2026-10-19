export function normalizeSearch(text) {
  return typeof text === 'string'
    ? text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
    : '';
}

export function typeLabel(type, labels) {
  return typeof type === 'string'
    ? type.split('/').map((part) => labels?.types?.[part] || part).join('/')
    : '';
}

export function fieldMatches(field, query, labels) {
  const q = normalizeSearch(query);
  const hay = [
    field?.name, field?.type, typeLabel(field?.type, labels), field?.desc,
    ...(Array.isArray(field?.badges) ? field.badges : []).flatMap((key) => [key, labels?.badges?.[key]]),
    ...(Array.isArray(field?.sample) ? field.sample : []).map((sample) => sample?.k),
  ].join(' ');
  return !q || normalizeSearch(hay).includes(q);
}

export function suggestTerms(fields, locale, count = 2) {
  if (!Array.isArray(fields) || count <= 0) return [];
  let segmenter;
  try {
    segmenter = new Intl.Segmenter(locale || 'en', { granularity: 'word' });
  } catch {
    return [];
  }
  const terms = [];
  for (const field of fields) {
    if (typeof field?.desc !== 'string') continue;
    const desc = field.desc.replace(/`[^`]*`/g, '').replace(/~/g, '');
    let longest = '';
    let longestLength = 0;
    for (const { segment, isWordLike } of segmenter.segment(desc)) {
      if (!isWordLike || !/^[\p{L}\p{M}]+$/u.test(segment)) continue;
      const length = [...segment].length;
      const minimum = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(segment) ? 2 : 5;
      if (length >= minimum && length > longestLength) {
        longest = segment.toLowerCase();
        longestLength = length;
      }
    }
    if (longest && !terms.includes(longest)) terms.push(longest);
    if (terms.length >= count) break;
  }
  return terms;
}
