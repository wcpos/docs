import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// A shot's legend is JourneyShot's markdown children: the opening tag on one
// line, then the numbered list, then </JourneyShot>. A shot with no legend is
// self-closing. A `.pinned-legend` div after a shot is the old sibling shape;
// one under a diagram (its numbered key) is fine.
const ROOT = path.resolve(__dirname, '../../../versioned_docs/version-2.x');

function mdxFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return mdxFiles(full);
    return entry.name.endsWith('.mdx') ? [full] : [];
  });
}

function offenders(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const at = (index) => `${path.relative(ROOT, file)}:${index + 1}`;
  const bad = [];
  lines.forEach((line, index) => {
    if (line.includes('className="pinned-legend"')) {
      let prev = index - 1;
      while (prev >= 0 && ['', '</div>'].includes(lines[prev].trim()))
        prev -= 1;
      if (/^\s*<JourneyShot\b/.test(lines[prev] || '')) bad.push(at(index));
    }
    if (!/^\s*<JourneyShot\b/.test(line) || /\/>\s*$/.test(line)) return;
    let next = index + 1;
    while (next < lines.length && lines[next].trim() === '') next += 1;
    const list = /^\s*\d+\.\s/.test(lines[next] || '');
    const close = lines.findIndex(
      (l, i) => i > next && l.trim() === '</JourneyShot>'
    );
    if (!list || close === -1) bad.push(at(index));
  });
  return bad;
}

describe('JourneyShot legends in 2.x', () => {
  it('are the component children, never a sibling .pinned-legend div', () => {
    expect(mdxFiles(ROOT).flatMap(offenders)).toEqual([]);
  });
});
