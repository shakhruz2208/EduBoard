import { createContext, useContext, useState, useEffect, useCallback } from "react"
import api from "../api"
import { toast } from "react-toastify"
import { useAuth } from "./AuthProvider"

const AssignmentContext = createContext(null)

const normalizeSubmission = (submission, studentEmail, studentName) => ({
  id: submission.id,
  assignmentId: submission.object_id,
  studentId: submission.student_id,
  studentEmail: studentEmail || submission.student_email,
  studentName: studentName || submission.student_name || submission.student?.full_name || `Student #${submission.student_id}`,
  text: submission.url,
  submittedAt: submission.submitted_at,
  late: false,
  grade: submission.grade,
  feedback: submission.feedback,
  gradedAt: submission.graded_at
})

export const AssignmentProvider = ({ children }) => {
  const { isAuth, user } = useAuth()
  const [assignmentsList, setAssignmentsList] = useState([])
  const [submissions, setSubmissions] = useState([])

  const [fetching, setFetching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [submittingId, setSubmittingId] = useState(null)
  const [gradingKey, setGradingKey] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      setFetching(true)
      const isTeacher = Boolean(user?.teacher)
      const results = await Promise.allSettled(isTeacher
        ? [api.get('/objects'), api.get('/teacher/homework')]
        : [api.get('/objects'), api.get('/homework'), api.get('/me/homework')])

      console.log('[AssignmentProvider] fetchAll results:', {
        isTeacher,
        resultsStatus: results.map((r, i) => ({ index: i, status: r.status })),
        objectsData: results[0].status === 'fulfilled' ? results[0].value.data : results[0].reason?.message,
        homeworkData: results[1].status === 'fulfilled' ? results[1].value.data : results[1].reason?.message,
        meHomeworkData: !isTeacher && results[2] ? (results[2].status === 'fulfilled' ? results[2].value.data : results[2].reason?.message) : 'N/A'
      })

      if (results[0].status === "fulfilled") {
        const data = results[0].value.data
        const assignments = Array.isArray(data) ? data : data?.items
        const assignmentsList = Array.isArray(assignments) ? assignments : []
        setAssignmentsList(assignmentsList)
        console.log('[AssignmentProvider] assignmentsList:', assignmentsList.map(a => ({ id: a.id, name: a.name, group_id: a.group_id })))
      } else {
        console.error("❌ Error fetching assignments", results[0].reason)
      }

      const homeworkResult = isTeacher ? results[1] : results[2]
      if (homeworkResult.status === "fulfilled") {
        const data = homeworkResult.value.data
        const homework = Array.isArray(data) ? data : data?.items
        if (Array.isArray(homework)) {
          if (isTeacher) {
            const assignments = results[0].status === "fulfilled"
              ? (Array.isArray(results[0].value.data) ? results[0].value.data : results[0].value.data?.items)
              : []
            const groupIds = [...new Set((assignments || []).map((item) => item.group_id).filter(Boolean))]
            const memberResults = await Promise.allSettled(
              groupIds.map((groupId) => api.get(`/group/${groupId}/members`))
            )
            const studentsById = new Map()
            memberResults.forEach((memberResult) => {
              if (memberResult.status !== "fulfilled") return
              const members = Array.isArray(memberResult.value.data)
                ? memberResult.value.data
                : memberResult.value.data?.items
              ;(members || []).forEach((member) => studentsById.set(member.id, member))
            })
            setSubmissions(homework.map((item) => {
              const student = studentsById.get(item.student_id)
              return normalizeSubmission(item, student?.email, student?.full_name)
            }))
          } else {
            const normalized = homework.map((item) => normalizeSubmission(item, user?.email, user?.full_name))
            const submittedIds = new Set(normalized.map((item) => String(item.assignmentId)))
            const objectsData = results[0].status === "fulfilled"
              ? (Array.isArray(results[0].value.data) ? results[0].value.data : results[0].value.data?.items)
              : []
            const aliasResult = results[1]
            const aliasData = aliasResult.status === "fulfilled" ? aliasResult.value.data : []
            const aliasItems = Array.isArray(aliasData) ? aliasData : aliasData?.items || []
            const nestedAssignments = aliasItems.map((item) => item.homework).filter(Boolean)
            const assignmentsById = new Map([...(objectsData || []), ...nestedAssignments].map((item) => [String(item.id), item]))
            setAssignmentsList([...assignmentsById.values()].map((item) => (
              submittedIds.has(String(item.id)) ? { ...item, submitted: true } : item
            )))
            setSubmissions(normalized)
          }
        } else {
          setSubmissions([])
        }
      } else {
        console.error("Error fetching homework submissions", homeworkResult.reason)
      }
    } finally {
      setFetching(false)
    }
  }, [user?.email, user?.full_name, user?.teacher])

  useEffect(() => {
    if (isAuth) {
      fetchAll()
    } else {
      setAssignmentsList([])
      setSubmissions([])
    }
  }, [isAuth, fetchAll])

  const addAssignment = async (name, description, deadline, groupId) => {
    if (!name.trim() || !groupId) return false
    try {
      setCreating(true)
      const res = await api.post('/add-object', {
        name: name.trim(),
        description: description?.trim() || null,
        deadline: deadline || null,
        group_id: Number(groupId)
      })
      setAssignmentsList((prev) => [...prev, res.data])

      
      await api.post('/notifications/bulk', {
        title: 'New assignment posted',
        description: `"${name.trim()}" was added to your course`,
        notification_type: 'assignment',
        icon_url: null,
        group_id: Number(groupId)
      }).catch((err) => console.error('Error sending assignment notification', err))

      toast.success('Assignment created')
      return true
    } catch (error) {
      const detail = error?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error creating assignment')
      return false
    } finally {
      setCreating(false)
    }
  }

  const deleteAssignment = async (assignmentId) => {
    try {
      setDeletingId(assignmentId)
      await api.delete(`/object/${assignmentId}`)
      setAssignmentsList((prev) => prev.filter((item) => String(item.id) !== String(assignmentId)))
      setSubmissions((prev) => prev.filter((item) => String(item.assignmentId) !== String(assignmentId)))
      toast.success('Assignment deleted')
      return true
    } catch (error) {
      const detail = error?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error deleting assignment')
      return false
    } finally {
      setDeletingId(null)
    }
  }

  const submitAssignment = async (assignmentId, text, studentName, studentEmail) => {
    const submissionUrl = text.trim()
    if (!submissionUrl) return false

    try {
      const parsedUrl = new URL(submissionUrl)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsupported URL protocol')
    } catch {
      toast.error('Please enter a valid link starting with https://')
      return false
    }

    try {
      setSubmittingId(assignmentId)

      const res = await api.post(`/object/${assignmentId}/submit`, { url: submissionUrl })
      const assignment = assignmentsList.find((a) => a.id === assignmentId)
      const isLate = assignment?.deadline ? new Date() > new Date(assignment.deadline) : false
      setAssignmentsList((prev) => prev.map((item) => (
        item.id === assignmentId
          ? { ...item, submitted: true, homework_url: res.data.url }
          : item
      )))

      const submission = normalizeSubmission(res.data, studentEmail, studentName)
      setSubmissions((prev) => [
        ...prev.filter((item) => item.assignmentId !== assignmentId),
        { ...submission, late: isLate }
      ])

      toast.success(isLate ? 'Submitted (late)' : 'Assignment submitted successfully')
      return true
    } catch (error) {
      const detail = error?.response?.data?.detail
      const message = Array.isArray(detail) ? detail[0]?.msg : detail
      toast.error(typeof message === 'string' ? message : 'Error submitting assignment')
      return false
    } finally {
      setSubmittingId(null)
    }
  }

  const gradeSubmission = async (submissionId, grade, feedback) => {
    const key = String(submissionId)
    try {
      setGradingKey(key)
      const existing = submissions.find((s) => String(s.id) === key)
      if (!existing) return false

      const res = await api.patch(`/teacher/homework/${submissionId}/grade`, {
        grade: Number(grade),
        feedback: feedback?.trim() || null
      })
      const updated = normalizeSubmission(res.data, existing.studentEmail, existing.studentName)
      setSubmissions((prev) => prev.map((s) => (String(s.id) === key ? updated : s)))

      const assignment = assignmentsList.find((item) => String(item.id) === String(existing.assignmentId))
      if (existing.studentId) {
        api.post('/notifications', {
          title: 'Homework graded',
          description: `${assignment?.name || 'Your homework'} was graded: ${grade}/100`,
          notification_type: 'grade',
          icon_url: null,
          user_ids: [Number(existing.studentId)]
        }).catch((error) => console.error('Error sending grade notification', error))
      }
      toast.success('Grade saved')
      return true
    } catch {
      toast.error('Error saving grade')
      return false
    } finally {
      setGradingKey(null)
    }
  }

  const submissionsForAssignment = (assignmentId) =>
    submissions.filter((s) => String(s.assignmentId) === String(assignmentId))

  const mySubmission = (assignmentId, studentEmail) =>
    submissions.find((s) => (
      String(s.assignmentId) === String(assignmentId) &&
      (!s.studentEmail || !studentEmail ||
        String(s.studentEmail).toLowerCase() === String(studentEmail).toLowerCase())
    )) || null

  return (
    <AssignmentContext.Provider
      value={{
        assignmentsList,
        submissions,
        fetching,
        creating,
        submittingId,
        gradingKey,
        deletingId,
        fetchAssignments: fetchAll,
        addAssignment,
        deleteAssignment,
        submitAssignment,
        gradeSubmission,
        submissionsForAssignment,
        mySubmission
      }}
    >
      {children}
    </AssignmentContext.Provider>
  )
}

export const useAssignments = () => {
  const context = useContext(AssignmentContext)
  if (!context) {
    throw new Error("useAssignments must be used within an AssignmentProvider")
  }
  return context
}