import { labelOpenRegions } from './connectedComponents';

export interface BaseMaskResult {
  mask: Uint8Array;
  warnings: string[];
}

export function createBaseMask(obstacle: Uint8Array, width: number, height: number): BaseMaskResult {
  const regions = labelOpenRegions(obstacle, width, height, true);
  const backgroundIds = new Set(regions.regions.filter((region) => region.isBackground).map((region) => region.id));
  const mask = new Uint8Array(width * height);
  for (let index = 0; index < mask.length; index += 1) {
    if (obstacle[index] || !backgroundIds.has(regions.labels[index])) mask[index] = 255;
  }
  const warnings: string[] = [];
  if (backgroundIds.size === 0) warnings.push('未识别到可达外部背景。');
  if (backgroundIds.size > 1) warnings.push('存在多个边界可达背景区域，结果需要人工确认。');
  if (mask.every((value) => value === 0)) warnings.push('轮廓可能开放，整体底色结果不可靠。');
  return { mask, warnings };
}
