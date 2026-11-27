interface ImportCardProps {
  onImport: (file: File) => void;
  onPaste: () => void;
  pasteEnabled: boolean;
}

export function ImportCard({ onImport, onPaste, pasteEnabled }: ImportCardProps) {
  return (
    <section className="import-card" aria-labelledby="import-title">
      <p className="eyebrow">DrawSidecar · Phase 0</p>
      <h1 id="import-title">从一张 PNG 开始</h1>
      <p>原始文件保持不变。Canvas 只用于预览，未修改的导出会直接复用源 PNG。</p>
      <label className="primary-button">
        导入 PNG
        <input type="file" accept="image/png,.png" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.currentTarget.value = '';
        }} />
      </label>
      <button type="button" className="secondary-button" onClick={onPaste} disabled={!pasteEnabled}>
        从剪贴板粘贴
      </button>
      <p className="muted">本阶段不自动保存项目。关闭页面后可能需要重新导入图像。</p>
    </section>
  );
}
