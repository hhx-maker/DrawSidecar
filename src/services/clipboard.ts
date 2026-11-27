export interface ClipboardCapabilities {
  canWritePng: boolean;
  canReadPng: boolean;
  canShareFile: boolean;
}

export type ClipboardFailure = 'unsupported' | 'permission-denied' | 'write-failed';

export function getClipboardCapabilities(): ClipboardCapabilities {
  const browser = navigator as unknown as {
    clipboard?: Clipboard;
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data?: ShareData) => boolean;
  };
  const clipboard = browser.clipboard;
  const clipboardItemConstructor = (globalThis as typeof globalThis & { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
  const hasClipboardItem = typeof clipboardItemConstructor === 'function';
  const canWritePng = Boolean(clipboard && typeof clipboard.write === 'function' && hasClipboardItem);
  const canReadPng = Boolean(clipboard && typeof clipboard.read === 'function' && hasClipboardItem);
  const canShareFile = Boolean(browser.share && browser.canShare?.({ files: [new File([''], 'probe.png', { type: 'image/png' })] }));
  return { canWritePng, canReadPng, canShareFile };
}

export async function copyPngOnUserGesture(blob: Blob): Promise<{ ok: true } | { ok: false; reason: ClipboardFailure }> {
  const capabilities = getClipboardCapabilities();
  const clipboard = (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
  const clipboardItemConstructor = (globalThis as typeof globalThis & { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
  if (!capabilities.canWritePng || !clipboard || typeof clipboard.write !== 'function' || !clipboardItemConstructor) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const item = new clipboardItemConstructor({ 'image/png': blob });
    await clipboard.write([item]);
    return { ok: true };
  } catch (error) {
    const message = error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      ? 'permission-denied'
      : 'write-failed';
    return { ok: false, reason: message };
  }
}
