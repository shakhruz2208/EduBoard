import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import api, { BASE_URL } from "../api"
import { studentCode } from "../utils/studentCode"
import { toast } from "react-toastify"

const AuthContext = createContext(null)

// profile_pic from the backend might be a full URL or a relative path —
// handle both so <img src> always gets something usable.
export const resolveAvatarUrl = (profilePic) => {
  if (!profilePic) return null
  if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) return profilePic
  return `${BASE_URL}${profilePic.startsWith('/') ? '' : '/'}${profilePic}`
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuth, setIsAuth] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // Pulls the current user's profile. On cold-start, retries with a
  // progressive delay (10s/15s/20s) instead of immediately clearing the token.
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setIsAuth(false)
      setAuthLoading(false)
      return
    }
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await api.get('/me')
        const userData = res.data
        // Older accounts have no student_code: derive a deterministic 5-digit
        // code so profile and teacher list always show the same number.
        if (!userData.student_code && !userData.teacher) {
          userData.student_code = studentCode(userData)
        }
        setUser(userData)
        setIsAuth(true)
        break
      } catch (error) {
        const isNetworkError = !error.response || error.code === 'ECONNABORTED'
        if (isNetworkError && attempt < 3) {
          // Server probably cold-starting — wait and retry silently
          const delay = [10000, 15000, 20000][attempt] || 20000
          await new Promise((r) => setTimeout(r, delay))
          continue
        }
        // Only clear token on explicit auth failure, not network errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('access_token')
          setUser(null)
          setIsAuth(false)
        }
        // On network error, keep the token but mark as not authed yet
        // so user sees the login screen (but can retry)
        break
      }
    }
    setAuthLoading(false)
  }, [])

  // Bootstrap once on mount. fetchMe is stable (empty deps) so this can't
  // re-run; StrictMode's double-mount in dev is fine — the second call just
  // refetches the same profile.
  useEffect(() => { fetchMe() }, [fetchMe])

  const extractErrorMessage = (error, fallback) => {
    const detail = error?.response?.data?.detail
    if (Array.isArray(detail)) return detail[0]?.msg || fallback
    if (typeof detail === 'string') return detail
    return fallback
  }

  const isDuplicateEmailError = (error) =>
    error?.response?.status === 400 || error?.response?.status === 409

  const login = useCallback(async (email, password, retries = 3, onProgress) => {
    const totalAttempts = retries + 1
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (onProgress) onProgress({ attempt: attempt + 1, total: totalAttempts, phase: 'connecting' })
        const res = await api.post('/login', { email, password })
        if (onProgress) onProgress({ attempt: attempt + 1, total: totalAttempts, phase: 'success' })
        localStorage.setItem('access_token', res.data.access_token)
        await fetchMe()
        return true
      } catch (error) {
        const isNetworkError = !error.response || error.code === 'ECONNABORTED'
        // 5xx from Render can be transient (free tier restarts / cold starts) —
        // retry those the same way as network errors.
        const isServerError = error?.response?.status >= 500
        if ((isNetworkError || isServerError) && attempt < retries) {
          if (onProgress) onProgress({ attempt: attempt + 1, total: totalAttempts, phase: 'retrying' })
          // Progressive delay: 10s, 12s, 15s — gives server more time to wake
          const delay = [10000, 12000, 15000][attempt] || 15000
          await new Promise((r) => setTimeout(r, delay))
          continue
        }
        if (error?.response?.status === 401 || error?.response?.status === 400) {
          toast.error("Error: Incorrect email or password, or account does not exist!")
        } else if (isNetworkError) {
          toast.error("Error: Server is still waking up. Please try again in a moment.")
        } else if (isServerError) {
          toast.error("Error: Server error — the service may be restarting. Please try again in a minute.")
        } else {
          toast.error("Error: Login failed. Please try again.")
        }
        return false
      }
    }
    return false
  }, [fetchMe])

  // One-off dropped connections (ERR_CONNECTION_CLOSED / net error) and
  // transient 5xx (Render cold starts) happen against Render — retry a couple
  // of times before giving up, same as login. A duplicate-email 409 after a
  // retried register is already handled with a clear message upstream.
  const postWithRetry = async (url, payload, retries = 2) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await api.post(url, payload)
      } catch (error) {
        const isNetworkError = !error.response || error.code === 'ECONNABORTED'
        const isServerError = error?.response?.status >= 500
        if ((isNetworkError || isServerError) && attempt < retries) {
          await new Promise((r) => setTimeout(r, 5000))
          continue
        }
        throw error
      }
    }
  }

  const registerStudent = useCallback(async (full_name, email, password) => {
    try {
      await postWithRetry('/register', { full_name, email, password })
      return await login(email, password)
    } catch (error) {
      console.error('Register error:', error?.response?.data || error.message)
      if (error?.response?.status === 409) {
        // Email already exists — never auto-login here. The user must go
        // through the login page explicitly, otherwise re-registering an
        // existing account silently signs them in.
        toast.error("Error: This email is already registered. Please log in instead.")
      } else if (!error.response) {
        toast.error("Error: Could not reach the server. Check your connection and try again.")
      } else if (error?.response?.status >= 500) {
        toast.error("Error: Server error — the service may be restarting. Please try again in a minute.")
      } else {
        toast.error(extractErrorMessage(error, "Error: Registration failed. Please try again."))
      }
      return false
    }
  }, [login])

  const registerTeacher = useCallback(async (full_name, email, password, teacher_secret_code) => {
    try {
      await postWithRetry('/register-teacher', { full_name, email, password, teacher_secret_code })
      return await login(email, password)
    } catch (error) {
      if (error?.response?.status === 409) {
        // Same rule as student register: duplicate email must never sign the
        // user in — they already have an account and should log in instead.
        toast.error("Error: This email is already registered. Please log in instead.")
      } else if (!error.response) {
        toast.error("Error: Could not reach the server. Check your connection and try again.")
      } else if (error?.response?.status >= 500) {
        toast.error("Error: Server error — the service may be restarting. Please try again in a minute.")
      } else {
        toast.error(extractErrorMessage(error, "Error: Registration failed. Check your secret code and try again."))
      }
      return false
    }
  }, [login])

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [profileUpdating, setProfileUpdating] = useState(false)
  const [passwordUpdating, setPasswordUpdating] = useState(false)

  const uploadAvatar = useCallback(async (file) => {
    if (!file) return false
    const formData = new FormData()
    formData.append('file', file)

    try {
      setAvatarUploading(true)
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUser(res.data)
      toast.success('Profile picture updated')
      return true
    } catch {
      toast.error('Error uploading profile picture')
      return false
    } finally {
      setAvatarUploading(false)
    }
  }, [])

  const updateProfile = useCallback(async (full_name, email) => {
    try {
      setProfileUpdating(true)
      const res = await api.patch('/users/me', { full_name, email })
      setUser(res.data)
      toast.success('Profile updated')
      return true
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        toast.error("Error: This email is already in use.")
      } else {
        toast.error(extractErrorMessage(error, "Error updating profile"))
      }
      return false
    } finally {
      setProfileUpdating(false)
    }
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setPasswordUpdating(true)
      // Backend expects current_password; older deployments used old_password —
      // send both so the request works against either version.
      const res = await api.post('/users/me/password', {
        current_password: currentPassword,
        old_password: currentPassword,
        new_password: newPassword
      })
      setUser(res.data)
      toast.success('Password changed successfully')
      return true
    } catch (error) {
      if (error?.response?.status === 400 || error?.response?.status === 401) {
        toast.error("Error: Current password is incorrect.")
      } else {
        toast.error(extractErrorMessage(error, "Error changing password"))
      }
      return false
    } finally {
      setPasswordUpdating(false)
    }
  }, [])

  const deleteAccount = useCallback(async (password) => {
    try {
      await axios.post(`${BASE_URL}/login`, { email: user?.email, password })
      await api.delete('/users/me')
      localStorage.removeItem('access_token')
      setUser(null)
      setIsAuth(false)
      toast.success('Account deleted')
      return true
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 400) {
        toast.error('Incorrect password')
      } else {
        toast.error('Error deleting account')
      }
      return false
    }
  }, [user])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setUser(null)
    setIsAuth(false)
  }, [])

  // Memoized context value — avoids re-rendering every consumer whenever an
  // unrelated local state (e.g. avatarUploading) toggles.
  const value = useMemo(() => ({
    user, isAuth, authLoading, login, registerStudent, registerTeacher, logout,
    refreshUser: fetchMe, uploadAvatar, avatarUploading,
    updateProfile, profileUpdating,
    changePassword, passwordUpdating, deleteAccount
  }), [user, isAuth, authLoading, login, registerStudent, registerTeacher, logout, fetchMe, uploadAvatar, avatarUploading, updateProfile, profileUpdating, changePassword, passwordUpdating, deleteAccount])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
