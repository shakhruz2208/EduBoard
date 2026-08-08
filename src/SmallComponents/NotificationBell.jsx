import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MdOutlineNotifications } from "react-icons/md"
import { IoDocumentTextOutline, IoTimeOutline, IoCheckmarkCircleOutline } from "react-icons/io5"
import { useNotifications } from "../Providers/NotificationProvider"

const ICONS = {
  new: IoDocumentTextOutline,
  deadline: IoTimeOutline,
  grade: IoCheckmarkCircleOutline,
  submission: IoDocumentTextOutline
}

const timeAgo = (dateStr) => {
  const date = new Date(dateStr)
  if (isNaN(date)) return ""
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay}d ago`
}

const NotificationBell = () => {
  const { notifications, unreadCount, seenIds, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) markAllRead()
  }

  const handleItemClick = (link) => {
    setOpen(false)
    navigate(link)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        className="relative text-white cursor-pointer hover:scale-110 transition-transform"
        title="Notifications"
      >
        <MdOutlineNotifications className="text-2xl sm:text-3xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-[#0e1442] border border-indigo-900/60 rounded-2xl shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-indigo-900/50">
            <h3 className="text-white font-semibold text-sm">Notifications</h3>
          </div>

          {notifications.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">You're all caught up</p>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => {
                const Icon = ICONS[n.type] || IoDocumentTextOutline
                const isUnread = !seenIds.has(n.id)
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n.link)}
                    className={`flex items-start gap-3 px-4 py-3 text-left hover:bg-indigo-900/30 transition-colors border-b border-indigo-900/30 last:border-b-0 cursor-pointer ${isUnread ? "bg-indigo-900/20" : ""}`}
                  >
                    <Icon className="text-indigo-400 text-lg shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200 text-xs leading-snug">{n.message}</p>
                      <p className="text-slate-500 text-[10px] mt-1">{timeAgo(n.timestamp)}</p>
                    </div>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 mt-1.5" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell