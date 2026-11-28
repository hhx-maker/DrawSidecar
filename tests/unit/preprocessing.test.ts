import { describe, expect, it } from 'vitest';
import { rgbaToObstacleMask } from '../../src/engine/preprocessing';

describe('rgbaToObstacleMask', () => {
  it('ignores hidden RGB in transparent mode', () => {
    const rgba = new Uint8ClampedArray([255, 0, 0, 0, 0, 0, 0, 255]);
    expect([...rgbaToObstacleMask(rgba, 2, 1, { mode: 'transparent' })]).toEqual([0, 1]);
  });

  it('detects dark strokes on white backgrounds', () => {
    const rgba = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
    expect([...rgbaToObstacleMask(rgba, 2, 1, { mode: 'white-background' })]).toEqual([1, 0]);
  });
});
