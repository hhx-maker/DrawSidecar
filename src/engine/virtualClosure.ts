import type { GapCandidate } from './gapDetection';

export function applyVirtualClosure(obstacle: Uint8Array, width: number, height: number, candidate: GapCandidate): Uint8Array {
  if (obstacle.length !== width * height) throw new Error('虚拟闭合输入尺寸不一致。');
  const output = new Uint8Array(obstacle);
  for (const point of candidate.path) {
    if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) throw new Error('虚拟闭合路径超出图像边界。');
    output[point.y * width + point.x] = 1;
  }
  return output;
}
