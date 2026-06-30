import { describe, it, expect } from 'vitest';
import { makeReducer, initialState } from '../reducer';
import { KIND } from '../kinds';

const config = {
  startId: 'q1',
  supportId: 'support',
  maxFixCycles: 2,
  kindById: {
    q1: KIND.QUESTION, step: KIND.STEP, fix1: KIND.FIX, fix2: KIND.FIX, fix3: KIND.FIX,
    support: KIND.TERMINAL,
  },
};
const reducer = makeReducer(config);

const select = (questionId, value, goTo) => ({ type: 'SELECT', questionId, value, goTo });

describe('reducer', () => {
  it('initial state starts at startId', () => {
    expect(initialState(config)).toEqual({ currentId: 'q1', answers: {}, history: [], fixCycles: 0 });
  });

  it('SELECT records the answer, advances, and pushes history', () => {
    const s = reducer(initialState(config), select('q1', 'desktop', 'step'));
    expect(s.currentId).toBe('step');
    expect(s.answers).toEqual({ q1: 'desktop' });
    expect(s.history).toEqual(['q1']);
  });

  it('entering a fix increments fixCycles', () => {
    let s = reducer(initialState(config), select('g', 'no', 'fix1'));
    expect(s.fixCycles).toBe(1);
    expect(s.currentId).toBe('fix1');
  });

  it('escalates to support after the budget across DIFFERENT gates/fixes', () => {
    let s = initialState(config);
    s = reducer(s, select('g', 'no', 'fix1')); // cycle 1
    s = reducer(s, select('g', 'no', 'fix2')); // cycle 2
    s = reducer(s, select('g', 'no', 'fix3')); // cycle 3 -> budget reached, redirect
    expect(s.currentId).toBe('support');
  });

  it('BACK pops history, restores currentId, clears that answer, and decrements fixCycles when leaving a fix', () => {
    let s = initialState(config);
    s = reducer(s, select('q1', 'desktop', 'step'));      // q1 -> step
    s = reducer(s, select('step', 'bad', 'fix1'));        // step -> fix1 (fixCycles 1)
    expect(s.fixCycles).toBe(1);
    s = reducer(s, { type: 'BACK' });                      // back to step
    expect(s.currentId).toBe('step');
    expect(s.fixCycles).toBe(0);
    expect(s.answers.step).toBeUndefined();                // answer cleared so showWhen recomputes
  });

  it('RESTART resets to the start node', () => {
    let s = reducer(initialState(config), select('q1', 'desktop', 'step'));
    s = reducer(s, { type: 'RESTART' });
    expect(s).toEqual({ currentId: 'q1', answers: {}, history: [], fixCycles: 0 });
  });

  it('HYDRATE sets currentId + answers from a payload', () => {
    const s = reducer(initialState(config), { type: 'HYDRATE', payload: { currentId: 'step', answers: { q1: 'web' } } });
    expect(s).toEqual({ currentId: 'step', answers: { q1: 'web' }, history: [], fixCycles: 0 });
  });
});
