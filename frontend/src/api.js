import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zemerp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/login')) {
      localStorage.removeItem('zemerp_token')
      localStorage.removeItem('zemerp_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const getErrorMessage = (error, fallback = 'เกิดข้อผิดพลาด') => {
  const data = error?.response?.data
  if (typeof data?.message === 'string') return data.message
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first)) return first[0]
    return first
  }
  return error?.message || fallback
}

export default api
