const { createHash } = require('node:crypto');

const TRANSLATABLE_FRONTMATTER_KEYS = new Set(['title', 'sidebar_label', 'description']);
const TRANSLATABLE_JSX_ATTRS = new Set(['alt', 'title', 'description', 'label', 'question']);

function hashSource(source) {
  return createHash('sha256').update(source).digest('hex');
}

function buildDocsUnitId(input) {
  return JSON.stringify([input.filePath, input.type, input.key ?? '', input.attr ?? '', hashSource(input.source)]);
}

function stripWrappingQuotes(value) {
  const trimmedStart = value.length - value.trimStart().length;
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const quote = trimmed[0];
    if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
      return { source: trimmed.slice(1, -1), offset: trimmedStart + 1, quote };
    }
  }
  return { source: trimmed, offset: trimmedStart };
}

function isImportLine(line) {
  return /^\s*import\s/.test(line);
}

function isImportDeclarationComplete(line) {
  const trimmed = line.trim();
  return (
    trimmed.endsWith(';') ||
    /^import\s+[\s\S]+\s+from\s+["'][^"']+["']$/.test(trimmed) ||
    /^import\s+["'][^"']+["']$/.test(trimmed) ||
    /^\}\s+from\s+["'][^"']+["']$/.test(trimmed)
  );
}

function isHeadingLine(line) {
  return /^\s*#{1,6}\s+\S/.test(line);
}

function isJsxOnlyLine(line) {
  return /^\s*<[A-Z][\s\S]*>\s*$/.test(line);
}

function isJsxOpeningLine(line) {
  return /^\s*<[A-Za-z][A-Za-z0-9.:-]*(?:\s|>|\/>|$)/.test(line);
}

function isJsxClosingOnlyLine(line) {
  return /^\s*(?:\/>|<\/[A-Za-z][A-Za-z0-9.:-]*>)\s*$/.test(line);
}

function lineTerminatesJsxBlock(line) {
  return /(?:\/>|>)\s*$/.test(line);
}

function isBlank(line) {
  return /^\s*$/.test(line);
}

function parseHeadingTextRange(line) {
  const match = /^(?<prefix>\s*#{1,6}\s+)(?<text>.*?)(?<anchor>\s+\{#[^}\n]+\})?\s*$/.exec(line);
  const prefix = match?.groups?.prefix;
  const text = match?.groups?.text;
  if (prefix === undefined || text === undefined) {
    return undefined;
  }
  const start = prefix.length;
  return {
    source: text,
    start,
    end: start + text.length,
  };
}

function markdownControlPrefixEnd(line) {
  let cursor = 0;
  const leadingWhitespace = /^\s*/.exec(line)?.[0].length ?? 0;
  cursor = leadingWhitespace;

  while (line.startsWith('>', cursor)) {
    cursor += 1;
    if (line[cursor] === ' ') {
      cursor += 1;
    }
  }

  const markerMatch = /^(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/.exec(line.slice(cursor));
  if (markerMatch) {
    cursor += markerMatch[0].length;
  }

  return cursor;
}

function trimTextRange(line, start, end) {
  let trimmedStart = start;
  let trimmedEnd = end;
  while (trimmedStart < trimmedEnd && /\s/.test(line[trimmedStart] ?? '')) {
    trimmedStart += 1;
  }
  while (trimmedEnd > trimmedStart && /\s/.test(line[trimmedEnd - 1] ?? '')) {
    trimmedEnd -= 1;
  }
  if (trimmedStart >= trimmedEnd) {
    return undefined;
  }
  return {
    source: line.slice(trimmedStart, trimmedEnd),
    start: trimmedStart,
    end: trimmedEnd,
  };
}

function inlineCodeRanges(line) {
  const ranges = [];
  let cursor = 0;
  while (cursor < line.length) {
    if (line[cursor] !== '`') {
      cursor += 1;
      continue;
    }

    const start = cursor;
    while (cursor < line.length && line[cursor] === '`') {
      cursor += 1;
    }
    const delimiter = line.slice(start, cursor);
    const endStart = line.indexOf(delimiter, cursor);
    if (endStart === -1) {
      continue;
    }
    ranges.push({ start, end: endStart + delimiter.length });
    cursor = endStart + delimiter.length;
  }
  return ranges;
}

function rangesOverlap(left, right) {
  return left.start < right.end && right.start < left.end;
}

function overlapsAnyRange(range, ranges) {
  return ranges.some((candidate) => rangesOverlap(range, candidate));
}

function inlineTagRanges(line) {
  const ranges = [];
  let cursor = 0;
  while (cursor < line.length) {
    const start = line.indexOf('<', cursor);
    if (start === -1) {
      break;
    }
    const tagNameStart = line[start + 1] === '/' ? start + 2 : start + 1;
    if (!/[A-Za-z]/.test(line[tagNameStart] ?? '')) {
      cursor = start + 1;
      continue;
    }

    let quote;
    let braceDepth = 0;
    let index = tagNameStart + 1;
    while (index < line.length) {
      const char = line[index];
      if (quote !== undefined) {
        if (char === quote && line[index - 1] !== '\\') {
          quote = undefined;
        }
        index += 1;
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        index += 1;
        continue;
      }
      if (char === '{') {
        braceDepth += 1;
      } else if (char === '}') {
        braceDepth = Math.max(0, braceDepth - 1);
      } else if (char === '>' && braceDepth === 0) {
        ranges.push({ start, end: index + 1 });
        cursor = index + 1;
        break;
      }
      index += 1;
    }
    if (index >= line.length) {
      cursor = start + 1;
    }
  }
  return ranges;
}

function markdownTextMatches(line, image) {
  const matches = [];
  let cursor = 0;
  while (cursor < line.length) {
    const start = image ? line.indexOf('![', cursor) : line.indexOf('[', cursor);
    if (start === -1) {
      break;
    }
    if (!image && line[start - 1] === '!') {
      cursor = start + 1;
      continue;
    }

    const textStart = start + (image ? 2 : 1);
    const textEnd = line.indexOf(']', textStart);
    if (textEnd === -1 || line[textEnd + 1] !== '(') {
      cursor = start + 1;
      continue;
    }

    let depth = 1;
    let index = textEnd + 2;
    while (index < line.length) {
      const char = line[index];
      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          matches.push({
            start,
            end: index + 1,
            text: line.slice(textStart, textEnd),
            textStart,
            textEnd,
          });
          cursor = index + 1;
          break;
        }
      }
      index += 1;
    }
    if (depth !== 0) {
      cursor = start + 1;
    }
  }
  return matches;
}

