import type { GapCandidate } from '../engine/gapDetection';
import type { RegionInfo } from '../engine/connectedComponents';

interface Phase2PanelProps {
  candidates: GapCandidate[];
  regions: RegionInfo[];
  busy: boolean;
  notice: string | null;
  onAnalyze: () => void;
  onAcceptClosure: () => void;
  onRegions: () => void;
  onFill: () => void;
  onBaseMask: () => void;
  selectedRegionId: number | null;
  onSelectRegion: (id: number) => void;
  onExportFill: () => void;
  hasDerivedFill: boolean;
}

export function Phase2Panel({ candidates, regions, busy, notice, onAnalyze, onAcceptClosure, onRegions, onFill, onBaseMask, selectedRegionId, onSelectRegion, onExportFill, hasDerivedFill }: Phase2PanelProps) {
  return (
    <section className="phase2-panel" aria-label="Phase 2 视觉辅助">
      <div className="phase2-heading">Phase 2 视觉辅助</div>
      <div className="phase2-actions">
        <button type="button" onClick={onAnalyze} disabled={busy}>分析缺口</button>
        <button type="button" onClick={onAcceptClosure} disabled={busy || candidates.length === 0}>接受虚拟闭合</button>
        <button type="button" onClick={onRegions} disabled={busy}>重算区域</button>
        <button type="button" onClick={onFill} disabled={busy || selectedRegionId === null}>填充选中区域</button>
        <button type="button" onClick={onExportFill} disabled={!hasDerivedFill}>导出填色层</button>
        <button type="button" onClick={onBaseMask} disabled={busy}>生成整体底色 Mask</button>
      </div>
      <p className="phase2-summary">候选缺口：{candidates.length}　区域：{regions.length}</p>
      {notice && <p className="phase2-notice" role="status">{notice}</p>}
      {candidates.slice(0, 3).map((candidate) => <p key={candidate.id} className="phase2-candidate">{candidate.id} · 启发式分数 {candidate.score.toFixed(2)}</p>)}
      {regions.filter((region) => !region.isBackground).slice(0, 8).map((region) => <button key={region.id} type="button" className={region.id === selectedRegionId ? 'phase2-region selected' : 'phase2-region'} onClick={() => onSelectRegion(region.id)}>区域 {region.id} · {region.area} px</button>)}
      <p className="phase2-note">候选分数不是概率。虚拟闭合和大面积填充需要用户主动点击确认。</p>
    </section>
  );
}
