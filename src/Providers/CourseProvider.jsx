import { createContext, useContext, useState, useEffect, useCallback } from "react"
import api from "../api"
import { toast } from "react-toastify"
import { useAuth } from "./AuthProvider"

const CourseContext = createContext(null)

export const CourseProvider = ({ children }) => {
  const { isAuth, user } = useAuth()
  const [courses, setCourses] = useState([])
  const [myGroup, setMyGroup] = useState(null) // the student's own group, or null if not joined
  const [groupMembers, setGroupMembers] = useState({}) // { [groupId]: [UserMemberResponse, ...] }

  const [fetching, setFetching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [joiningId, setJoiningId] = useState(null)
  const [removingKey, setRemovingKey] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [adminKey, setAdminKey] = useState(null)

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get(user?.teacher ? '/groups' : '/me/groups')
      const data = res.data
      if (Array.isArray(data)) {
        setCourses(data)
      }
      else if (Array.isArray(data?.items)) {
        setCourses(data.items)
      }
      else { 
        console.error("Unrecognized GET /groups shape:", data)
        setCourses([]) 
      }
    } catch (error) {
      console.error("❌ Error fetching groups from backend", error)
    }
  }, [user?.teacher])

  const fetchMyGroup = useCallback(async () => {
    try {
      const res = await api.get('/me/group')
      setMyGroup(res.data || null)
    } catch {
      // 404 (or similar) just means "not in a group yet" — not a real error
      setMyGroup(null)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      setFetching(true)
      await Promise.all([fetchCourses(), fetchMyGroup()])
    } finally {
      setFetching(false)
    }
  }, [fetchCourses, fetchMyGroup])

  useEffect(() => {
    if (isAuth) {
      fetchAll()
    } else {
      setCourses([])
      setMyGroup(null)
      setGroupMembers({})
    }
  }, [isAuth, fetchAll])

  const addCourse = async (name, description) => {
    if (!name.trim()) return false
    try {
      setCreating(true)
      const body = { name: name.trim() }
      if (description?.trim()) body.description = description.trim()
      const res = await api.post('/create-group', body)
      setCourses((prev) => [...prev, res.data])
      toast.success('Course created')
      return true
    } catch (error) {
      const detail = error?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error creating course')
      return false
    } finally {
      setCreating(false)
    }
  }

  const deleteCourse = async (groupId) => {
    try {
      await api.delete(`/group/${groupId}`)
      setCourses((prev) => prev.filter((c) => c.id !== groupId))
      toast.success('Course deleted')
      return true
    } catch (error) {
      const detail = error?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error deleting course')
      return false
    }
  }

  // Teacher views the roster for one of their courses
  const fetchGroupMembers = useCallback(async (groupId) => {
    try {
      const res = await api.get(`/group/${groupId}/members`)
      const data = Array.isArray(res.data) ? res.data : (res.data?.items || [])
      setGroupMembers((prev) => ({ ...prev, [groupId]: data }))
      return data
    } catch (error) {
      console.error("Error fetching group members", error)
      return []
    }
  }, [])

  // Teacher/admin only — adds a student to a group.
  // Accepts numeric user_id or email string.
  const addStudentToGroup = async (groupId, userIdOrEmail) => {
    if (!userIdOrEmail) return false
    const trimmed = String(userIdOrEmail).trim()
    const key = `${groupId}:${trimmed}`
    try {
      setJoiningId(key)
      // Determine what was entered: email, numeric user_id, or student_code
      const isEmail = trimmed.includes('@')
      const isNumeric = /^\d+$/.test(trimmed)
      const hasLetters = /[a-zA-Z]/.test(trimmed)
      let body
      if (isEmail) {
        // Email address → { email: "..." }
        body = { email: trimmed }
      } else if (hasLetters) {
        // Alphanumeric like "STU86177270" → student_code
        body = { student_code: trimmed }
      } else if (isNumeric && trimmed.length <= 4) {
        // Short numeric (1-4 digits) → likely backend user_id (1, 13, 123)
        body = { user_id: Number(trimmed) }
      } else {
        // 5+ digit numeric → student_code (like 77270, 86177)
        body = { student_code: trimmed }
      }
      await api.post(`/group/${groupId}/members`, body)
      await fetchGroupMembers(groupId)
      await fetchMyGroup()

      const group = courses.find((c) => c.id === Number(groupId))
      // Personal welcome notification — non-fatal if it fails
      api.post('/notifications', {
        title: 'Added to a new course',
        description: group ? `You were added to "${group.name}"` : 'You were added to a new course',
        notification_type: 'general',
        icon_url: null,
        user_ids: []
      }).catch((err) => console.error('Error sending welcome notification', err))

      toast.success('Student added to course')
      return true
    } catch (error) {
      const detail = error?.response?.data?.detail
      const message = Array.isArray(detail) ? detail[0]?.msg : detail
      toast.error(typeof message === 'string' ? message : 'Error adding student to this course')
      return false
    } finally {
      setJoiningId(null)
    }
  }

  const removeMember = async (groupId, userId) => {
    const key = `${groupId}:${userId}`
    try {
      setRemovingKey(key)
      await api.delete(`/group/${groupId}/members/${userId}`)
      setGroupMembers((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || []).filter((m) => m.id !== userId)
      }))
      toast.success('Student removed from course')
      return true
    } catch {
      toast.error('Error removing student')
      return false
    } finally {
      setRemovingKey(null)
    }
  }

  // Teacher/admin only — edit a course's name/description
  const updateCourse = async (groupId, { name, description }) => {
    try {
      setUpdatingId(groupId)
      const res = await api.patch(`/group/${groupId}`, {
        name: name?.trim() || null,
        description: description?.trim() || null
      })
      setCourses((prev) => prev.map((c) => (c.id === groupId ? res.data : c)))
      toast.success('Course updated')
      return true
    } catch (error) {
      const detail = error?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error updating course')
      return false
    } finally {
      setUpdatingId(null)
    }
  }

  // Teacher only — promote/demote a group member to/from admin
  const promoteToAdmin = async (groupId, userId) => {
    const key = `${groupId}:${userId}`
    try {
      setAdminKey(key)
      const res = await api.post(`/group/${groupId}/members/${userId}/admin`)
      setGroupMembers((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || []).map((m) => (m.id === userId ? res.data : m))
      }))
      toast.success('Promoted to admin')
      return true
    } catch {
      toast.error('Error promoting to admin')
      return false
    } finally {
      setAdminKey(null)
    }
  }

  const demoteFromAdmin = async (groupId, userId) => {
    const key = `${groupId}:${userId}`
    try {
      setAdminKey(key)
      const res = await api.delete(`/group/${groupId}/members/${userId}/admin`)
      setGroupMembers((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || []).map((m) => (m.id === userId ? res.data : m))
      }))
      toast.success('Removed admin')
      return true
    } catch {
      toast.error('Error removing admin')
      return false
    } finally {
      setAdminKey(null)
    }
  }

  return (
    <CourseContext.Provider
      value={{
        courses,
        myGroup,
        groupMembers,
        fetching,
        creating,
        joiningId,
        removingKey,
        updatingId,
        adminKey,
        addCourse,
        deleteCourse,
        updateCourse,
        addStudentToGroup,
        fetchGroupMembers,
        removeMember,
        promoteToAdmin,
        demoteFromAdmin,
        fetchAll
      }}
    >
      {children}
    </CourseContext.Provider>
  )
}

export const useCourses = () => {
  const context = useContext(CourseContext)
  if (!context) {
    throw new Error("useCourses must be used within a CourseProvider")
  }
  return context
}