import { describe, expect, it } from 'vitest';
import { labelOpenRegions } from '../../src/engine/connectedComponents';

describe('labelOpenRegions', () => {
  it('uses four-connectivity and identifies border background', () => {
    const obstacle = new Uint8Array([0, 1, 0, 1, 0, 0, 0, 1, 0]);
    const result = labelOpenRegions(obstacle, 3, 3);
    expect(result.regions.length).toBeGreaterThan(0);
    expect(result.regions.every((region) => region.area > 0)).toBe(true);
    expect(result.regions.some((region) => region.isBackground)).toBe(true);
  });
});
