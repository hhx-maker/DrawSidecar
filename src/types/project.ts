import type { ImageMetadata, SourceImage } from './image';

export interface ProjectMeta {
  id: string;
  name: string;
  width: number;
  height: number;
  imageHash: string;
  revision: number;
  createdAt: number;
  updatedAt: number;
}

export interface MaskLayer {
  width: number;
  height: number;
  values: Uint8Array;
}

export interface StoredProject {
  meta: ProjectMeta;
  sourceBytes: ArrayBuffer;
  sourceMimeType: string;
  fileName: string;
  metadata: ImageMetadata;
  mask?: { width: number; height: number; values: ArrayBuffer };
}

export interface ProjectSnapshot {
  source: SourceImage | null;
}
