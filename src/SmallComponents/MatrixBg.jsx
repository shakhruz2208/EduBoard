import { useEffect, useRef } from 'react'

const MatrixBg = () => {
  const canvasRef = useRef()

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
      ctx.fillStyle = 'rgba(13, 27, 75, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < cols; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const b = Math.random()
        ctx.fillStyle = b > 0.97 ? '#fff' : b > 0.85 ? '#7ee8a2' : 'rgba(126,232,162,0.3)'
        ctx.font = fontSize + 'px monospace'
        ctx.fillText(char, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }

    const interval = setInterval(draw, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, background: '#0D1B4B' }}
    />
  )
}

export default MatrixBg