import { useEffect, useRef } from 'react';
import type { MaskLayer } from '../types/project';

interface MaskOverlayProps {
  mask: MaskLayer;
  displayWidth: number;
  displayHeight: number;
}

export function MaskOverlay({ mask, displayWidth, displayHeight }: MaskOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mask.values.length !== mask.width * mask.height) throw new Error('Mask 尺寸与像素数量不一致。');
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    const image = context.createImageData(displayWidth, displayHeight);
    for (let y = 0; y < displayHeight; y += 1) {
      for (let x = 0; x < displayWidth; x += 1) {
        const sourceX = Math.min(mask.width - 1, Math.floor(x * mask.width / displayWidth));
        const sourceY = Math.min(mask.height - 1, Math.floor(y * mask.height / displayHeight));
        const alpha = Math.round(mask.values[sourceY * mask.width + sourceX] * 0.45);
        const index = (y * displayWidth + x) * 4;
        image.data[index] = 255;
        image.data[index + 1] = 96;
        image.data[index + 2] = 72;
        image.data[index + 3] = alpha;
      }
    }
    context.putImageData(image, 0, 0);
  }, [mask, displayWidth, displayHeight]);

  return <canvas ref={canvasRef} className="mask-overlay" aria-label="Mask 预览" />;
}
