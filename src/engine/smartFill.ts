import type { RegionMap } from './connectedComponents';

export interface FillResult {
  mask: Uint8Array;
  warnings: string[];
}

export function createRegionFill(regionMap: RegionMap, regionId: number, allowBackground = false): FillResult {
  const region = regionMap.regions.find((item) => item.id === regionId);
  if (!region) return { mask: new Uint8Array(regionMap.width * regionMap.height), warnings: ['未找到指定区域。'] };
  const warnings: string[] = [];
  if (region.isBackground && !allowBackground) warnings.push('该区域与计算边界相连，可能是背景。');
  const mask = new Uint8Array(regionMap.width * regionMap.height);
  if (warnings.length > 0) return { mask, warnings };
  for (let index = 0; index < regionMap.labels.length; index += 1) if (regionMap.labels[index] === regionId) mask[index] = 255;
  return { mask, warnings };
}

export function encodeColorLayer(mask: Uint8Array, width: number, height: number, color: [number, number, number, number]): Uint8ClampedArray {
  if (mask.length !== width * height) throw new Error('填色 Mask 尺寸不一致。');
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < mask.length; index += 1) {
    const output = index * 4;
    const alpha = Math.round(color[3] * mask[index] / 255);
    rgba[output] = color[0]; rgba[output + 1] = color[1]; rgba[output + 2] = color[2]; rgba[output + 3] = alpha;
  }
  return rgba;
}
