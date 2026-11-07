import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// A pinned legend must follow its figure directly: the frame styles join
// `.pinned-shot + .pinned-legend`, and pin-legend-link.js finds the legend as
// the figure's next sibling. A close-up's maxWidth wrapper therefore closes
// AFTER the legend, never between the shot and its legend.
const ROOT = path.resolve(__dirname, '../../../versioned_docs/version-2.x');

function mdxFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return mdxFiles(full);
    return entry.name.endsWith('.mdx') ? [full] : [];
  });
}

function legendsOutsideTheirWrapper(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const previousContent = (from) => {
    let i = from;
    while (i >= 0 && lines[i].trim() === '') i -= 1;
    return i;
  };
  const bad = [];
  lines.forEach((line, index) => {
    if (!line.includes('className="pinned-legend"')) return;
    const close = previousContent(index - 1);
    if (close < 0 || lines[close].trim() !== '</div>') return;
    const shot = previousContent(close - 1);
    if (shot >= 0 && /^\s*<(JourneyShot|PinnedShot)\b/.test(lines[shot])) {
      bad.push(`${path.relative(ROOT, file)}:${index + 1}`);
    }
  });
  return bad;
}

describe('pinned legends in 2.x', () => {
  it('follow their figure inside the same wrapper', () => {
    const offenders = mdxFiles(ROOT).flatMap(legendsOutsideTheirWrapper);
    expect(offenders).toEqual([]);
  });
});
