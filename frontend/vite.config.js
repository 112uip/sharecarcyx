import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 用户证件照等静态文件由 Express 提供，开发时需转发
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
