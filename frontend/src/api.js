import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    const suppressError = Boolean(error.config?.suppressError)
    // 优先取后端返回的 { message: '...' } 或 { error: '...' }
    const msg = error.response?.data?.message || error.response?.data?.error || error.message || '请求失败'
    if (!suppressError) {
      ElMessage.error(msg)
    }
    // 保留完整错误对象，让调用方可以访问 error.response.data
    const err = new Error(msg)
    err._data = error.response?.data
    return Promise.reject(err)
  }
)

export default api

export const uploadCarPhoto = (carId, file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return api.post(`/admin/cars/${carId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })
}
