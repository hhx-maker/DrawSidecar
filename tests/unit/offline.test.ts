import { describe, expect, it, vi } from 'vitest';
import { getOfflineReadiness } from '../../src/services/offline';

describe('offline readiness', () => {
  it('does not report ready while the service worker is not controlling the page', async () => {
    vi.stubGlobal('navigator', { onLine: true, serviceWorker: { controller: null } });
    await expect(getOfflineReadiness()).resolves.toMatchObject({ controlled: false, cacheComplete: false, ready: false });
    vi.unstubAllGlobals();
  });

  it('does not report ready when a required cache entry is missing', async () => {
    vi.stubGlobal('navigator', { onLine: false, serviceWorker: { controller: {} } });
    vi.stubGlobal('caches', {
      keys: vi.fn().mockResolvedValue(['workbox-precache-v1']),
      open: vi.fn().mockResolvedValue({ match: vi.fn().mockResolvedValue(undefined) })
    });
    await expect(getOfflineReadiness()).resolves.toMatchObject({ controlled: true, cacheComplete: false, ready: false });
    vi.unstubAllGlobals();
  });
});
