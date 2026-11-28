import { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasPreview } from './components/CanvasPreview';
import { Phase2Panel } from './components/Phase2Panel';
import { ImportCard } from './components/ImportCard';
import { StatusPanel } from './components/StatusPanel';
import { Toolbar } from './components/Toolbar';
import { copyPngOnUserGesture, getClipboardCapabilities } from './services/clipboard';
import { decodeSourceImage, disposePreviewImage } from './services/imageDecode';
import { getNetworkState, getOfflineReadiness, type OfflineReadiness } from './services/offline';
import { exportUnchangedPng } from './services/export';
import { ImportSequence } from './services/importSequence';
import { applyVirtualClosure } from './engine/virtualClosure';
import type { GapCandidate } from './engine/gapDetection';
import type { RegionInfo } from './engine/connectedComponents';
import { History } from './services/history';
import { createProjectMeta, deleteProject, loadLatestProject, saveProject } from './services/projectStore';
import { registerPwa } from './pwa';
import { createComputeWorker, type WorkerClient } from './services/workerRpc';
import type { PreviewImage, SourceImage } from './types/image';
import type { ProjectMeta } from './types/project';

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
  const historyRef = useRef(new History<SourceImage | null>(null));
  const projectMetaRef = useRef<ProjectMeta | null>(null);
  const phase2WorkerRef = useRef<WorkerClient | null>(null);
  const obstacleRef = useRef<Uint8Array | null>(null);
  const skeletonRef = useRef<Uint8Array | null>(null);
  const regionMapRef = useRef<{ labels: Int32Array; regions: RegionInfo[]; width: number; height: number } | null>(null);
  const [phase2Candidates, setPhase2Candidates] = useState<GapCandidate[]>([]);
  const [phase2Regions, setPhase2Regions] = useState<RegionInfo[]>([]);
  const [phase2Busy, setPhase2Busy] = useState(false);
  const [phase2Notice, setPhase2Notice] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [hasDerivedFill, setHasDerivedFill] = useState(false);
  const derivedFillRef = useRef<Uint8ClampedArray | null>(null);

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

  useEffect(() => {
    const worker = createComputeWorker();
    phase2WorkerRef.current = worker;
    void worker.run({ jobId: crypto.randomUUID(), revision: 0, toolId: 'ping', params: {} }).catch(() => setNotice('计算 Worker 尚未就绪。'));
    return () => { phase2WorkerRef.current = null; worker.dispose(); };
  }, []);

  const readPreviewPixels = useCallback((): Uint8ClampedArray | null => {
    if (!preview || !source) return null;
    const canvas = document.createElement('canvas');
    canvas.width = source.metadata.width;
    canvas.height = source.metadata.height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(preview.image, 0, 0, canvas.width, canvas.height);
    return context.getImageData(0, 0, canvas.width, canvas.height).data;
  }, [preview, source]);

  const runPhase2Task = useCallback(async <T,>(toolId: string, params: Record<string, unknown>): Promise<T> => {
    if (!phase2WorkerRef.current || !source) throw new Error('Phase 2 Worker 尚未就绪。');
    return phase2WorkerRef.current.run<T, Record<string, unknown>>({ jobId: crypto.randomUUID(), revision: projectMetaRef.current?.revision ?? 0, toolId, params });
  }, [source]);

  const analyzeGaps = useCallback(async () => {
    if (!source) return;
    setPhase2Busy(true); setPhase2Notice('正在分析线稿缺口…');
    try {
      const pixels = readPreviewPixels();
      if (!pixels) throw new Error('无法读取当前预览像素。');
      const width = source.metadata.width; const height = source.metadata.height;
      const prepared = await runPhase2Task<{ mask: ArrayBuffer }>('preprocess', { rgba: pixels.buffer, width, height, options: { mode: 'transparent' } });
      const obstacle = new Uint8Array(prepared.mask);
      const thin = await runPhase2Task<{ skeleton: ArrayBuffer }>('skeletonize', { mask: obstacle.buffer, width, height });
      const skeleton = new Uint8Array(thin.skeleton);
      const detected = await runPhase2Task<{ candidates: GapCandidate[] }>('detect-gaps', { skeleton: skeleton.buffer, obstacle: obstacle.buffer, width, height, maxDistance: 24 });
      obstacleRef.current = obstacle; skeletonRef.current = skeleton; setPhase2Candidates(detected.candidates); setPhase2Notice(`已找到 ${detected.candidates.length} 个待确认候选。`);
    } catch (caught) { setPhase2Notice(caught instanceof Error ? caught.message : '缺口分析失败。'); }
    finally { setPhase2Busy(false); }
  }, [readPreviewPixels, runPhase2Task, source]);

  const acceptClosure = () => {
    const obstacle = obstacleRef.current; const candidate = phase2Candidates[0];
    if (!obstacle || !candidate || !source) return;
    obstacleRef.current = applyVirtualClosure(obstacle, source.metadata.width, source.metadata.height, candidate);
    setPhase2Candidates((items) => items.map((item, index) => index === 0 ? { ...item, status: 'accepted' } : item));
    setPhase2Notice('已接受首个候选的虚拟闭合，原始线稿未修改。');
  };

  const recomputeRegions = useCallback(async () => {
    const obstacle = obstacleRef.current; if (!obstacle || !source) return;
    setPhase2Busy(true); setPhase2Notice('正在重算连通区域…');
    try {
      const result = await runPhase2Task<{ labels: ArrayBuffer; regions: RegionInfo[]; width: number; height: number }>('regions', { obstacle: obstacle.buffer, width: source.metadata.width, height: source.metadata.height });
      regionMapRef.current = { labels: new Int32Array(result.labels), regions: result.regions, width: result.width, height: result.height }; setPhase2Regions(result.regions); setSelectedRegionId(result.regions.find((region) => !region.isBackground)?.id ?? null); setPhase2Notice(`已生成 ${result.regions.length} 个几何区域。`);
    } catch (caught) { setPhase2Notice(caught instanceof Error ? caught.message : '区域分析失败。'); }
    finally { setPhase2Busy(false); }
  }, [runPhase2Task, source]);

  const fillRegion = useCallback(async () => {
    const map = regionMapRef.current; if (!map || selectedRegionId === null) return;
    const region = map.regions.find((item) => item.id === selectedRegionId); if (!region) { setPhase2Notice('未找到选中区域。'); return; }
    setPhase2Busy(true); setPhase2Notice('正在生成独立 RGBA 填色层…');
    try {
      const result = await runPhase2Task<{ rgba: ArrayBuffer; warnings: string[] }>('fill', { labels: map.labels.buffer, regions: map.regions, width: map.width, height: map.height, regionId: region.id, color: [255, 196, 64, 180] });
      derivedFillRef.current = new Uint8ClampedArray(result.rgba);
      setHasDerivedFill(true);
      setPhase2Notice(`已生成区域 ${region.id} 的独立填色层，原图保持不变。`);
    } catch (caught) { setPhase2Notice(caught instanceof Error ? caught.message : '填色失败。'); }
    finally { setPhase2Busy(false); }
  }, [runPhase2Task, selectedRegionId]);

  const exportFill = () => {
    if (!derivedFillRef.current || !source) return;
    const canvas = document.createElement('canvas'); canvas.width = source.metadata.width; canvas.height = source.metadata.height;
    const pixels = new Uint8ClampedArray(derivedFillRef.current.length); pixels.set(derivedFillRef.current);
    canvas.getContext('2d')?.putImageData(new ImageData(pixels, canvas.width, canvas.height), 0, 0);
    void new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('无法编码填色层。')), 'image/png')).then((blob) => downloadBlob(blob, `${source.fileName.replace(/\.png$/i, '')}-fill.png`)).then(() => setPhase2Notice('已导出独立填色层。')).catch(() => setPhase2Notice('填色层导出失败。'));
  };

  const generateBaseMask = useCallback(async () => {
    const obstacle = obstacleRef.current; if (!obstacle || !source) return;
    setPhase2Busy(true); setPhase2Notice('正在生成整体底色 Mask…');
    try {
      const result = await runPhase2Task<{ mask: ArrayBuffer; warnings: string[] }>('base-mask', { obstacle: obstacle.buffer, width: source.metadata.width, height: source.metadata.height });
      setPhase2Notice(result.warnings.length ? result.warnings.join(' ') : '已生成整体底色 Mask，请确认后再导出。');
    } catch (caught) { setPhase2Notice(caught instanceof Error ? caught.message : '整体底色 Mask 失败。'); }
    finally { setPhase2Busy(false); }
  }, [runPhase2Task, source]);

  const applySource = useCallback(async (nextSource: SourceImage | null, notice: string) => {
    const sequence = sequenceRef.current.next();
    if (!nextSource) {
      if (previewRef.current) disposePreviewImage(previewRef.current);
      previewRef.current = null;
      setPreview(null);
      setSource(null);
      setNotice(notice);
      return;
    }
    const file = new File([nextSource.blob], nextSource.fileName, { type: 'image/png' });
    const decoded = await decodeSourceImage(file, sequence);
    if (!sequenceRef.current.isCurrent(sequence)) {
      disposePreviewImage(decoded.preview);
      return;
    }
    if (previewRef.current) disposePreviewImage(previewRef.current);
    previewRef.current = decoded.preview;
    setSource(decoded.source);
    setPreview(decoded.preview);
    setNotice(notice);
  }, []);

  useEffect(() => {
    let active = true;
    void loadLatestProject().then(async (stored) => {
      if (!active || !stored) return;
      try {
        const file = new File([new Blob([stored.sourceBytes], { type: stored.sourceMimeType })], stored.fileName, { type: stored.sourceMimeType });
        const decoded = await decodeSourceImage(file, sequenceRef.current.next());
        if (!active) {
          disposePreviewImage(decoded.preview);
          return;
        }
        projectMetaRef.current = stored.meta;
        historyRef.current.push(decoded.source);
        if (previewRef.current) disposePreviewImage(previewRef.current);
        previewRef.current = decoded.preview;
        setSource(decoded.source);
        setPreview(decoded.preview);
        setNotice('已恢复本地项目。');
      } catch {
        setNotice('本地项目无法恢复，请重新导入 PNG。');
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

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
      historyRef.current.push(decoded.source);
      const now = Date.now();
      const existing = projectMetaRef.current;
      const meta = existing && existing.imageHash === decoded.source.sha256
        ? { ...existing, revision: existing.revision + 1, updatedAt: now }
        : createProjectMeta(decoded.source.sha256, decoded.source.fileName, decoded.source.metadata.width, decoded.source.metadata.height, now);
      projectMetaRef.current = meta;
      await saveProject({ meta, sourceBytes: await decoded.source.blob.arrayBuffer(), sourceMimeType: decoded.source.blob.type, fileName: decoded.source.fileName, metadata: decoded.source.metadata });
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
    historyRef.current.push(null);
    sequenceRef.current.next();
    if (previewRef.current) disposePreviewImage(previewRef.current);
    previewRef.current = null;
    setPreview(null);
    setSource(null);
    const projectId = projectMetaRef.current?.id;
    projectMetaRef.current = null;
    if (projectId) void deleteProject(projectId);
    setError(null);
    setNotice('已清空当前图像。');
  };

  const undo = () => {
    void applySource(historyRef.current.undo(), '已撤销最近一次图像操作。');
  };

  const redo = () => {
    void applySource(historyRef.current.redo(), '已重做图像操作。');
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
        <Toolbar onImport={importFile} onPaste={pasteImage} onDownload={download} onCopy={copy} onReset={() => setNotice('视图已重置。')} onClear={clearImage} onUndo={undo} onRedo={redo} canUndo={historyRef.current.canUndo} canRedo={historyRef.current.canRedo} canCopy={canCopy} />
        <section className="canvas-column" aria-label="Canvas 预览">
          <CanvasPreview preview={preview} width={source.metadata.width} height={source.metadata.height} />
          {notice && <p className="notice" role="status">{notice}</p>}
          <Phase2Panel candidates={phase2Candidates} regions={phase2Regions} busy={phase2Busy} notice={phase2Notice} onAnalyze={analyzeGaps} onAcceptClosure={acceptClosure} onRegions={recomputeRegions} onFill={fillRegion} onBaseMask={generateBaseMask} selectedRegionId={selectedRegionId} onSelectRegion={setSelectedRegionId} onExportFill={exportFill} hasDerivedFill={hasDerivedFill} />
        </section>
        <StatusPanel fileName={source.fileName} metadata={source.metadata} sha256={source.sha256} offline={offline} error={error} />
      </div>
    </main>
  );
}
