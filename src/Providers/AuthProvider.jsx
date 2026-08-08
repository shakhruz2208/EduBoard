import { createContext, useContext, useState, useEffect, useCallback } from "react"
import api, { BASE_URL } from "../api"
import { toast } from "react-toastify"

const AuthContext = createContext(null)


export const resolveAvatarUrl = (profilePic) => {
  if (!profilePic) return null
  if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) return profilePic
  return `${BASE_URL}${profilePic.startsWith('/') ? '' : '/'}${profilePic}`
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)       // { id, full_name, email, created_at, teacher }
  const [isAuth, setIsAuth] = useState(false)
  const [authLoading, setAuthLoading] = useState(true) // true while we check an existing token on first load

  
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setIsAuth(false)
      setAuthLoading(false)
      return
    }
    try {
      const res = await api.get('/me')
      setUser(res.data)
      setIsAuth(true)
    } catch (error) {
      // Token invalid/expired
      localStorage.removeItem('access_token')
      setUser(null)
      setIsAuth(false)
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const extractErrorMessage = (error, fallback) => {
    const detail = error?.response?.data?.detail
    if (Array.isArray(detail)) return detail[0]?.msg || fallback
    if (typeof detail === 'string') return detail
    return fallback
  }

  const isDuplicateEmailError = (error) =>
    error?.response?.status === 400 || error?.response?.status === 409

  const login = async (email, password) => {
    try {
      const res = await api.post('/login', { email, password })
      localStorage.setItem('access_token', res.data.access_token)
      await fetchMe()
      return true
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 400) {
        // Server actually responded and rejected the credentials
        toast.error("Error: Incorrect email or password, or account does not exist!")
      } else if (!error?.response) {
        // No response at all — most likely the free-tier backend is cold-starting
        toast.error("Error: Couldn't reach the server — it may be waking up. Please try again in a few seconds.")
      } else {
        toast.error("Error: Login failed. Please try again.")
      }
      return false
    }
  }

  const registerStudent = async (full_name, email, password) => {
    try {
      await api.post('/register', { full_name, email, password })
      return await login(email, password)
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        toast.error("Error: This email is already registered. Please log in instead.")
      } else {
        toast.error(extractErrorMessage(error, "Error: Registration failed. Please try again."))
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
    } catch (error) {
      toast.error('Error uploading profile picture')
      return false
    } finally {
      setAvatarUploading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    setIsAuth(false)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuth, authLoading, login, registerStudent, registerTeacher, logout, refreshUser: fetchMe, uploadAvatar, avatarUploading }}
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