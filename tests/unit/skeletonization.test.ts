import { describe, expect, it } from 'vitest';
import { skeletonize } from '../../src/engine/skeletonization';

describe('skeletonize', () => {
  it('preserves a one-pixel line and thins a solid bar', () => {
    const line = new Uint8Array([0, 1, 1, 1, 0]);
    expect([...skeletonize(line, 5, 1)]).toEqual([...line]);
    const bar = new Uint8Array(49);
    for (let y = 1; y < 6; y += 1) for (let x = 1; x < 6; x += 1) bar[y * 7 + x] = 1;
    const result = skeletonize(bar, 7, 7);
    expect(result.reduce((sum, value) => sum + value, 0)).toBeLessThan(25);
    expect(result.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(0);
  });
});
