import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { defineConfig, loadEnv } from 'vite';

const quasarSassVariables = fileURLToPath(
  new URL('./src/styles/quasar-variables.sass', import.meta.url),
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devProxyTarget =
    env.VITE_DEV_PROXY_TARGET?.trim() || 'http://localhost:8080';

  return {
    plugins: [
      vue({
        template: { transformAssetUrls },
      }),
      quasar({
        sassVariables: quasarSassVariables,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 9000,
      proxy: {
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 9000,
    },
  };
});
