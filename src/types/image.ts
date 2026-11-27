export interface PngHeader {
  width: number;
  height: number;
  colorType: number;
  bitDepth: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  hasAlpha: boolean;
  coordinateSystem: 'origin-top-left-x-right-y-down';
  pngHeader: PngHeader;
}

export interface SourceImage {
  readonly blob: Blob;
  readonly fileName: string;
  readonly metadata: ImageMetadata;
  readonly sha256: string;
}

export interface PreviewImage {
  image: ImageBitmap | HTMLImageElement;
  objectUrl?: string;
}
