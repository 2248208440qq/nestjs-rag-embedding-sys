import { defineConfig } from '@vben/vite-config';

import ElementPlus from 'unplugin-element-plus/vite';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
      ],
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            // 代理到真实后端服务（NestJS，端口 3000，全局前缀 /api）
            target: 'http://localhost:3000',
            ws: true,
          },
        },
      },
    },
  };
});
