interface ImportCardProps {
  onImport: (file: File) => void;
  onPaste: () => void;
  pasteEnabled: boolean;
}

export function ImportCard({ onImport, onPaste, pasteEnabled }: ImportCardProps) {
  return (
    <section className="import-card" aria-labelledby="import-title">
      <p className="eyebrow">DrawSidecar · Phase 1</p>
      <h1 id="import-title">从一张 PNG 开始</h1>
      <p>本地项目会保存在浏览器中。原始文件保持不变，Canvas 只用于预览，未修改的导出会直接复用源 PNG。</p>
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
      <p className="muted">关闭页面后会尝试恢复最近项目。清除浏览器站点数据后需要重新导入图像。</p>
    </section>
  );
}