function markdownLinkMatches(line) {
  return markdownTextMatches(line, false);
}

function markdownImageMatches(line) {
  return markdownTextMatches(line, true);
}

// Parse an optional CommonMark link/image title out of a destination span
// `(url "title")`. Docusaurus renders the title as a user-facing tooltip, so it
// must be translated rather than shipped as English source. Returns the title's
// inner-text range (excluding the surrounding quotes), relative to `line`. Only
// the `"…"` / `'…'` title forms used in the docs corpus are recognised.
function markdownTitleMatch(line, destStart, destEnd) {
  const destination = line.slice(destStart, destEnd);
  const match = /(?<pre>\s+(?<quote>["']))(?<title>(?:\\.|(?!\k<quote>).)*)\k<quote>\s*$/.exec(destination);
  if (match === null || match.groups === undefined) {
    return undefined;
  }
  const { pre, title, quote } = match.groups;
  if (pre === undefined || title === undefined || quote === undefined) {
    return undefined;
  }
  const innerStart = destStart + match.index + pre.length;
  return { source: title, start: innerStart, end: innerStart + title.length, quote };
}

function escapeYamlDoubleQuotedScalar(value) {
  return JSON.stringify(value);
}

function escapeYamlSingleQuotedScalarContent(value) {
  return value.replaceAll("'", "''");
}

function isSafePlainYamlScalar(value) {
  if (value.trim() !== value || value === '' || /[\r\n]/.test(value)) return false;
  if (/^(?:true|false|null|~|y|yes|n|no|on|off)$/i.test(value)) return false;
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) return false;
  if (/^[+-]?\.(?:inf|nan)$/i.test(value)) return false;
  if (/[:]\s|[\s]#/.test(value)) return false;
  if (/[\"{}[\]&*!|>%@`]/.test(value)) return false;
  return !/^[\s!&*#[\]{}>|'\"%@`,?:-]/.test(value);
}

function formatFrontmatterTranslation(parsed, unit, translation) {
  const before = parsed.source[unit.range.start - 1];
  const after = parsed.source[unit.range.end];
  if (before === '"' && after === '"') {
    return escapeYamlDoubleQuotedScalar(translation).slice(1, -1);
  }
  if (before === "'" && after === "'") {
    return escapeYamlSingleQuotedScalarContent(translation);
  }
  if (isSafePlainYamlScalar(translation)) {
    return translation;
  }
  return escapeYamlDoubleQuotedScalar(translation);
}

function escapeQuotedAttribute(value, quote) {
  if (quote === '"') {
    return value.replaceAll('"', '&quot;');
  }
  return value.replaceAll("'", '&#39;');
}

// A CommonMark link/image title delimiter inside the title must be
// backslash-escaped; mirror that so a translated tooltip stays valid markdown.
function escapeMarkdownTitle(value, quote) {
  return value.replaceAll(quote, `\\${quote}`);
}

function escapeJsStringLiteral(value, quote) {
  return value.replaceAll('\\', '\\\\').replaceAll(quote, `\\${quote}`);
}

function isSafeTranslatableJsxString(value) {
  if (value.trim() === '' || /[\r\n]/.test(value)) return false;
  if (/\[[^\]\n]+\]\([^)]+\)/.test(value) || /!\[[^\]\n]*\]\([^)]+\)/.test(value)) return false;
  if (/[<>{}]/.test(value)) return false;
  return /[A-Za-z\p{L}]/u.test(value);
}

function jsxTextChildMatches(line) {
  const matches = [];
  const pattern = /<(?<tag>[A-Z][A-Za-z0-9.]*)\b(?<attrs>[^<>]*)>(?<text>[^<>{}\n]+)<\/\k<tag>>/g;
  for (const match of line.matchAll(pattern)) {
    const text = match.groups?.text;
    if (text === undefined || !isSafeTranslatableJsxString(text)) continue;
    const tag = match.groups?.tag ?? '';
    const attrs = match.groups?.attrs ?? '';
    const start = (match.index ?? 0) + 1 + tag.length + attrs.length + 1;
    matches.push({ start, end: start + text.length, text });
  }
  return matches;
}

function isMarkdownTableSeparatorLine(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseDocsMdxUnits(filePath, source) {
  const units = [];
  const typeIndexes = {
    frontmatter: 0,
    heading: 0,
    paragraph: 0,
    link_text: 0,
    link_title: 0,
    jsx_attr: 0,
  };

  const addUnit = (input) => {
    if (input.source.trim() === '') {
      return;
    }
    const index = typeIndexes[input.type]++;
    units.push({
      id: buildDocsUnitId({
        filePath,
        type: input.type,
        source: input.source,
        key: input.key,
        attr: input.attr,
      }),
      type: input.type,
      source: input.source,
      sourceHash: hashSource(input.source),
      filePath,
      index,
      key: input.key,
      attr: input.attr,
      attrSyntax: input.attrSyntax,
      attrQuote: input.attrQuote,
      range: {
        start: input.start,
        end: input.end,
      },
    });
  };

  let bodyStart = 0;
  if (source.startsWith('---\n')) {
    const frontmatterEnd = source.indexOf('\n---', 4);
    if (frontmatterEnd !== -1) {
      const frontmatterContentStart = 4;
      const frontmatterContent = source.slice(frontmatterContentStart, frontmatterEnd);
      const frontmatterLinePattern = /^(?<key>[A-Za-z0-9_-]+):(?<value>.*)$/gm;
      for (const match of frontmatterContent.matchAll(frontmatterLinePattern)) {
        const key = match.groups?.key;
        const rawValue = match.groups?.value ?? '';
        if (key === undefined || !TRANSLATABLE_FRONTMATTER_KEYS.has(key)) {
          continue;
        }
        const lineStart = frontmatterContentStart + (match.index ?? 0);
        const valueStart = lineStart + key.length + 1;
        const { source: unitSource, offset } = stripWrappingQuotes(rawValue);
        addUnit({
          type: 'frontmatter',
          source: unitSource,
          start: valueStart + offset,
          end: valueStart + offset + unitSource.length,
          key,
        });
      }
      const closingLength = source.startsWith('\n---\n', frontmatterEnd) ? 5 : 4;
      bodyStart = frontmatterEnd + closingLength;
    }
  }

  let inFence = false;
  let fenceMarker;
  let inImportBlock = false;
  let inJsxBlock = false;
  const linePattern = /.*(?:\n|$)/g;
  for (const match of source.slice(bodyStart).matchAll(linePattern)) {
    const rawLine = match[0];
    if (rawLine === '') {
      continue;
    }
    const lineStart = bodyStart + (match.index ?? 0);
    const lineNoNewline = rawLine.endsWith('\n') ? rawLine.slice(0, -1) : rawLine;
    const trimmedLine = lineNoNewline.trim();

    const fenceMatch = /^(?<fence>`{3,}|~{3,})/.exec(trimmedLine);
    if (fenceMatch?.groups?.fence && (!inFence || fenceMatch.groups.fence[0] === fenceMarker)) {
      inFence = !inFence;
      fenceMarker = inFence ? fenceMatch.groups.fence[0] : undefined;
      continue;
    }
    if (inFence) {
      continue;
    }
    if (inImportBlock) {
      if (isImportDeclarationComplete(lineNoNewline)) {
        inImportBlock = false;
      }
      continue;
    }
    if (isImportLine(lineNoNewline)) {
      inImportBlock = !isImportDeclarationComplete(lineNoNewline);
      continue;
    }
    if (isBlank(lineNoNewline)) {
      continue;
    }
    if (isMarkdownTableSeparatorLine(lineNoNewline)) {
      continue;
    }

    if (isHeadingLine(lineNoNewline)) {
      const heading = parseHeadingTextRange(lineNoNewline);
      if (heading !== undefined) {
        addUnit({
          type: 'heading',
          source: heading.source,
          start: lineStart + heading.start,
          end: lineStart + heading.end,
        });
      }
      continue;
    }

    const codeRanges = inlineCodeRanges(lineNoNewline);
    const tagRanges = inlineTagRanges(lineNoNewline);
    const protectedInlineRanges = [...codeRanges, ...tagRanges];
    const linkMatches = markdownLinkMatches(lineNoNewline).filter((linkMatch) => !overlapsAnyRange(linkMatch, protectedInlineRanges));
    const imageMatches = markdownImageMatches(lineNoNewline).filter((imageMatch) => !overlapsAnyRange(imageMatch, protectedInlineRanges));
    const markdownTextMatches = [...linkMatches, ...imageMatches].sort((a, b) => a.start - b.start || a.end - b.end);
    const hasMarkdownTitle = markdownTextMatches.some((linkMatch) => markdownTitleMatch(lineNoNewline, linkMatch.textEnd + 2, linkMatch.end - 1) !== undefined);

    if ((linkMatches.length > 0 || codeRanges.length > 0) && imageMatches.length === 0 && tagRanges.length === 0 && !hasMarkdownTitle) {
      const textChunk = trimTextRange(lineNoNewline, markdownControlPrefixEnd(lineNoNewline), lineNoNewline.length);
      if (textChunk !== undefined) {
        addUnit({
          type: 'paragraph',
          source: textChunk.source,
          start: lineStart + textChunk.start,
          end: lineStart + textChunk.end,
        });
      }
      continue;
    }

    for (const linkMatch of markdownTextMatches) {
      addUnit({
        type: 'link_text',
        source: linkMatch.text,
        start: lineStart + linkMatch.textStart,
        end: lineStart + linkMatch.textEnd,
      });
      // The destination `(url "title")` can carry a user-facing title tooltip.
      // It spans from just after the `](` to the closing `)` at linkMatch.end.
      const title = markdownTitleMatch(lineNoNewline, linkMatch.textEnd + 2, linkMatch.end - 1);
      if (title !== undefined) {
        addUnit({
          type: 'link_title',
          source: title.source,
          start: lineStart + title.start,
          end: lineStart + title.end,
          attrQuote: title.quote,
        });
      }
    }

    for (const attrMatch of lineNoNewline.matchAll(
      /(?<prefix>^|\s)(?<attr>alt|title|description|label|question)=(?:(?<quote>["'])(?<value>.*?)\k<quote>|\{(?<bracedQuote>["'])(?<bracedValue>.*?)\k<bracedQuote>\})/g,
    )) {
      const attr = attrMatch.groups?.attr;
      const prefix = attrMatch.groups?.prefix ?? '';
      const value = attrMatch.groups?.value ?? attrMatch.groups?.bracedValue;
      const attrSyntax = attrMatch.groups?.bracedValue === undefined ? 'quoted' : 'braced';
      const attrQuote = attrMatch.groups?.quote ?? attrMatch.groups?.bracedQuote;
      if (attr === undefined || value === undefined || !TRANSLATABLE_JSX_ATTRS.has(attr) || !isSafeTranslatableJsxString(value)) {
        continue;
      }
      const attrStart = (attrMatch.index ?? 0) + prefix.length;
      if (overlapsAnyRange({ start: attrStart, end: attrStart + attrMatch[0].length - prefix.length }, codeRanges)) {
        continue;
      }
      const valueOffset = attrMatch.groups?.bracedValue === undefined ? attr.length + 2 : attr.length + 3;
      const start = lineStart + attrStart + valueOffset;
      addUnit({
        type: 'jsx_attr',
        source: value,
        start,
        end: start + value.length,
        attr,
        attrSyntax,
        attrQuote,
      });
    }

    const jsxChildRanges = [];
    for (const textMatch of jsxTextChildMatches(lineNoNewline)) {
      if (overlapsAnyRange(textMatch, codeRanges)) {
        continue;
      }
      jsxChildRanges.push({ start: textMatch.start, end: textMatch.end });
      addUnit({
        type: 'paragraph',
        source: textMatch.text,
        start: lineStart + textMatch.start,
        end: lineStart + textMatch.end,
      });
    }

    const protectedRanges = [...markdownTextMatches, ...codeRanges, ...tagRanges, ...jsxChildRanges].sort((a, b) => a.start - b.start || a.end - b.end);
    const textStart = markdownControlPrefixEnd(lineNoNewline);
    const proseChunks = [];
    let cursor = textStart;
    for (const range of protectedRanges) {
      const chunk = trimTextRange(lineNoNewline, cursor, range.start);
      if (chunk !== undefined) {
        proseChunks.push(chunk);
      }
      cursor = Math.max(cursor, range.end);
    }
    const tailChunk = trimTextRange(lineNoNewline, cursor, lineNoNewline.length);
    if (tailChunk !== undefined) {
      proseChunks.push(tailChunk);
    }

    const startsJsxBlock = isJsxOpeningLine(lineNoNewline);
    const isJsxStructuralLine = inJsxBlock || startsJsxBlock || isJsxOnlyLine(lineNoNewline) || isJsxClosingOnlyLine(lineNoNewline);
    if (isJsxStructuralLine) {
      // `inJsxBlock` is only true while inside an unclosed multi-line opening tag
      // (any line ending in `>` clears it), where leftover text is attribute
      // values, not prose — so never extract there.
      const insideUnclosedTag = inJsxBlock;
      inJsxBlock = (inJsxBlock || startsJsxBlock) && !lineTerminatesJsxBlock(lineNoNewline);
      // A self-contained structural line can still carry human-readable prose
      // between its tags — e.g. `<li><strong>Web app</strong> — pick ...</li>`
      // or a `<p>...</p>`. Extract that prose so it is translated; pure
      // tag-structure lines yield no chunks and are skipped. Chunks containing
      // angle brackets are tag fragments; chunks containing braces are JSX
      // expression children. Neither is prose.
      if (!insideUnclosedTag) {
        const proseToTranslate = proseChunks.filter((chunk) => /\p{L}/u.test(chunk.source) && !/[<>{}]/.test(chunk.source));
        for (const chunk of proseToTranslate) {
          addUnit({
            type: 'paragraph',
            source: chunk.source,
            start: lineStart + chunk.start,
            end: lineStart + chunk.end,
          });
        }
      }
      continue;
    }

    for (const chunk of proseChunks) {
      addUnit({
        type: 'paragraph',
        source: chunk.source,
        start: lineStart + chunk.start,
        end: lineStart + chunk.end,
      });
    }
  }

  units.sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end);
  return { filePath, source, units };
}

function applyDocsMdxTranslations(parsed, translations) {
  const replacements = parsed.units
    .map((unit) => {
      const translation = translations.get(unit.id);
      if (translation === undefined) {
        return undefined;
      }
      return {
        start: unit.range.start,
        end: unit.range.end,
        value:
          unit.type === 'frontmatter'
            ? formatFrontmatterTranslation(parsed, unit, translation)
            : unit.type === 'link_title'
              ? escapeMarkdownTitle(translation, unit.attrQuote ?? parsed.source[unit.range.start - 1] ?? '"')
              : unit.type === 'jsx_attr' && unit.attrSyntax === 'braced'
                ? escapeJsStringLiteral(translation, unit.attrQuote ?? parsed.source[unit.range.start - 1] ?? '"')
                : unit.type === 'jsx_attr'
                  ? escapeQuotedAttribute(translation, unit.attrQuote ?? parsed.source[unit.range.start - 1] ?? '"')
                  : translation,
      };
    })
    .filter((replacement) => replacement !== undefined)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const nonOverlapping = [];
  let previousEnd = -1;
  for (const replacement of replacements) {
    if (replacement.start < previousEnd) {
      continue;
    }
    nonOverlapping.push(replacement);
    previousEnd = replacement.end;
  }

  let output = parsed.source;
  for (const replacement of nonOverlapping.reverse()) {
    output = output.slice(0, replacement.start) + replacement.value + output.slice(replacement.end);
  }
  return output;
}

module.exports = { parseDocsMdxUnits, applyDocsMdxTranslations };
