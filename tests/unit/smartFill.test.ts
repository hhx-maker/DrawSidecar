import { describe, expect, it } from 'vitest';
import { labelOpenRegions } from '../../src/engine/connectedComponents';
import { createRegionFill, encodeColorLayer } from '../../src/engine/smartFill';

describe('smart fill', () => {
  it('encodes selected color and alpha without changing the mask', () => {
    const map = labelOpenRegions(new Uint8Array([
      1, 1, 1, 1, 1,
      1, 0, 0, 0, 1,
      1, 0, 0, 0, 1,
      1, 0, 0, 0, 1,
      1, 1, 1, 1, 1
    ]), 5, 5);
    const region = map.regions.find((item) => !item.isBackground);
    expect(region).toBeDefined();
    const fill = createRegionFill(map, region!.id);
    const original = [...fill.mask];
    const rgba = encodeColorLayer(fill.mask, 5, 5, [10, 20, 30, 128]);
    expect(rgba.some((value) => value === 10)).toBe(true);
    expect([...fill.mask]).toEqual(original);
  });
});
