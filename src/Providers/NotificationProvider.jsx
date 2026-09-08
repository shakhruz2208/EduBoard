import { createContext, useContext, useState, useEffect, useCallback } from "react"
import api from "../api"
import { useAuth } from "./AuthProvider"

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { isAuth } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [fetching, setFetching] = useState(false)

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
      const count = typeof data === 'number' ? data : (data?.count ?? data?.unread_count ?? 0)
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

  const markAsRead = async (notificationId, isRead = true) => {
    try {
      const res = await api.patch(`/notifications/${notificationId}`, { is_read: isRead })
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? res.data : n)))
      setUnreadCount((prev) => Math.max(0, isRead ? prev - 1 : prev + 1))
      return true
    } catch (error) {
      console.error("Error marking notification as read", error)
      return false
    }
  }

  // Mark every currently-unread notification as read (used when opening the bell)
  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    if (unread.length === 0) return
    await Promise.all(unread.map((n) => api.patch(`/notifications/${n.id}`, { is_read: true }).catch(() => null)))
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      fetchUnreadCount()
      return true
    } catch (error) {
      console.error("Error deleting notification", error)
      return false
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