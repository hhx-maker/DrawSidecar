import type { PngHeader } from '../types/image';

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_TOTAL_PIXELS = 4096 * 4096;
export const MAX_SIDE = 8192;

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

export class PngValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PngValidationError';
  }
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, false);
}

export function readPngHeader(bytes: Uint8Array): PngHeader {
  if (bytes.length < 33 || !PNG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    throw new PngValidationError('文件不是有效的 PNG。');
  }
  const chunkLength = readUint32(bytes, 8);
  const chunkType = new TextDecoder().decode(bytes.slice(12, 16));
  if (chunkLength !== 13 || chunkType !== 'IHDR') {
    throw new PngValidationError('PNG 缺少有效的 IHDR 信息。');
  }
  const width = readUint32(bytes, 16);
  const height = readUint32(bytes, 20);
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  if (width === 0 || height === 0) {
    throw new PngValidationError('PNG 尺寸不能为零。');
  }
  if (width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_TOTAL_PIXELS) {
    throw new PngValidationError('图片尺寸超过 Phase 0 限制。');
  }
  return { width, height, bitDepth, colorType };
}

export async function validatePngBlob(blob: Blob): Promise<PngHeader> {
  if (blob.size > MAX_FILE_BYTES) {
    throw new PngValidationError('文件大小超过 50 MiB 限制。');
  }
  const headerBytes = new Uint8Array(await blob.slice(0, 33).arrayBuffer());
  return readPngHeader(headerBytes);
}

export function hasAlphaChannel(header: PngHeader): boolean {
  return header.colorType === 4 || header.colorType === 6;
}

export function encodeDerivedPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('无法编码派生 PNG。'))), 'image/png');
  });
}
