import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'eduboard-theme'

// Resolve the initial theme: saved preference → light, else dark (default).
const initialTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(initialTheme)

  // Reflect the current theme on <html> so the CSS remap layer applies.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('light', theme === 'light')
    root.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch { /* storage unavailable — theme still works for the session */ }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isLight: theme === 'light' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
