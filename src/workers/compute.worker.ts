import type { WorkerRequest, WorkerResponse } from '../services/workerRpc';
import { rgbaToObstacleMask } from '../engine/preprocessing';
import { skeletonize } from '../engine/skeletonization';
import { detectGapCandidates } from '../engine/gapDetection';
import { labelOpenRegions } from '../engine/connectedComponents';
import { createBaseMask } from '../engine/baseMask';
import { createRegionFill, encodeColorLayer } from '../engine/smartFill';

self.onmessage = (event: MessageEvent<WorkerRequest<unknown>>) => {
  const request = event.data;
  try {
    const params = request.params as Record<string, unknown>;
    let data: unknown;
    if (request.toolId === 'ping') data = { ok: true };
    else if (request.toolId === 'preprocess') {
      const rgba = new Uint8ClampedArray(params.rgba as ArrayBuffer);
      data = { mask: rgbaToObstacleMask(rgba, params.width as number, params.height as number, params.options as { mode: 'transparent' | 'white-background' }) .buffer };
    } else if (request.toolId === 'skeletonize') {
      data = { skeleton: skeletonize(new Uint8Array(params.mask as ArrayBuffer), params.width as number, params.height as number).buffer };
    } else if (request.toolId === 'detect-gaps') {
      data = { candidates: detectGapCandidates(new Uint8Array(params.skeleton as ArrayBuffer), new Uint8Array(params.obstacle as ArrayBuffer), params.width as number, params.height as number, params.maxDistance as number) };
    } else if (request.toolId === 'regions') {
      const result = labelOpenRegions(new Uint8Array(params.obstacle as ArrayBuffer), params.width as number, params.height as number, true);
      data = { labels: result.labels.buffer, regions: result.regions, width: result.width, height: result.height };
    } else if (request.toolId === 'base-mask') {
      const result = createBaseMask(new Uint8Array(params.obstacle as ArrayBuffer), params.width as number, params.height as number);
      data = { mask: result.mask.buffer, warnings: result.warnings };
    } else if (request.toolId === 'fill') {
      const result = createRegionFill({ labels: new Int32Array(params.labels as ArrayBuffer), regions: params.regions as never[], width: params.width as number, height: params.height as number }, params.regionId as number, false);
      const rgba = encodeColorLayer(result.mask, params.width as number, params.height as number, params.color as [number, number, number, number]);
      data = { mask: result.mask.buffer, rgba: rgba.buffer, warnings: result.warnings };
    } else data = undefined;
    const response: WorkerResponse<unknown> = data === undefined
      ? { jobId: request.jobId, revision: request.revision, toolId: request.toolId, ok: false, error: '未知的 Phase 2 Worker 工具。' }
      : { jobId: request.jobId, revision: request.revision, toolId: request.toolId, ok: true, data };
    self.postMessage(response);
  } catch (error) {
    self.postMessage({ jobId: request.jobId, revision: request.revision, toolId: request.toolId, ok: false, error: error instanceof Error ? error.message : 'Worker 任务失败。' } satisfies WorkerResponse<unknown>);
  }
};
