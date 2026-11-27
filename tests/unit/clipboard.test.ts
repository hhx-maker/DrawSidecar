import { describe, expect, it, vi } from 'vitest';
import { copyPngOnUserGesture, getClipboardCapabilities } from '../../src/services/clipboard';

describe('clipboard capability handling', () => {
  it('reports unsupported when ClipboardItem or write is unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: undefined });
    vi.stubGlobal('ClipboardItem', undefined);
    expect(getClipboardCapabilities().canWritePng).toBe(false);
    await expect(copyPngOnUserGesture(new Blob(['x']))).resolves.toEqual({ ok: false, reason: 'unsupported' });
    vi.unstubAllGlobals();
  });

  it('returns a failure when the user denies clipboard writing', async () => {
    class FakeClipboardItem {
      constructor(public readonly data: Record<string, Blob>) {}
    }
    vi.stubGlobal('ClipboardItem', FakeClipboardItem);
    vi.stubGlobal('navigator', { clipboard: { write: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) } });
    await expect(copyPngOnUserGesture(new Blob(['x']))).resolves.toEqual({ ok: false, reason: 'permission-denied' });
    vi.unstubAllGlobals();
  });
});
