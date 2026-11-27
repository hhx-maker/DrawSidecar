import { sha256Hex } from './hash';
import { hasAlphaChannel, validatePngBlob } from './png';
import type { PreviewImage, SourceImage } from '../types/image';

export interface DecodedSource {
  source: SourceImage;
  preview: PreviewImage;
  sequence: number;
}

export class DecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecodeError';
  }
}

async function decodeWithImageBitmap(blob: Blob): Promise<PreviewImage | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    return { image: await createImageBitmap(blob) };
  } catch {
    return null;
  }
}

async function decodeWithImageElement(blob: Blob): Promise<PreviewImage> {
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = 'async';
  image.src = objectUrl;
  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new DecodeError('浏览器无法解码这张 PNG。');
  }
  return { image, objectUrl };
}

export async function decodeSourceImage(file: File, sequence: number): Promise<DecodedSource> {
  const header = await validatePngBlob(file);
  const preview = (await decodeWithImageBitmap(file)) ?? (await decodeWithImageElement(file));
  const actualWidth = preview.image.width;
  const actualHeight = preview.image.height;
  if (actualWidth !== header.width || actualHeight !== header.height) {
    disposePreviewImage(preview);
    throw new DecodeError('解码后的图片尺寸与 PNG 头部不一致。');
  }
  const source: SourceImage = {
    blob: file,
    fileName: file.name || 'drawsidecar.png',
    metadata: {
      width: header.width,
      height: header.height,
      hasAlpha: hasAlphaChannel(header),
      coordinateSystem: 'origin-top-left-x-right-y-down',
      pngHeader: header
    },
    sha256: await sha256Hex(file)
  };
  return { source, preview, sequence };
}

export function disposePreviewImage(preview: PreviewImage): void {
  if ('close' in preview.image && typeof preview.image.close === 'function') preview.image.close();
  if (preview.objectUrl) URL.revokeObjectURL(preview.objectUrl);
}
