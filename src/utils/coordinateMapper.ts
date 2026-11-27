export interface ContainTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  displayWidth: number;
  displayHeight: number;
  toImagePoint(cssX: number, cssY: number): { x: number; y: number };
}

export function createContainTransform(imageWidth: number, imageHeight: number, viewportWidth: number, viewportHeight: number): ContainTransform {
  if (imageWidth <= 0 || imageHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) throw new Error('坐标映射尺寸必须为正数。');
  const scale = Math.min(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const displayWidth = imageWidth * scale;
  const displayHeight = imageHeight * scale;
  const offsetX = (viewportWidth - displayWidth) / 2;
  const offsetY = (viewportHeight - displayHeight) / 2;
  return {
    scale, offsetX, offsetY, displayWidth, displayHeight,
    toImagePoint(cssX, cssY) {
      return {
        x: Math.max(0, Math.min(imageWidth - 1, Math.round((cssX - offsetX) / scale))),
        y: Math.max(0, Math.min(imageHeight - 1, Math.round((cssY - offsetY) / scale)))
      };
    }
  };
}
