import { registerSW } from 'virtual:pwa-register';

export function registerPwa(onUpdateReady: () => void, onRegistered: () => void): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) onRegistered();
    },
    onNeedRefresh() {
      onUpdateReady();
    }
  });
}
