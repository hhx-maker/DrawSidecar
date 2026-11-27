import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const basePath = env.VITE_BASE_PATH || '/';

  return {
    base: basePath,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icons/icon.svg'],
        manifest: {
          name: 'DrawSidecar',
          short_name: 'DrawSidecar',
          description: '离线优先的绘画辅助侧车',
          start_url: basePath,
          scope: basePath,
          display: 'standalone',
          background_color: '#f6f3ee',
          theme_color: '#1f2933',
          icons: [{ src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: false
        }
      })
    ],
    server: { host: '127.0.0.1' },
    preview: { host: '127.0.0.1' }
  };
});
