const { transform } = require('../journey-shot-legend-codemod');

const legend = (text) =>
  `<div className="pinned-legend">\n\n1. **${text}** — a.\n2. **Two** — b.\n\n</div>`;

describe('journey-shot-legend-codemod', () => {
  it('moves the legend inside and a maxWidth-only wrapper into the prop', () => {
    const source = `<div style={{ maxWidth: 324 }}>\n\n<JourneyShot step={6} alt="B" />\n\n${legend('One')}\n\n</div>\n\nAfter.`;
    expect(transform(source)).toBe(
      `<JourneyShot step={6} maxWidth={324} alt="B">\n\n1. **One** — a.\n2. **Two** — b.\n\n</JourneyShot>\n\nAfter.`
    );
  });

  it('keeps a wrapper that does more than cap the width', () => {
    const source = `<div style={{ display: 'flex', gap: '1rem' }}>\n<JourneyShot step={1} alt="F" />\n\n${legend('F')}\n</div>`;
    expect(transform(source)).toBe(
      `<div style={{ display: 'flex', gap: '1rem' }}>\n<JourneyShot step={1} alt="F">\n\n1. **F** — a.\n2. **Two** — b.\n\n</JourneyShot>\n</div>`
    );
  });

  it('turns the wrapper of a shot with no legend into the prop', () => {
    const source = `Before.\n\n<div style={{maxWidth: '390px', marginInline: 'auto'}}>\n  <JourneyShot step={2} alt="Bare" />\n</div>\n\nAfter.`;
    expect(transform(source)).toBe(
      `Before.\n\n<JourneyShot step={2} maxWidth={390} alt="Bare" />\n\nAfter.`
    );
  });

  it('joins a legend that sat after a wrapper closing early', () => {
    const source = `<div style={{ maxWidth: 569 }}>\n  <JourneyShot step={3} alt="E" />\n</div>\n\n${legend('E')}\n\nAfter.`;
    expect(transform(source)).toBe(
      `<JourneyShot step={3} maxWidth={569} alt="E">\n\n1. **E** — a.\n2. **Two** — b.\n\n</JourneyShot>\n\nAfter.`
    );
  });

  it('leaves code fences alone and is idempotent', () => {
    const fenced = '```mdx\n<JourneyShot step={9} alt="code" />\n\n' + legend('C') + '\n```';
    const source = `<div style={{ maxWidth: 512 }}>\n\n<JourneyShot step={4} alt="I" />\n\n${legend('I')}\n\n</div>\n\n${fenced}\n`;
    const once = transform(source);
    expect(once).toContain(fenced);
    expect(transform(once)).toBe(once);
  });
});
