import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 开发/预览时把接口转发到 Express（默认 3000，可在 frontend/.env.development 里设 VITE_API_PROXY）
const proxyTarget = (env) =>
  (env.VITE_API_PROXY || 'http://127.0.0.1:3000').replace(/\/$/, '')

const createProxy = (target) => ({
  '/api': {
    target,
    changeOrigin: true,
    ws: true,
  },
  '/users': {
    target,
    changeOrigin: true,
  },
  // 车辆图片由 Express 的 /cars/photos 提供
  '/cars': {
    target,
    changeOrigin: true,
  },
})

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const target = proxyTarget(env)

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: createProxy(target),
    },
    // npm run build && npm run preview 时同样需要代理，否则 /api 会 404
    preview: {
      port: 4173,
      proxy: createProxy(target),
    },
  }
})
