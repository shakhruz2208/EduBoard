// IconsBg.jsx — lightweight floating-icon background
// Uses CSS keyframe animations instead of createRoot + rAF for performance.
import { useMemo } from 'react'
import {
  IconTerminal2, IconBrandGit, IconBug, IconFolderCode,
  IconCode, IconDatabase, IconApi, IconGitBranch,
  IconFileCode, IconCpu, IconDeviceLaptop, IconBrackets,
  IconBrandReact,
} from '@tabler/icons-react'

const iconComponents = [
  IconTerminal2, IconBrandGit, IconBug, IconFolderCode,
  IconCode, IconDatabase, IconApi, IconGitBranch,
  IconFileCode, IconCpu, IconDeviceLaptop, IconBrackets,
  IconBrandReact,
]

// Pre-generate positions once so they stay stable across re-renders
const generateItems = (count) => {
  const items = []
  for (let i = 0; i < count; i++) {
    items.push({
      Icon: iconComponents[i % iconComponents.length],
      size: 20 + (((i * 7 + 3) % 13) / 13) * 20,
      opacity: 0.08 + (((i * 11 + 5) % 17) / 17) * 0.15,
      left: `${((i * 13 + 7) % 100)}%`,
      top: `${((i * 17 + 11) % 100)}%`,
      animDuration: `${40 + ((i * 23) % 30)}s`,
      animDelay: `${-((i * 7) % 20)}s`,
      color: i % 2 === 0 ? 'rgba(167,139,250,' : 'rgba(99,102,241,',
    })
  }
  return items
}

const ITEMS = generateItems(22)

const IconsBg = () => {
  const renderedItems = useMemo(() => ITEMS, [])

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        background: '#0D1B4B', zIndex: 0,
        overflow: 'hidden', pointerEvents: 'none',
      }}
    >
      {renderedItems.map((item, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            color: `${item.color}${item.opacity})`,
            left: item.left,
            top: item.top,
            pointerEvents: 'none',
            userSelect: 'none',
            animation: `iconsFloat ${item.animDuration} linear ${item.animDelay} infinite`,
          }}
        >
          <item.Icon size={item.size} />
        </div>
      ))}

      <style>{`
        @keyframes iconsFloat {
          0%   { transform: translate(0, 0) rotate(0deg); }
          25%  { transform: translate(30px, -40px) rotate(90deg); }
          50%  { transform: translate(-20px, -80px) rotate(180deg); }
          75%  { transform: translate(40px, -40px) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default IconsBg
