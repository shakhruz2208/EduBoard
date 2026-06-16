// IconsBg.jsx
import { useEffect, useRef } from 'react'
import {
  IconTerminal2, IconBrandGit, IconBug, IconFolderCode,
  IconCode, IconDatabase, IconApi, IconGitBranch,
  IconFileCode, IconCpu, IconDeviceLaptop, IconBrackets,

} from '@tabler/icons-react'
import { createRoot } from 'react-dom/client'

const iconComponents = [
  IconTerminal2, IconBrandGit, IconBug, IconFolderCode,
  IconCode, IconDatabase, IconApi, IconGitBranch,
  IconFileCode, IconCpu, IconDeviceLaptop, IconBrackets ,
]

const IconsBg = () => {
  const containerRef = useRef()

  useEffect(() => {
    const container = containerRef.current
    const items = []

    for (let i = 0; i < 22; i++) {
      const wrapper = document.createElement('div')
      const size = 20 + Math.random() * 20
      const opacity = 0.08 + Math.random() * 0.15
      const color = Math.random() > 0.5 ? 'rgba(167,139,250,' : 'rgba(99,102,241,'
      wrapper.style.cssText = `
        position: absolute;
        color: ${color + opacity});
        pointer-events: none;
        user-select: none;
      `
      container.appendChild(wrapper)

      const Icon = iconComponents[Math.floor(Math.random() * iconComponents.length)]
      const root = createRoot(wrapper)
      root.render(<Icon size={size} />)

      items.push({
        el: wrapper,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.4,
      })
    }

    let animId
    const animate = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      for (const s of items) {
        s.x += s.vx; s.y += s.vy; s.rotation += s.rotSpeed
        if (s.x < -60) s.x = w + 60
        if (s.x > w + 60) s.x = -60
        if (s.y < -60) s.y = h + 60
        if (s.y > h + 60) s.y = -60
        s.el.style.left = s.x + 'px'
        s.el.style.top = s.y + 'px'
        s.el.style.transform = `rotate(${s.rotation}deg)`
      }
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      items.forEach(s => s.el.remove())
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        background: '#0D1B4B', zIndex: 0,
        overflow: 'hidden', pointerEvents: 'none'
      }}
    />
  )
}

export default IconsBg