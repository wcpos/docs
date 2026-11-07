#!/usr/bin/env node

// Moves each JourneyShot's legend inside the component, and turns a close-up's
// maxWidth wrapper into the component's maxWidth prop:
//
//   <div style={{ maxWidth: 324 }}>        <JourneyShot … maxWidth={324} alt="…">
//   <JourneyShot … alt="…" />
//   <div className="pinned-legend">   →    1. **See what Pro adds** — …
//   1. **See what Pro adds** — …
//   </div>                                 </JourneyShot>
//   </div>
//
// A wrapper with any other style key (flex, a caption) is left alone. Safe to
// run twice. Usage: node scripts/journey-shot-legend-codemod.js [dir]

const fs = require('fs');
const path = require('path');

const SHOT = /^\s*<JourneyShot\b/;
const LEGEND = '<div className="pinned-legend">';
const WRAPPER = /^\s*<div style=\{\{\s*(.*?)\s*\}\}>\s*$/;

const isBlank = (line) => line.trim() === '';

// The width a wrapper caps its shot at, or null when it does anything else.
function wrapperWidth(line) {
  const match = WRAPPER.exec(line);
  if (!match) return null;
  let width = null;
  for (const pair of match[1].split(',').map((p) => p.trim()).filter(Boolean)) {
    const [key, value] = pair.split(':').map((p) => p.trim());
    const px = /^(?:(\d+)|(['"])(\d+)px\2)$/.exec(value || '');
    if (key === 'maxWidth' && px) width = Number(px[1] || px[3]);
    else if (!(key === 'marginInline' && /^(['"])auto\1$/.test(value))) return null;
  }
  return width;
}

// Lines inside ``` or ~~~ fences, which the codemod never touches.
function fencedLines(lines) {
  let fence = null;
  return lines.map((line) => {
    const marker = /^\s*(```|~~~)/.exec(line);
    if (marker && (!fence || marker[1] === fence)) {
      fence = fence ? null : marker[1];
      return true;
    }
    return fence !== null;
  });
}

const nextContent = (lines, from) => {
  let i = from;
  while (i < lines.length && isBlank(lines[i])) i += 1;
  return i;
};
const previousContent = (lines, from) => {
  let i = from;
  while (i >= 0 && isBlank(lines[i])) i -= 1;
  return i;
};

// Removes one line, then one blank if that leaves two blanks together or a
// blank first line.
function removeLine(lines, index) {
  lines.splice(index, 1);
  const blankBefore = index === 0 || isBlank(lines[index - 1]);
  if (blankBefore && index < lines.length && isBlank(lines[index])) {
    lines.splice(index, 1);
  }
}

// Applies the first change it finds; returns false when there is none.
function step(lines) {
  const fenced = fencedLines(lines);
  for (let start = 0; start < lines.length; start += 1) {
    if (fenced[start] || !SHOT.test(lines[start])) continue;
    const selfClosing = /\/>\s*$/.test(lines[start]);
    let end = start;
    if (!selfClosing) {
      while (end < lines.length && lines[end].trim() !== '</JourneyShot>') end += 1;
      if (end === lines.length) continue;
    }

    const open = nextContent(lines, start + 1);
    if (selfClosing && lines[open]?.trim() === LEGEND) {
      let close = open + 1;
      while (close < lines.length && lines[close].trim() !== '</div>') close += 1;
      if (close === lines.length) continue;
      const first = nextContent(lines, open + 1);
      const last = previousContent(lines, close - 1);
      const tag = lines[start].trim().replace(/\s*\/>$/, '>');
      const list = first <= last ? lines.slice(first, last + 1) : [];
      lines.splice(start, close - start + 1, tag, '', ...list, '', '</JourneyShot>');
      return true;
    }

    const before = previousContent(lines, start - 1);
    const after = nextContent(lines, end + 1);
    const width = before >= 0 ? wrapperWidth(lines[before]) : null;
    if (width && lines[after]?.trim() === '</div>' && !/\bmaxWidth=/.test(lines[start])) {
      const tag = lines[start].trim();
      lines[start] = tag.includes(' alt=')
        ? tag.replace(' alt=', ` maxWidth={${width}} alt=`)
        : tag.replace(/\s*(\/?)>$/, (_, slash) => ` maxWidth={${width}}${slash ? ' />' : '>'}`);
      removeLine(lines, after);
      removeLine(lines, before);
      return true;
    }
  }
  return false;
}

function transform(source) {
  const lines = source.split('\n');
  while (step(lines));
  return lines.join('\n');
}

function mdxFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return mdxFiles(full);
    return entry.name.endsWith('.mdx') ? [full] : [];
  });
}

if (require.main === module) {
  const dir = path.resolve(process.argv[2] || 'versioned_docs/version-2.x');
  for (const file of mdxFiles(dir)) {
    const source = fs.readFileSync(file, 'utf8');
    const result = transform(source);
    if (result !== source) {
      fs.writeFileSync(file, result);
      console.log(path.relative(process.cwd(), file));
    }
  }
}

module.exports = { transform, wrapperWidth };
