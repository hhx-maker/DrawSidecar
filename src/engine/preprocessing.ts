export type LineMode = 'transparent' | 'white-background';

export interface PreprocessOptions {
  mode: LineMode;
  alphaThreshold?: number;
  luminanceThreshold?: number;
}

export function rgbaToObstacleMask(rgba: Uint8ClampedArray, width: number, height: number, options: PreprocessOptions): Uint8Array {
  if (rgba.length !== width * height * 4) throw new Error('RGBA 像素数量与图像尺寸不一致。');
  const alphaThreshold = options.alphaThreshold ?? 16;
  const luminanceThreshold = options.luminanceThreshold ?? 245;
  const mask = new Uint8Array(width * height);
  for (let index = 0; index < mask.length; index += 1) {
    const pixel = index * 4;
    const alpha = rgba[pixel + 3];
    if (alpha < alphaThreshold) continue;
    if (options.mode === 'transparent') {
      mask[index] = 1;
      continue;
    }
    const luminance = 0.2126 * rgba[pixel] + 0.7152 * rgba[pixel + 1] + 0.0722 * rgba[pixel + 2];
    mask[index] = luminance < luminanceThreshold ? 1 : 0;
  }
  return mask;
}
