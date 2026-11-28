import { describe, expect, it } from 'vitest';
import { applyVirtualClosure } from '../../src/engine/virtualClosure';

describe('applyVirtualClosure', () => {
  it('returns a new mask and leaves the source unchanged', () => {
    const source = new Uint8Array(9);
    const candidate = { id: 'a', start: { x: 0, y: 1 }, end: { x: 2, y: 1 }, path: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], score: 1, reasons: [], status: 'pending' as const };
    const output = applyVirtualClosure(source, 3, 3, candidate);
    expect([...source]).toEqual(new Array(9).fill(0));
    expect([...output]).toEqual([0, 0, 0, 1, 1, 1, 0, 0, 0]);
  });
});
