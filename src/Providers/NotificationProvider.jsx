import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import api from "../api"
import { toast } from "react-toastify"
import { useAuth } from "./AuthProvider"

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { isAuth } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [fetching, setFetching] = useState(false)
  // Tracks in-flight PATCH/DELETE calls so double-clicks and concurrent
  // markAllRead loops don't fire duplicate requests for the same notification
  const pendingRef = useRef(new Set())

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications', { params: { skip: 0, limit: 50 } })
      const data = res.data
      if (Array.isArray(data)) setNotifications(data)
      else if (Array.isArray(data?.items)) setNotifications(data.items)
      else { console.error("Unrecognized GET /notifications shape:", data); setNotifications([]) }
    } catch (error) {
      console.error("Error fetching notifications", error)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count')
      const data = res.data
      let count = typeof data === 'number' ? data : (data?.count ?? data?.unread_count ?? 0)
      // The endpoint can under-report (returns 0 while unread rows exist), so
      // fall back to counting is_read=false in the loaded list.
      if (!count) {
        const list = await api.get('/notifications', { params: { skip: 0, limit: 50 } })
        const rows = Array.isArray(list.data) ? list.data : list.data?.items || []
        count = rows.filter((n) => !n.is_read).length
      }
      setUnreadCount(count)
    } catch (error) {
      console.error("Error fetching unread count", error)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      setFetching(true)
      await Promise.all([fetchNotifications(), fetchUnreadCount()])
    } finally {
      setFetching(false)
    }
  }, [fetchNotifications, fetchUnreadCount])

  useEffect(() => {
    if (isAuth) {
      fetchAll()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [isAuth, fetchAll])

  const extractDetail = (error) => {
    const detail = error?.response?.data?.detail
    if (Array.isArray(detail)) return detail[0]?.msg
    return typeof detail === 'string' ? detail : null
  }

  const markAsRead = async (notificationId, isRead = true) => {
    const key = `patch:${notificationId}:${isRead}`
    if (pendingRef.current.has(key)) return false
    pendingRef.current.add(key)
    try {
      const res = await api.patch(`/notifications/${notificationId}`, { is_read: isRead })
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? res.data : n)))
      setUnreadCount((prev) => Math.max(0, isRead ? prev - 1 : prev + 1))
      return true
    } catch (error) {
      console.error("Error marking notification as read", error)
      toast.error(extractDetail(error) || "Error updating notification")
      // State may be stale (e.g. permission or 404) — refetch to resync
      fetchAll()
      return false
    } finally {
      pendingRef.current.delete(`patch:${notificationId}:${isRead}`)
    }
  }

  // Mark every currently-unread notification as read (used when opening the bell)
  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    if (unread.length === 0) return
    // Deduplicate concurrent markAllRead calls for the same notification
    const fresh = unread.filter((n) => !pendingRef.current.has(`patch:${n.id}:true`))
    if (fresh.length === 0) return
    fresh.forEach((n) => pendingRef.current.add(`patch:${n.id}:true`))
    try {
      const results = await Promise.allSettled(
        fresh.map((n) => api.patch(`/notifications/${n.id}`, { is_read: true }))
      )
      const okIds = new Set(fresh.filter((_, i) => results[i].status === 'fulfilled').map((n) => n.id))
      const failed = fresh.length - okIds.size
      if (failed > 0) {
        toast.error(failed === fresh.length
          ? "Error updating notifications"
          : `${failed} of ${fresh.length} notifications could not be updated`)
        fetchAll()
      }
      setNotifications((prev) => prev.map((n) => (okIds.has(n.id) ? { ...n, is_read: true } : n)))
      if (okIds.size > 0) setUnreadCount((prev) => Math.max(0, prev - okIds.size))
    } finally {
      fresh.forEach((n) => pendingRef.current.delete(`patch:${n.id}:true`))
    }
  }

  const deleteNotification = async (notificationId) => {
    const key = `delete:${notificationId}`
    if (pendingRef.current.has(key)) return false
    pendingRef.current.add(key)
    try {
      await api.delete(`/notifications/${notificationId}`)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      fetchUnreadCount()
      return true
    } catch (error) {
      console.error("Error deleting notification", error)
      toast.error(extractDetail(error) || "Error deleting notification")
      // State may be stale (e.g. permission or 404) — refetch to resync
      fetchAll()
      return false
    } finally {
      pendingRef.current.delete(key)
    }
  }

  const clearAll = async () => {
    try {
      await api.delete('/notifications')
      setNotifications([])
      setUnreadCount(0)
      return true
    } catch (error) {
      console.error("Error clearing notifications", error)
      toast.error(extractDetail(error) || "Error clearing notifications")
      fetchAll()
      return false
    }
  }

  // Teacher/admin only — notifies specific users directly (POST /notifications)
  const notifyUsers = async (title, description, userIds, notificationType = "general") => {
    try {
      await api.post('/notifications', {
        title,
        description: description || null,
        notification_type: notificationType,
        icon_url: null,
        user_ids: userIds
      })
      return true
    } catch (error) {
      console.error("Error sending notification", error)
      return false
    }
  }

  // Teacher/admin only — notifies every member of a group (e.g. right after
  // creating a new assignment for that group).
  const notifyGroup = async (groupId, title, description, notificationType = "assignment") => {
    try {
      await api.post('/notifications/bulk', {
        title,
        description: description || null,
        notification_type: notificationType,
        icon_url: null,
        group_id: groupId
      })
      return true
    } catch (error) {
      console.error("Error sending group notification", error)
      return false
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetching,
        markAsRead,
        markAllRead,
        deleteNotification,
        clearAll,
        notifyGroup,
        notifyUsers,
        fetchAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}