import { createContext, useContext, useMemo, useCallback, useState, useEffect } from "react"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useAuth } from "../Providers/AuthProvider"

const NotificationContext = createContext(null)

const isGradedValue = (grade) => grade !== undefined && grade !== null && grade !== ""

const daysUntil = (deadlineStr) => {
  if (!deadlineStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadlineStr)
  deadlineDate.setHours(0, 0, 0, 0)
  return Math.round((deadlineDate - today) / (1000 * 60 * 60 * 24))
}

export const NotificationProvider = ({ children }) => {
  const { assignmentsList } = useAssignments()
  const { user } = useAuth()

  const [seenIds, setSeenIds] = useState(() => new Set())

  useEffect(() => {
    if (!user) {
      setSeenIds(new Set())
      return
    }
    try {
      const stored = localStorage.getItem(`notifications_seen:${user.id}`)
      setSeenIds(new Set(stored ? JSON.parse(stored) : []))
    } catch {
      setSeenIds(new Set())
    }
  }, [user])

  const persistSeen = useCallback((nextSet) => {
    if (!user) return
    localStorage.setItem(`notifications_seen:${user.id}`, JSON.stringify([...nextSet]))
  }, [user])

  // Build the live notification list from current assignment data.
  // Nothing is stored server-side — everything is derived on the fly each render.
  const notifications = useMemo(() => {
    if (!user) return []
    const isTeacher = Boolean(user.teacher)
    const list = []

    if (isTeacher) {
      const myAssignments = assignmentsList.filter((a) => a.teacherName === user.full_name)

      myAssignments.forEach((a) => {
        const submissions = Array.isArray(a.submissions) ? a.submissions : []
        submissions.forEach((sub) => {
          if (!isGradedValue(sub.grade)) {
            list.push({
              id: `submission:${a.id}:${sub.studentName}:${sub.submittedAt}`,
              type: "submission",
              message: `${sub.studentName} submitted "${a.assignment}" — needs grading`,
              link: `/teacher-assignment/${a.id}`,
              timestamp: sub.submittedAt
            })
          }
        })
      })
    } else {
      assignmentsList.forEach((a) => {
        const submissions = Array.isArray(a.submissions) ? a.submissions : []
        const mySub = submissions.find((s) => s.studentName === user.full_name)

        if (!mySub && a.createdAt) {
          list.push({
            id: `new:${a.id}`,
            type: "new",
            message: `New assignment: "${a.assignment}"`,
            link: `/assignment/${a.id}`,
            timestamp: a.createdAt
          })
        }

        if (!mySub) {
          const diff = daysUntil(a.deadline)
          if (diff !== null && diff <= 1) {
            list.push({
              id: `deadline:${a.id}`,
              type: "deadline",
              message: diff < 0
                ? `Overdue: "${a.assignment}" was due ${formatShort(a.deadline)}`
                : diff === 0
                  ? `Due today: "${a.assignment}"`
                  : `Due tomorrow: "${a.assignment}"`,
              link: `/assignment/${a.id}`,
              timestamp: a.deadline
            })
          }
        }

        if (mySub && isGradedValue(mySub.grade) && mySub.gradedAt) {
          list.push({
            id: `grade:${a.id}:${mySub.gradedAt}`,
            type: "grade",
            message: `Your submission for "${a.assignment}" was graded: ${mySub.grade}/100`,
            link: `/assignment/${a.id}`,
            timestamp: mySub.gradedAt
          })
        }
      })
    }

    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [assignmentsList, user])

  const unreadCount = notifications.filter((n) => !seenIds.has(n.id)).length

  const markAllRead = useCallback(() => {
    const next = new Set(seenIds)
    notifications.forEach((n) => next.add(n.id))
    setSeenIds(next)
    persistSeen(next)
  }, [notifications, seenIds, persistSeen])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, seenIds, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

const formatShort = (dateStr) => {
  const date = new Date(dateStr)
  if (isNaN(date)) return dateStr
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}