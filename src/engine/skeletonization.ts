function neighbors(mask: Uint8Array, width: number, height: number, x: number, y: number): number[] {
  const points = [[x, y - 1], [x + 1, y - 1], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x - 1, y + 1], [x - 1, y], [x - 1, y - 1]];
  return points.map(([px, py]) => px >= 0 && px < width && py >= 0 && py < height ? mask[py * width + px] : 0);
}

function transitions(values: number[]): number {
  let count = 0;
  for (let i = 0; i < values.length; i += 1) if (values[i] === 0 && values[(i + 1) % values.length] === 1) count += 1;
  return count;
}

export function skeletonize(input: Uint8Array, width: number, height: number, maxIterations = 100): Uint8Array {
  if (input.length !== width * height) throw new Error('骨架输入尺寸不一致。');
  const skeleton = new Uint8Array(input);
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let changed = false;
    for (let pass = 0; pass < 2; pass += 1) {
      const remove: number[] = [];
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const index = y * width + x;
          if (!skeleton[index]) continue;
          const n = neighbors(skeleton, width, height, x, y);
          const count = n.reduce((sum, value) => sum + value, 0);
          if (count < 2 || count > 6 || transitions(n) !== 1) continue;
          const condition = pass === 0
            ? n[0] * n[2] * n[4] === 0 && n[2] * n[4] * n[6] === 0
            : n[0] * n[2] * n[6] === 0 && n[0] * n[4] * n[6] === 0;
          if (condition) remove.push(index);
        }
      }
      for (const index of remove) { skeleton[index] = 0; changed = true; }
    }
    if (!changed) break;
  }
  return skeleton;
}
