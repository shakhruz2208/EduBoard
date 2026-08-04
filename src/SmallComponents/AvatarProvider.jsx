import { createContext, useContext, useState } from "react"

const AvatarContext = createContext(null)

export const AvatarProvider = ({ children }) => {
  const [avatar, setAvatar] = useState(() => localStorage.getItem('avatar') || null)

  return (
    <AvatarContext.Provider value={{ avatar, setAvatar }}>
      {children}
    </AvatarContext.Provider>
  )
}

export const useAvatar = () => useContext(AvatarContext)