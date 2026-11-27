import { useEffect, useRef } from 'react';
import type { PreviewImage } from '../types/image';
import type { MaskLayer } from '../types/project';
import { MaskOverlay } from './MaskOverlay';

interface CanvasPreviewProps {
  preview: PreviewImage;
  width: number;
  height: number;
  mask?: MaskLayer;
}

export function CanvasPreview({ preview, width, height, mask }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displaySizeRef = useRef({ width: 1, height: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.closest<HTMLElement>('.canvas-column');
    if (!canvas || !container) return;
    const draw = () => {
      const context = canvas.getContext('2d');
      if (!context) return;
      const scale = Math.min(container.clientWidth / width, container.clientHeight / height);
      const displayWidth = Math.max(1, Math.floor(width * scale));
      const displayHeight = Math.max(1, Math.floor(height * scale));
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      displaySizeRef.current = { width: displayWidth, height: displayHeight };
      context.clearRect(0, 0, displayWidth, displayHeight);
      context.drawImage(preview.image, 0, 0, displayWidth, displayHeight);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    draw();
    return () => observer.disconnect();
  }, [preview, width, height]);

  return (
    <div className="preview-stack">
      <canvas ref={canvasRef} className="preview-canvas" aria-label={`图像预览 ${width}×${height}`} />
      {mask && <MaskOverlay mask={mask} displayWidth={displaySizeRef.current.width} displayHeight={displaySizeRef.current.height} />}
    </div>
  );
}
