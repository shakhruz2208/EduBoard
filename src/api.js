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
        const newToken = refreshRes.data?.access_token
        if (!newToken) throw new Error('Refresh response did not contain access_token')
        localStorage.setItem('access_token', newToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        const refreshStatus = refreshError.response?.status
        const isColdStart = !refreshError.response
          || refreshError.code === 'ECONNABORTED'
          || [502, 503, 504].includes(refreshStatus)
        // The app itself answered and refused/failed the refresh:
        // 401/403 = invalid refresh cookie, 500 = broken refresh on the server.
        // In both cases the session is unrecoverable — clear token and re-login.
        // On pure network errors or gateway errors (Render cold start) keep the
        // session and let the user retry once the server is up.
        if (!isColdStart) {
          localStorage.removeItem('access_token')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
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
