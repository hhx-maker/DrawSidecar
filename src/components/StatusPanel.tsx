import type { ImageMetadata } from '../types/image';
import type { OfflineReadiness } from '../services/offline';

interface StatusPanelProps {
  fileName: string;
  metadata: ImageMetadata;
  sha256: string;
  offline: OfflineReadiness;
  error: string | null;
}

export function StatusPanel({ fileName, metadata, sha256, offline, error }: StatusPanelProps) {
  const offlineLabel = offline.ready ? '离线就绪' : offline.network === 'offline' ? '离线检查未完成' : '在线，资源检查中';
  return (
    <aside className="status-panel" aria-label="图像状态">
      <div className="status-heading">状态</div>
      <dl>
        <div><dt>文件</dt><dd title={fileName}>{fileName}</dd></div>
        <div><dt>尺寸</dt><dd>{metadata.width} × {metadata.height} px</dd></div>
        <div><dt>Alpha</dt><dd>{metadata.hasAlpha ? '存在' : '无'}</dd></div>
        <div><dt>网络</dt><dd>{offlineLabel}</dd></div>
      </dl>
      <details className="metadata-details">
        <summary>源文件信息</summary>
        <p>SHA-256</p>
        <code>{sha256}</code>
        <p>未修改导出会直接使用原始 PNG Blob。</p>
      </details>
      {error && <p className="error-message" role="alert">{error}</p>}
    </aside>
  );
}
