import type { RegionMap } from './connectedComponents';

export function selectRegions(regionMap: RegionMap, selectedIds: number[], invert = false, includeBackground = false): Uint8Array {
  const selected = new Set(selectedIds);
  const output = new Uint8Array(regionMap.width * regionMap.height);
  for (let index = 0; index < regionMap.labels.length; index += 1) {
    const id = regionMap.labels[index];
    const region = regionMap.regions.find((item) => item.id === id);
    if (!region || (region.isBackground && !includeBackground)) continue;
    const active = invert ? !selected.has(id) : selected.has(id);
    if (active) output[index] = 255;
  }
  return output;
}
