import { describe, expect, it } from 'vitest';
import { exportUnchangedPng } from '../../src/services/export';
import { sha256Hex } from '../../src/services/hash';
import type { SourceImage } from '../../src/types/image';

describe('source-preserving export', () => {
  it('returns the same Blob bytes and SHA-256 for an unchanged source', async () => {
    const blob = new Blob([new Uint8Array([137, 80, 78, 71, 0, 1, 2, 3])], { type: 'image/png' });
    const source: SourceImage = {
      blob,
      fileName: 'fixture.png',
      metadata: {
        width: 2,
        height: 2,
        hasAlpha: true,
        coordinateSystem: 'origin-top-left-x-right-y-down',
        pngHeader: { width: 2, height: 2, bitDepth: 8, colorType: 6 }
      },
      sha256: await sha256Hex(blob)
    };
    const exported = exportUnchangedPng(source);
    expect(exported).toBe(blob);
    await expect(sha256Hex(exported)).resolves.toBe(source.sha256);
  });
});
