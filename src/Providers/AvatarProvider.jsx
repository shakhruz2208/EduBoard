import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthProvider"

const AvatarContext = createContext(null)

export const AvatarProvider = ({ children }) => {
  const { user } = useAuth()
  const [avatar, setAvatarState] = useState(null)

  const storageKey = user ? `avatar:${user.id}` : null

  useEffect(() => {
    if (!storageKey) {
      setAvatarState(null)
      return
    }
    setAvatarState(localStorage.getItem(storageKey) || null)
  }, [storageKey])

  const setAvatar = (value) => {
    setAvatarState(value)
    if (!storageKey) return
    if (value) {
      localStorage.setItem(storageKey, value)
    } else {
      localStorage.removeItem(storageKey)
    }
  }

  return (
    <AvatarContext.Provider value={{ avatar, setAvatar }}>
      {children}
    </AvatarContext.Provider>
  )
}

export const useAvatar = () => useContext(AvatarContext)