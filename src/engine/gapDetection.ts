export interface Point { x: number; y: number; }

export interface GapCandidate {
  id: string;
  start: Point;
  end: Point;
  path: Point[];
  score: number;
  reasons: string[];
  status: 'pending' | 'accepted' | 'rejected';
}

function skeletonNeighbors(skeleton: Uint8Array, width: number, height: number, point: Point): number {
  let count = 0;
  for (let y = point.y - 1; y <= point.y + 1; y += 1) for (let x = point.x - 1; x <= point.x + 1; x += 1) {
    if (x === point.x && y === point.y) continue;
    if (x >= 0 && x < width && y >= 0 && y < height && skeleton[y * width + x]) count += 1;
  }
  return count;
}

function linePath(start: Point, end: Point): Point[] {
  const points: Point[] = [];
  const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  for (let step = 0; step <= steps; step += 1) {
    const ratio = steps === 0 ? 0 : step / steps;
    const point = { x: Math.round(start.x + (end.x - start.x) * ratio), y: Math.round(start.y + (end.y - start.y) * ratio) };
    if (!points.some((existing) => existing.x === point.x && existing.y === point.y)) points.push(point);
  }
  return points;
}

function candidateId(start: Point, end: Point): string {
  const first = `${start.x},${start.y}`;
  const second = `${end.x},${end.y}`;
  return first < second ? `${first}-${second}` : `${second}-${first}`;
}

export function detectGapCandidates(skeleton: Uint8Array, obstacle: Uint8Array, width: number, height: number, maxDistance = 24): GapCandidate[] {
  if (skeleton.length !== width * height || obstacle.length !== width * height) throw new Error('缺口检测输入尺寸不一致。');
  const endpoints: Point[] = [];
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const point = { x, y };
    if (skeleton[y * width + x] && skeletonNeighbors(skeleton, width, height, point) === 1) endpoints.push(point);
  }
  const cellSize = Math.max(1, Math.floor(maxDistance));
  const grid = new Map<string, Point[]>();
  const bucket = (point: Point) => `${Math.floor(point.x / cellSize)},${Math.floor(point.y / cellSize)}`;
  for (const endpoint of endpoints) {
    const key = bucket(endpoint);
    const list = grid.get(key) ?? [];
    list.push(endpoint);
    grid.set(key, list);
  }
  const candidates: GapCandidate[] = [];
  for (const start of endpoints) {
    const cellX = Math.floor(start.x / cellSize);
    const cellY = Math.floor(start.y / cellSize);
    for (let gy = cellY - 1; gy <= cellY + 1; gy += 1) for (let gx = cellX - 1; gx <= cellX + 1; gx += 1) {
      for (const end of grid.get(`${gx},${gy}`) ?? []) {
        if (start.x === end.x && start.y === end.y) continue;
        const distance = Math.hypot(start.x - end.x, start.y - end.y);
        if (distance === 0 || distance > maxDistance) continue;
        const path = linePath(start, end);
        const crossesObstacle = path.slice(1, -1).some((point) => obstacle[point.y * width + point.x] === 1 && skeleton[point.y * width + point.x] === 0);
        if (crossesObstacle) continue;
        const score = Math.max(0, 1 - distance / maxDistance);
        const id = candidateId(start, end);
        if (candidates.some((candidate) => candidate.id === id)) continue;
        candidates.push({ id, start, end, path, score, reasons: [`端点距离 ${distance.toFixed(1)} px`, '连接路径未穿过无关障碍'], status: 'pending' });
      }
    }
  }
  return candidates.sort((left, right) => right.score - left.score);
}
