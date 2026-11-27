interface ToolbarProps {
  onImport: (file: File) => void;
  onPaste: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onReset: () => void;
  onClear: () => void;
  canCopy: boolean;
}

export function Toolbar({ onImport, onPaste, onDownload, onCopy, onReset, onClear, canCopy }: ToolbarProps) {
  return (
    <aside className="toolbar" aria-label="工具">
      <div className="toolbar-heading">工具</div>
      <label className="tool-button primary-button">
        导入 PNG
        <input type="file" accept="image/png,.png" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.currentTarget.value = '';
        }} />
      </label>
      <button type="button" className="tool-button" onClick={onPaste}>粘贴图像</button>
      <div className="tool-divider" />
      <button type="button" className="tool-button" onClick={onDownload}>导出 PNG</button>
      <button type="button" className="tool-button" onClick={onCopy} disabled={!canCopy}>复制图像</button>
      <div className="tool-divider" />
      <button type="button" className="tool-button" onClick={onReset}>重置视图</button>
      <button type="button" className="tool-button danger-button" onClick={onClear}>清空图像</button>
    </aside>
  );
}
