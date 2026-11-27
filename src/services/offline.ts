export type NetworkState = 'online' | 'offline';

export interface OfflineReadiness {
  network: NetworkState;
  controlled: boolean;
  cacheComplete: boolean;
  ready: boolean;
}

export function getNetworkState(): NetworkState {
  return navigator.onLine ? 'online' : 'offline';
}

function requiredResourceUrls(): string[] {
  const currentUrl = new URL(location.href);
  currentUrl.search = '';
  currentUrl.hash = '';
  const urls = new Set<string>([currentUrl.href]);
  document.querySelectorAll<HTMLElement>('script[src],link[href]').forEach((element) => {
    const value = element instanceof HTMLScriptElement ? element.src : (element as HTMLLinkElement).href;
    if (value) urls.add(value);
  });
  return [...urls];
}

export async function getOfflineReadiness(): Promise<OfflineReadiness> {
  const controlled = Boolean(navigator.serviceWorker?.controller);
  let cacheComplete = false;
  if (controlled && typeof caches !== 'undefined') {
    const urls = requiredResourceUrls();
    const cacheNames = await caches.keys();
    const matches = await Promise.all(urls.map(async (url) => {
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        if (await cache.match(url)) return true;
      }
      return false;
    }));
    cacheComplete = matches.every(Boolean);
  }
  return { network: getNetworkState(), controlled, cacheComplete, ready: controlled && cacheComplete };
}
