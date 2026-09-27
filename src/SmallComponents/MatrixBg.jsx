import { useEffect, useRef } from 'react'
import { useTheme } from '../Providers/ThemeProvider'

// Canvas "digital rain" background used on the auth screens.
// Colors are theme-aware: green-on-navy in dark mode, indigo-on-white in light.
// The canvas element itself already adapts via the --c-icons-bg CSS var;
// only the drawn pixels (trail fade + glyph colors) need JS-side palettes.
const PALETTES = {
  dark: {
    fade: 'rgba(13, 27, 75, 0.05)',
    bright: '#fff',
    normal: '#7ee8a2',
    dim: 'rgba(126,232,162,0.3)',
  },
  light: {
    // Trail fades toward the light backdrop and glyphs stay soft indigo so
    // they read as texture, not competing content, on the light page.
    fade: 'rgba(244, 246, 251, 0.05)',
    bright: '#4f46e5',
    normal: 'rgba(99,102,241,0.55)',
    dim: 'rgba(99,102,241,0.18)',
  },
}

const MatrixBg = () => {
  const canvasRef = useRef()
  // Theme is read through a ref synced in an effect (never during render) so
  // switching themes doesn't restart the animation interval.
  const themeRef = useRef('dark')
  const { theme } = useTheme()
  useEffect(() => {
    themeRef.current = theme === 'light' ? 'light' : 'dark'
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const chars = '01{}[]()<>/\\;:=+-*&^%$#@!'
    const fontSize = 14
    const cols = Math.floor(canvas.width / fontSize)
    const drops = Array(cols).fill(1).map(() => Math.random() * -50)

    const draw = () => {
      const palette = PALETTES[themeRef.current] || PALETTES.dark
      ctx.fillStyle = palette.fade
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < cols; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const b = Math.random()
        ctx.fillStyle = b > 0.97 ? palette.bright : b > 0.85 ? palette.normal : palette.dim
        ctx.font = fontSize + 'px monospace'
        ctx.fillText(char, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }

    // Pause the animation while the tab is hidden — a 50ms interval burning
    // CPU in a background tab wastes battery and slows the foreground app
    // when the user returns.
    let interval = null
    const start = () => { if (interval == null) interval = setInterval(draw, 50) }
    const stop = () => { clearInterval(interval); interval = null }

    const handleVisibility = () => {
      if (document.hidden) stop()
      else start()
    }
    start()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, background: 'var(--c-icons-bg, #0D1B4B)' }}
    />
  )
}

export default MatrixBg