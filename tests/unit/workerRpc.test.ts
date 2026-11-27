import { describe, expect, it } from 'vitest';
import { WorkerClient } from '../../src/services/workerRpc';

class FakeWorker {
  private listener: ((event: MessageEvent) => void) | undefined;
  postMessage(request: { jobId: string; revision: number; toolId: string }) {
    queueMicrotask(() => this.listener?.({ data: { ...request, ok: true, data: { ok: true } } } as MessageEvent));
  }
  addEventListener(_type: string, listener: EventListenerOrEventListenerObject) { this.listener = listener as (event: MessageEvent) => void; }
  removeEventListener() { this.listener = undefined; }
  terminate() { this.listener = undefined; }
}

describe('WorkerClient', () => {
  it('resolves a matching response', async () => {
    const client = new WorkerClient(new FakeWorker());
    await expect(client.run({ jobId: '1', revision: 0, toolId: 'ping', params: {} })).resolves.toEqual({ ok: true });
    client.dispose();
  });
});
