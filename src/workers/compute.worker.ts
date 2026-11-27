import type { WorkerRequest, WorkerResponse } from '../services/workerRpc';

self.onmessage = (event: MessageEvent<WorkerRequest<unknown>>) => {
  const request = event.data;
  const response: WorkerResponse<unknown> = request.toolId === 'ping'
    ? { jobId: request.jobId, revision: request.revision, toolId: request.toolId, ok: true, data: { ok: true } }
    : { jobId: request.jobId, revision: request.revision, toolId: request.toolId, ok: false, error: 'Phase 1 尚未实现该 Worker 工具。' };
  self.postMessage(response);
};
