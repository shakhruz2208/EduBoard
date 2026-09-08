import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import axios from "axios"
import api, { BASE_URL } from "../api"
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
  const hasBootstrapped = useRef(false)

  // Pulls the current user's profile. On cold-start, retries once after a delay
  // instead of immediately clearing the token.
  const fetchMe = useCallback(async (retryCount = 0) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setIsAuth(false)
      setAuthLoading(false)
      return
    }
    try {
      const res = await api.get('/me')
      const userData = res.data
      // If backend doesn't have student_code, use localStorage fallback
      if (!userData.student_code && !userData.teacher) {
        const storageKey = `student_code_${userData.id}`
        let code = localStorage.getItem(storageKey)
        if (!code) {
          code = String(Math.floor(10000 + Math.random() * 90000))
          localStorage.setItem(storageKey, code)
        }
        userData.student_code = code
      }
      setUser(userData)
      setIsAuth(true)
    } catch (error) {
      const isNetworkError = !error.response || error.code === 'ECONNABORTED'
      if (isNetworkError && retryCount < 3) {
        // Server probably cold-starting — wait and retry silently
        // Progressive delay: 10s, 15s, 20s
        const delay = [10000, 15000, 20000][retryCount] || 20000
        await new Promise((r) => setTimeout(r, delay))
        return fetchMe(retryCount + 1)
      }
      // Only clear token on explicit auth failure, not network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('access_token')
        setUser(null)
        setIsAuth(false)
      }
      // On network error, keep the token but mark as not authed yet
      // so user sees the login screen (but can retry)
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasBootstrapped.current) {
      hasBootstrapped.current = true
      fetchMe()
    }
  }, [fetchMe])

  const extractErrorMessage = (error, fallback) => {
    const detail = error?.response?.data?.detail
    if (Array.isArray(detail)) return detail[0]?.msg || fallback
    if (typeof detail === 'string') return detail
    return fallback
  }

  const isDuplicateEmailError = (error) =>
    error?.response?.status === 400 || error?.response?.status === 409

  const login = async (email, password, retries = 3, onProgress) => {
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
        if (isNetworkError && attempt < retries) {
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
        } else {
          toast.error("Error: Login failed. Please try again.")
        }
        return false
      }
    }
    return false
  }

  // Format backend user ID as 5 digits with leading zeros
  const formatStudentId = (id) => String(id).padStart(5, '0')

  const registerStudent = async (full_name, email, password) => {
    try {
      await api.post('/register', { full_name, email, password })
      return await login(email, password)
    } catch (error) {
      console.error('Register error:', error?.response?.data || error.message)
      if (isDuplicateEmailError(error)) {
        toast.error("Error: This email is already registered. Please log in instead.")
      } else {
        const detail = error?.response?.data?.detail
        let msg = 'Registration failed'
        if (typeof detail === 'string') msg = detail
        else if (Array.isArray(detail)) msg = detail.map(d => d.msg).join(', ')
        else if (detail) msg = JSON.stringify(detail)
        toast.error(msg || 'Registration failed. Please try again.')
      }
      return false
    }
  }

  const registerTeacher = async (full_name, email, password, teacher_secret_code) => {
    try {
      await api.post('/register-teacher', { full_name, email, password, teacher_secret_code })
      return await login(email, password)
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        toast.error("Error: This email is already registered. Please log in instead.")
      } else {
        toast.error(extractErrorMessage(error, "Error: Registration failed. Check your secret code and try again."))
      }
      return false
    }
  }

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [profileUpdating, setProfileUpdating] = useState(false)
  const [passwordUpdating, setPasswordUpdating] = useState(false)

  const uploadAvatar = async (file) => {
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
  }

  const updateProfile = async (full_name, email) => {
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
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setPasswordUpdating(true)
      const res = await api.post('/users/me/password', {
        current_password: currentPassword,
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
  }

  const deleteAccount = async (password) => {
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
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    setIsAuth(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user, isAuth, authLoading, login, registerStudent, registerTeacher, logout,
        refreshUser: fetchMe, uploadAvatar, avatarUploading,
        updateProfile, profileUpdating,
        changePassword, passwordUpdating, deleteAccount
      }}
    >
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
