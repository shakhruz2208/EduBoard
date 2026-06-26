// context/AvatarContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AvatarContext = createContext()

export const AvatarProvider = ({ children }) => {
  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('avatar') || null
  })

  useEffect(() => {
    if (avatar) {
      localStorage.setItem('avatar', avatar)
    }
  }, [avatar])

  return (
    <AvatarContext.Provider value={{ avatar, setAvatar }}>
      {children}
    </AvatarContext.Provider>
  )
}

export const useAvatar = () => useContext(AvatarContext)