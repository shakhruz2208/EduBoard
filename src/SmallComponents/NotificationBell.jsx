import { useState, useRef, useEffect } from "react"
import { MdOutlineNotifications } from "react-icons/md"
import { IoDocumentTextOutline, IoTimeOutline, IoCheckmarkCircleOutline, IoTrashOutline } from "react-icons/io5"
import { useNotifications } from "../Providers/NotificationProvider"
import { useLanguage } from "../Providers/LanguageProvider"

const ICONS = {
  assignment: IoDocumentTextOutline,
  deadline: IoTimeOutline,
  grade: IoCheckmarkCircleOutline
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
  const { notifications, unreadCount, markAllRead, deleteNotification } = useNotifications()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

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
    if (next && unreadCount > 0) markAllRead()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        className="relative text-white cursor-pointer hover:scale-110 transition-transform"
        title={t('notifications_title')}
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
            <h3 className="text-white font-semibold text-sm">{t('notifications_title')}</h3>
          </div>

          {notifications.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">{t('all_caught_up')}</p>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => {
                const Icon = ICONS[n.notification_type] || IoDocumentTextOutline
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-indigo-900/30 transition-colors border-b border-indigo-900/30 last:border-b-0 ${!n.is_read ? "bg-indigo-900/20" : ""}`}
                  >
                    <Icon className="text-indigo-400 text-lg shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200 text-xs font-semibold leading-snug">{n.title}</p>
                      {n.description && <p className="text-slate-400 text-xs mt-0.5">{n.description}</p>}
                      <p className="text-slate-500 text-[10px] mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                      title={t('delete')}
                    >
                      <IoTrashOutline className="text-sm" />
                    </button>
                  </div>
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