import { describe, it, expect } from 'vitest';
import { buildGraph } from '../buildGraph';
import { KIND } from '../kinds';

// Helper: fake a node element the way React ACTUALLY shapes it — `type` is the
// component FUNCTION carrying a static `wizardKind` (NOT a plain object). Using a
// function here is what catches the real-world bug where `typeof el.type` is
// 'function', not 'object'.
const node = (kind, props = {}, children = []) => {
  const Comp = () => null;
  Comp.wizardKind = kind;
  return { type: Comp, props: { ...props, children } };
};
const choice = (value, goTo, label = value) => node(KIND.CHOICE, { value, goTo, label });

describe('buildGraph', () => {
  it('registers navigable nodes by id and records the first as startId', () => {
    const children = [
      node(KIND.QUESTION, { id: 'platform' }, [choice('desktop', 'conn')]),
      node(KIND.STEP, { id: 'conn' }, []),
    ];
    const g = buildGraph(children);
    expect(g.startId).toBe('platform');
    expect(g.idList).toEqual(['platform', 'conn']);
    expect(g.kindById).toEqual({ platform: KIND.QUESTION, conn: KIND.STEP });
    expect(g.errors).toEqual([]);
  });

  it('detects nodes whose type is a FUNCTION component (real React element shape)', () => {
    // Regression: kindOf must read `wizardKind` off function-typed `el.type`.
    // The previous `typeof el.type === 'object'` check returned undefined for
    // every real element, so the live wizard registered zero nodes and rendered nothing.
    function Question() { return null; }
    Question.wizardKind = KIND.QUESTION;
    const realElement = { type: Question, props: { id: 'where', children: [] } };
    const g = buildGraph([realElement]);
    expect(g.startId).toBe('where');
    expect(g.kindById.where).toBe(KIND.QUESTION);
  });

  it('descends through opaque wrapper elements (themed <p>, fragments) to find nested nodes', () => {
    const children = [
      node(KIND.STEP, { id: 'step1' }, [
        { type: 'p', props: { children: 'some prose' } }, // opaque themed element
        node(KIND.GATE, { id: 'g1' }, [choice('yes', 'done'), choice('no', 'fix1')]),
      ]),
      node(KIND.FIX, { id: 'fix1' }, []),
      node(KIND.TERMINAL, { id: 'done', kind: 'success' }, []),
    ];
    const g = buildGraph(children);
    expect(g.kindById.fix1).toBe(KIND.FIX);
    expect(g.kindById.g1).toBe(KIND.GATE);
    // edges collected from every choice's goTo
    expect(g.edges).toEqual(
      expect.arrayContaining([
        { from: 'platform-or-unknown', to: 'done' },
      ].map(() => expect.objectContaining({ to: 'done' }))),
    );
  });

  it('flags duplicate navigable ids', () => {
    const children = [node(KIND.STEP, { id: 'dup' }), node(KIND.FIX, { id: 'dup' })];
    const g = buildGraph(children);
    expect(g.errors).toContainEqual({ type: 'duplicate-id', id: 'dup' });
  });

  it('flags a choice whose goTo points at a missing node', () => {
    const children = [
      node(KIND.QUESTION, { id: 'q' }, [choice('a', 'nowhere')]),
    ];
    const g = buildGraph(children);
    expect(g.errors).toContainEqual({ type: 'missing-target', from: 'q', to: 'nowhere' });
  });
});
