export interface RegionInfo {
  id: number;
  area: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  representative: { x: number; y: number };
  isBackground: boolean;
}

export interface RegionMap {
  labels: Int32Array;
  regions: RegionInfo[];
  width: number;
  height: number;
}

export function labelOpenRegions(obstacle: Uint8Array, width: number, height: number, addBorder = true): RegionMap {
  if (obstacle.length !== width * height) throw new Error('区域分析输入尺寸不一致。');
  const labels = new Int32Array(width * height);
  const regions: RegionInfo[] = [];
  let nextId = 1;
  const queue = new Int32Array(width * height);
  const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const start = y * width + x;
    if (obstacle[start] || labels[start]) continue;
    let head = 0; let tail = 0; let area = 0; let minX = x; let maxX = x; let minY = y; let maxY = y;
    let representative = { x, y };
    queue[tail++] = start;
    labels[start] = nextId;
    while (head < tail) {
      const index = queue[head++];
      const currentX = index % width; const currentY = Math.floor(index / width);
      area += 1; representative = { x: currentX, y: currentY };
      minX = Math.min(minX, currentX); maxX = Math.max(maxX, currentX); minY = Math.min(minY, currentY); maxY = Math.max(maxY, currentY);
      for (const [dx, dy] of neighbors) {
        const nextX = currentX + dx; const nextY = currentY + dy;
        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
        const nextIndex = nextY * width + nextX;
        if (!obstacle[nextIndex] && !labels[nextIndex]) { labels[nextIndex] = nextId; queue[tail++] = nextIndex; }
      }
    }
    regions.push({ id: nextId, area, minX, minY, maxX, maxY, representative, isBackground: addBorder && (minX === 0 || minY === 0 || maxX === width - 1 || maxY === height - 1) });
    nextId += 1;
  }
  return { labels, regions, width, height };
}
