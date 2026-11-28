import { describe, expect, it } from 'vitest';
import { labelOpenRegions } from '../../src/engine/connectedComponents';
import { selectRegions } from '../../src/engine/smartSelection';

describe('selectRegions', () => {
  it('selects explicit regions and supports scoped inversion', () => {
    const map = labelOpenRegions(new Uint8Array([
      1, 1, 1, 1,
      1, 0, 0, 1,
      1, 0, 0, 1,
      1, 1, 1, 1
    ]), 4, 4);
    const id = map.regions.find((region) => !region.isBackground)?.id ?? map.regions[0].id;
    const selected = selectRegions(map, [id]);
    expect(selected.some((value) => value === 255)).toBe(true);
    expect(selectRegions(map, [id], true).some((value) => value === 255)).toBe(false);
  });
});
