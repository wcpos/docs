import { describe, it, expect } from 'vitest';
import { buildGraph } from '../buildGraph';
import { KIND } from '../kinds';

// Helper: fake a node element the way React would shape it.
const node = (kind, props = {}, children = []) => ({
  type: { wizardKind: kind },
  props: { ...props, children },
});
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
