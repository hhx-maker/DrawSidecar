import { encodeDerivedPng } from './png';
import type { SourceImage } from '../types/image';

export function exportUnchangedPng(source: SourceImage): Blob {
  return source.blob;
}

export function exportDerivedPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return encodeDerivedPng(canvas);
}
