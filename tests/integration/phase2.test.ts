import { describe, expect, it } from 'vitest';
import { rgbaToObstacleMask } from '../../src/engine/preprocessing';
import { skeletonize } from '../../src/engine/skeletonization';
import { labelOpenRegions } from '../../src/engine/connectedComponents';
import { createBaseMask } from '../../src/engine/baseMask';
import { createRegionFill, encodeColorLayer } from '../../src/engine/smartFill';

describe('Phase 2 deterministic pipeline', () => {
  it('preprocesses, labels, fills, and creates a base mask without mutating RGBA input', () => {
    const width = 7; const height = 7;
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let y = 1; y < 6; y += 1) for (let x = 1; x < 6; x += 1) {
      const index = (y * width + x) * 4;
      const boundary = x === 1 || x === 5 || y === 1 || y === 5;
      rgba[index] = boundary ? 0 : 255; rgba[index + 1] = boundary ? 0 : 255; rgba[index + 2] = boundary ? 0 : 255; rgba[index + 3] = 255;
    }
    const original = new Uint8ClampedArray(rgba);
    const obstacle = rgbaToObstacleMask(rgba, width, height, { mode: 'white-background' });
    const skeleton = skeletonize(obstacle, width, height);
    const regions = labelOpenRegions(obstacle, width, height);
    const foreground = regions.regions.find((region) => !region.isBackground);
    expect(foreground).toBeDefined();
    const fill = createRegionFill(regions, foreground!.id);
    expect(fill.warnings).toEqual([]);
    expect(encodeColorLayer(fill.mask, width, height, [255, 0, 0, 160]).length).toBe(width * height * 4);
    expect(createBaseMask(obstacle, width, height).mask[24]).toBe(255);
    expect(skeleton.length).toBe(width * height);
    expect(rgba).toEqual(original);
  });
});
