function markdownFence(line) {
  const match = /^\s*(`{3,}|~{3,})/.exec(line);
  if (!match) return null;
  const marker = match[1];
  return { char: marker[0], length: marker.length };
}

function lineIsFenceOrInsideFence(line, state) {
  const fence = markdownFence(line);
  if (!fence) return state.fence !== null;
  if (!state.fence) {
    state.fence = fence;
  } else if (fence.char === state.fence.char && fence.length >= state.fence.length) {
    state.fence = null;
  }
  return true;
}

// Mirror the slug Docusaurus derives for a heading (github-slugger). Validated
// against every `{#anchor}` written by `docusaurus write-heading-ids` across the
// v1.x + v0.4.x docs (1483/1484 pairs; the lone miss is dedup numbering, which
// the caller handles): render markdown links to their visible text, lowercase,
// drop everything except letters/digits/space/underscore/hyphen (so apostrophes
// and other punctuation vanish *without* leaving a hyphen), then spaces → "-".
// No separator collapsing or trimming — github-slugger does neither, e.g.
// "Search & Filters" → "search--filters".
function docusaurusSlug(text) {
  return text
    .replace(/!?\[([^\]]*)\]\((?:\\.|[^()\\]|\([^()]*\))*\)/g, '$1')
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .replace(/ /g, '-');
}

function headingLines(source) {
  const fenceState = { fence: null };
  const headings = [];
  for (const line of source.split(/\r?\n/)) {
    if (lineIsFenceOrInsideFence(line, fenceState) || !/^\s*#{1,6}\s+\S/.test(line)) continue;
    const match = /^(?<prefix>\s*(?<hashes>#{1,6})\s+)(?<text>.*?)(?:\s+(?<anchor>\{#[^}\n]+\}))?\s*$/.exec(line);
    headings.push({
      level: match?.groups?.hashes?.length ?? 0,
      text: match?.groups?.text ?? '',
      anchor: match?.groups?.anchor,
    });
  }
  return headings;
}

function extractAnchorSlug(anchor) {
  if (!anchor) return undefined;
  const match = /^\{#([^}\n]+)\}$/.exec(anchor.trim());
  return match?.[1];
}

// The letters/digits of a slug, ignoring separators. Two slugs derived from the
// same heading text under different slug policies (e.g. a historical Docusaurus
// hyphenation) share the same letters; a slug left behind by a heading rename
// does not.
function slugLetters(slug) {
  return slug.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
}

function anchorByPositionKey(headings) {
  const map = new Map();
  const levelCounts = {};
  for (const heading of headings) {
    levelCounts[heading.level] = (levelCounts[heading.level] ?? 0) + 1;
    const key = `${heading.level}-${levelCounts[heading.level]}`;
    const explicitSlug = extractAnchorSlug(heading.anchor);
    const sourceDerivedSlug = explicitSlug ?? docusaurusSlug(heading.text);
    map.set(key, { anchor: heading.anchor, sourceDerivedSlug });
  }
  return map;
}

function applyStableHeadingAnchorsFromSource(source, translated, existingTarget) {
  const sourceHeadings = headingLines(source);
  const existingHeadings = existingTarget ? headingLines(existingTarget) : [];
  const sourceByKey = anchorByPositionKey(sourceHeadings);
  const existingByKey = anchorByPositionKey(existingHeadings);

  // Set of all valid source-derived slugs across the whole file. An existing
  // anchor whose slug appears here but is keyed to a different position is a
  // borrowed-from-elsewhere anchor (the wcpos/docs PR #190 failure mode) and
  // must be rejected in favour of the position-correct source slug.
  const sourceSlugSet = new Set();
  for (const { sourceDerivedSlug } of sourceByKey.values()) {
    sourceSlugSet.add(sourceDerivedSlug);
  }

  const translatedLevelCounts = {};
  const usedAnchors = new Set();
  const fenceState = { fence: null };

  return translated
    .split(/(\r?\n)/)
    .map((part) => {
      if (/^\r?\n$/.test(part) || lineIsFenceOrInsideFence(part, fenceState) || !/^\s*#{1,6}\s+\S/.test(part)) return part;
      const headingMatch = /^(?<prefix>\s*(?<hashes>#{1,6})\s+)(?<text>.*?)(?:\s+(?<existingAnchor>\{#[^}\n]+\}))?\s*$/.exec(part);
      if (!headingMatch) return part;
      const level = headingMatch.groups?.hashes?.length ?? 0;
      const text = headingMatch.groups?.text ?? '';
      const inlineAnchor = headingMatch.groups?.existingAnchor;

      translatedLevelCounts[level] = (translatedLevelCounts[level] ?? 0) + 1;
      const key = `${level}-${translatedLevelCounts[level]}`;
      const positionalSource = sourceByKey.get(key);
      if (!positionalSource) {
        // No matching source heading at this structural position. Leave any
        // inline anchor alone if it doesn't collide; otherwise strip it.
        if (inlineAnchor && !usedAnchors.has(inlineAnchor)) {
          usedAnchors.add(inlineAnchor);
          return part;
        }
        if (inlineAnchor) {
          const prefix = headingMatch.groups?.prefix ?? '';
          return `${prefix}${text}`;
        }
        return part;
      }

      const sourceDerivedAnchor = `{#${positionalSource.sourceDerivedSlug}}`;
      const candidateFromExisting = existingByKey.get(key)?.anchor;
      const candidateFromInline = inlineAnchor;

      // Prefer an explicit anchor only when it is a plausibly-intentional
      // override: not borrowed from another source heading's slug and not
      // already used in this file.
      const isLegitOverride = (candidate) => {
        if (!candidate) return false;
        if (usedAnchors.has(candidate)) return false;
        const slug = extractAnchorSlug(candidate);
        if (!slug || slug === '') return false;
        // If the slug matches another source heading's slug (not this one),
        // it's a misassigned anchor from a prior buggy run — reject.
        if (sourceSlugSet.has(slug) && slug !== positionalSource.sourceDerivedSlug) return false;
        // Reject an anchor whose letters differ from this heading's current
        // source-derived slug. Slug-policy variants of the same heading text are
        // still preserved (their letters match), but an anchor orphaned by a
        // source heading rename is dropped — e.g. wcpos/docs #215 left
        // {#template-types} behind after "Template types" became "Template
        // engines", so it no longer maps to any current heading.
        if (slugLetters(slug) !== slugLetters(positionalSource.sourceDerivedSlug)) return false;
        return true;
      };

      let chosenAnchor;
      if (candidateFromInline && isLegitOverride(candidateFromInline)) {
        chosenAnchor = candidateFromInline;
      } else if (isLegitOverride(candidateFromExisting)) {
        chosenAnchor = candidateFromExisting;
      } else {
        chosenAnchor = sourceDerivedAnchor;
      }

      if (chosenAnchor === '{#}') return part;

      // If the chosen anchor would still duplicate (e.g. source-derived collides
      // because the source itself has duplicate slugs), suffix it.
      if (usedAnchors.has(chosenAnchor)) {
        const baseSlug = extractAnchorSlug(chosenAnchor) ?? positionalSource.sourceDerivedSlug;
        let suffix = 2;
        while (usedAnchors.has(`{#${baseSlug}-${suffix}}`)) suffix += 1;
        chosenAnchor = `{#${baseSlug}-${suffix}}`;
      }
      usedAnchors.add(chosenAnchor);

      const prefix = headingMatch.groups?.prefix ?? '';
      return `${prefix}${text} ${chosenAnchor}`;
    })
    .join('');
}

function headingAnchors(source) {
  return headingLines(source)
    .map((heading) => heading.anchor)
    .filter((anchor) => !!anchor);
}

function headingAnchorsInvalidatedBySourceRenames(source, existingTarget) {
  const sourceByKey = anchorByPositionKey(headingLines(source));
  const existingByKey = anchorByPositionKey(headingLines(existingTarget));
  const sourceSlugSet = new Set();
  for (const { sourceDerivedSlug } of sourceByKey.values()) {
    sourceSlugSet.add(sourceDerivedSlug);
  }

  const invalidated = new Set();
  for (const [key, existingHeading] of existingByKey) {
    const positionalSource = sourceByKey.get(key);
    if (!positionalSource || !existingHeading.anchor) continue;
    const slug = extractAnchorSlug(existingHeading.anchor);
    if (!slug || slug === '') continue;
    if (sourceSlugSet.has(slug) && slug !== positionalSource.sourceDerivedSlug) continue;
    if (slugLetters(slug) !== slugLetters(positionalSource.sourceDerivedSlug)) {
      invalidated.add(existingHeading.anchor);
    }
  }
  return invalidated;
}

function missingPreservedHeadingAnchors(source, output, existingTarget) {
  const invalidatedAnchors = headingAnchorsInvalidatedBySourceRenames(source, existingTarget);
  return headingAnchors(existingTarget).filter((anchor) => !invalidatedAnchors.has(anchor) && !output.includes(anchor));
}

function restoreNonBreadcrumbInlineCodeSpans(source, translated) {
  const inlineCodePattern = /(`+)([^\n]*?)\1/g;
  const sourceSpans = source.match(inlineCodePattern) ?? [];
  const translatedSpans = translated.match(inlineCodePattern) ?? [];
  if (sourceSpans.length === 0 || sourceSpans.length !== translatedSpans.length) return translated;

  let index = 0;
  return translated.replace(inlineCodePattern, (span) => {
    const sourceSpan = sourceSpans[index++] ?? span;
    const sourceContent = /^(`+)([^\n]*?)\1$/.exec(sourceSpan)?.[2] ?? sourceSpan;
    return /\S\s*>\s*\S/.test(sourceContent) ? span : sourceSpan;
  });
}

module.exports = { docusaurusSlug, applyStableHeadingAnchorsFromSource, missingPreservedHeadingAnchors, restoreNonBreadcrumbInlineCodeSpans };
