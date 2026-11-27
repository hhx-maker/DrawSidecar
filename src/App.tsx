import { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasPreview } from './components/CanvasPreview';
import { ImportCard } from './components/ImportCard';
import { StatusPanel } from './components/StatusPanel';
import { Toolbar } from './components/Toolbar';
import { copyPngOnUserGesture, getClipboardCapabilities } from './services/clipboard';
import { decodeSourceImage, disposePreviewImage } from './services/imageDecode';
import { getNetworkState, getOfflineReadiness, type OfflineReadiness } from './services/offline';
import { exportUnchangedPng } from './services/export';
import { ImportSequence } from './services/importSequence';
import { registerPwa } from './pwa';
import type { PreviewImage, SourceImage } from './types/image';

const initialOffline: OfflineReadiness = { network: getNetworkState(), controlled: false, cacheComplete: false, ready: false };

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function App() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const [offline, setOffline] = useState(initialOffline);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sequenceRef = useRef(new ImportSequence());
  const previewRef = useRef<PreviewImage | null>(null);

  const refreshOffline = useCallback(() => {
    void getOfflineReadiness().then(setOffline);
  }, []);

  useEffect(() => {
    registerPwa(() => setNotice('检测到新版本，完成当前操作后可以刷新。'), refreshOffline);
    refreshOffline();
    window.addEventListener('online', refreshOffline);
    window.addEventListener('offline', refreshOffline);
    navigator.serviceWorker?.addEventListener('controllerchange', refreshOffline);
    return () => {
      window.removeEventListener('online', refreshOffline);
      window.removeEventListener('offline', refreshOffline);
    };
  }, [refreshOffline]);

  useEffect(() => () => {
    if (previewRef.current) disposePreviewImage(previewRef.current);
  }, []);

  const importFile = useCallback(async (file: File) => {
    const sequence = sequenceRef.current.next();
    setError(null);
    setNotice('正在读取 PNG…');
    try {
      const decoded = await decodeSourceImage(file, sequence);
      if (!sequenceRef.current.isCurrent(sequence)) {
        disposePreviewImage(decoded.preview);
        return;
      }
      if (previewRef.current) disposePreviewImage(previewRef.current);
      previewRef.current = decoded.preview;
      setSource(decoded.source);
      setPreview(decoded.preview);
      setNotice('已载入原始 PNG。');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '无法读取这张 PNG。');
      setNotice(null);
    }
  }, []);

  const pasteImage = useCallback(async () => {
    setError(null);
    if (!navigator.clipboard?.read) {
      setError('当前浏览器不支持读取剪贴板，请使用文件导入。');
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((value) => value === 'image/png');
        if (type) {
          const blob = await item.getType(type);
          await importFile(new File([blob], 'clipboard.png', { type: 'image/png' }));
          return;
        }
      }
      setError('剪贴板中没有 PNG 图像，请使用文件导入。');
    } catch {
      setError('剪贴板读取被拒绝，请使用文件导入。');
    }
  }, [importFile]);

  const clearImage = () => {
    sequenceRef.current.next();
    if (previewRef.current) disposePreviewImage(previewRef.current);
    previewRef.current = null;
    setPreview(null);
    setSource(null);
    setError(null);
    setNotice('已清空当前图像。');
  };

  const download = () => {
    if (!source) return;
    downloadBlob(exportUnchangedPng(source), source.fileName);
    setNotice('已下载原始 PNG。');
  };

  const copy = async () => {
    if (!source) return;
    const result = await copyPngOnUserGesture(exportUnchangedPng(source));
    if (result.ok) setNotice('图像已复制。');
    else setError(result.reason === 'unsupported' ? '当前浏览器不支持 PNG 剪贴板，请使用下载。' : '剪贴板写入失败，请使用下载。');
  };

  const canPaste = Boolean(navigator.clipboard?.read);
  const canCopy = Boolean(source && getClipboardCapabilities().canWritePng);

  if (!source || !preview) {
    return (
      <main className="app-shell landing-shell">
        <header className="app-header"><strong>DrawSidecar</strong><span>{offline.ready ? '离线就绪' : '离线资源检查中'}</span></header>
        <ImportCard onImport={importFile} onPaste={pasteImage} pasteEnabled={canPaste} />
        {error && <p className="landing-error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}
      </main>
    );
  }

  return (
    <main className="app-shell workbench-shell">
      <header className="app-header"><strong>DrawSidecar</strong><span>{offline.ready ? '离线就绪' : '离线资源检查中'}</span></header>
      <div className="workbench">
        <Toolbar onImport={importFile} onPaste={pasteImage} onDownload={download} onCopy={copy} onReset={() => setNotice('视图已重置。')} onClear={clearImage} canCopy={canCopy} />
        <section className="canvas-column" aria-label="Canvas 预览">
          <CanvasPreview preview={preview} width={source.metadata.width} height={source.metadata.height} />
          {notice && <p className="notice" role="status">{notice}</p>}
        </section>
        <StatusPanel fileName={source.fileName} metadata={source.metadata} sha256={source.sha256} offline={offline} error={error} />
      </div>
    </main>
  );
}
