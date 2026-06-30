import { describe, it, expect } from 'vitest';
import { encodeState, decodeState } from '../urlState';

describe('urlState', () => {
  it('round-trips currentId + answers', () => {
    const st = { currentId: 'web-network-star', answers: { platform: 'web', connection: 'network', vendor: 'star', scheme: 'https' } };
    const token = encodeState(st);
    expect(typeof token).toBe('string');
    expect(token).not.toMatch(/[ &=#]/); // URL-safe: no raw separators that break the locale switcher
    expect(decodeState(token)).toEqual(st);
  });

  it('returns null for garbage / empty', () => {
    expect(decodeState('')).toBeNull();
    expect(decodeState('%%%not-valid')).toBeNull();
  });

  it('tolerates a leading # and the wiz= prefix being stripped by the caller', () => {
    const token = encodeState({ currentId: 'start', answers: {} });
    expect(decodeState(token)).toEqual({ currentId: 'start', answers: {} });
  });
});
