import { describe, expect, it } from 'vitest';
import { createContainTransform } from '../../src/utils/coordinateMapper';

describe('createContainTransform', () => {
  it('maps letterboxed coordinates to clamped image pixels', () => {
    const transform = createContainTransform(100, 50, 300, 300);
    expect(transform.displayWidth).toBe(300);
    expect(transform.displayHeight).toBe(150);
    expect(transform.toImagePoint(150, 150)).toEqual({ x: 50, y: 25 });
    expect(transform.toImagePoint(-20, 0)).toEqual({ x: 0, y: 0 });
  });
});
