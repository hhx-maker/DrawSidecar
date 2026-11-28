import { describe, expect, it } from 'vitest';
import { createBaseMask } from '../../src/engine/baseMask';

describe('createBaseMask', () => {
  it('keeps a closed foreground region and warns for open contours', () => {
    const closed = new Uint8Array([
      1, 1, 1, 1,
      1, 0, 0, 1,
      1, 0, 0, 1,
      1, 1, 1, 1
    ]);
    const result = createBaseMask(closed, 4, 4);
    expect(result.mask[5]).toBe(255);
    const open = new Uint8Array(16);
    expect(createBaseMask(open, 4, 4).warnings.length).toBeGreaterThan(0);
  });
});
