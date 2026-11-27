import { describe, expect, it } from 'vitest';
import { MAX_FILE_BYTES, MAX_SIDE, MAX_TOTAL_PIXELS, PngValidationError, hasAlphaChannel, readPngHeader, validatePngBlob } from '../../src/services/png';

function header(width: number, height: number, colorType = 6): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  new DataView(bytes.buffer).setUint32(8, 13);
  bytes.set([73, 72, 68, 82], 12);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  bytes[24] = 8;
  bytes[25] = colorType;
  return bytes;
}

describe('PNG validation', () => {
  it('reads valid IHDR metadata and alpha type', () => {
    const parsed = readPngHeader(header(2048, 1024));
    expect(parsed.width).toBe(2048);
    expect(parsed.height).toBe(1024);
    expect(hasAlphaChannel(parsed)).toBe(true);
    expect(hasAlphaChannel(readPngHeader(header(4, 4, 2))).valueOf()).toBe(false);
  });

  it('rejects invalid signature and truncated IHDR', () => {
    expect(() => readPngHeader(new Uint8Array(33))).toThrow(PngValidationError);
    expect(() => readPngHeader(header(0, 4))).toThrow('尺寸不能为零');
    expect(() => readPngHeader(header(MAX_SIDE + 1, 4))).toThrow('超过 Phase 0 限制');
  });

  it('rejects pixel and file size limits before decoding', async () => {
    expect(() => readPngHeader(header(MAX_TOTAL_PIXELS, 2))).toThrow('超过 Phase 0 限制');
    const oversized = { size: MAX_FILE_BYTES + 1, slice: () => new Blob() } as unknown as Blob;
    await expect(validatePngBlob(oversized)).rejects.toThrow('50 MiB');
  });
});
