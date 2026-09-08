import axios from 'axios'

const BASE_URL = 'https://api-4hjf.onrender.com'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 120s for Render cold-start backend
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Timeout / network error — server may be waking up, don't redirect
    if (error.code === 'ECONNABORTED' || !error.response) {
      return Promise.reject(error)
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retried &&
      originalRequest.url !== '/refresh' &&
      originalRequest.url !== '/login' &&
      originalRequest.url !== '/me'
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retried = true
      isRefreshing = true

      try {
        const refreshRes = await axios.post(`${BASE_URL}/refresh`, {}, {
          withCredentials: true,
          timeout: 90000,
        })
        const newToken = refreshRes.data.access_token
        localStorage.setItem('access_token', newToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        // Only clear token and redirect if the refresh endpoint explicitly rejected us
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          localStorage.removeItem('access_token')
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export { BASE_URL }
export default api
