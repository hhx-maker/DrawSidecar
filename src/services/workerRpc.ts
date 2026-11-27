export interface WorkerRequest<P> {
  jobId: string;
  revision: number;
  toolId: string;
  params: P;
}

export interface WorkerResponse<T> {
  jobId: string;
  revision: number;
  toolId: string;
  ok: boolean;
  data?: T;
  error?: string;
}

export class WorkerClient {
  private readonly pending = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

  constructor(private readonly worker: Pick<Worker, 'postMessage' | 'addEventListener' | 'removeEventListener' | 'terminate'>) {
    this.worker.addEventListener('message', this.handleMessage);
  }

  run<T, P>(request: WorkerRequest<P>): Promise<T> {
    if (this.pending.has(request.jobId)) return Promise.reject(new Error('重复的 Worker jobId。'));
    return new Promise<T>((resolve, reject) => {
      this.pending.set(request.jobId, { resolve: resolve as (value: unknown) => void, reject });
      this.worker.postMessage(request);
    });
  }

  cancel(jobId: string): void {
    const pending = this.pending.get(jobId);
    if (pending) {
      pending.reject(new Error('Worker 任务已取消。'));
      this.pending.delete(jobId);
    }
  }

  dispose(): void {
    for (const [jobId, pending] of this.pending) {
      pending.reject(new Error('Worker 已释放。'));
      this.pending.delete(jobId);
    }
    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.terminate();
  }

  private readonly handleMessage = (event: MessageEvent<WorkerResponse<unknown>>) => {
    const pending = this.pending.get(event.data.jobId);
    if (!pending) return;
    this.pending.delete(event.data.jobId);
    if (event.data.ok) pending.resolve(event.data.data);
    else pending.reject(new Error(event.data.error ?? 'Worker 任务失败。'));
  };
}

export function createComputeWorker(): WorkerClient {
  const worker = new Worker(new URL('../workers/compute.worker.ts', import.meta.url), { type: 'module' });
  return new WorkerClient(worker);
}
