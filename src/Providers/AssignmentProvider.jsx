import { createContext, useContext, useState, useEffect, useCallback } from "react"
import axios from "axios"
import { toast } from "react-toastify"

const AssignmentContext = createContext(null)

const API_URL = "https://6a61aaafda10c59c1809b130.mockapi.io/assignment"

export const AssignmentProvider = ({ children }) => {
  const [assignmentsList, setAssignmentsList] = useState([])


  const [fetching, setFetching] = useState(false)      // initial/list refresh
  const [creating, setCreating] = useState(false)       // posting a new assignment
  const [deletingId, setDeletingId] = useState(null)    // id currently being deleted
  const [submittingId, setSubmittingId] = useState(null) // assignment id student is submitting to
  const [gradingKey, setGradingKey] = useState(null)    // `${assignmentId}:${studentName}` being graded

  const fetchAssignments = useCallback(async () => {
    try {
      setFetching(true)
      const res = await axios.get(API_URL)
      setAssignmentsList(res.data)
    } catch (error) {
      console.error("Ma'lumotlarni olishda xatolik", error)
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const addAssignment = async (assignment, deadline, teacherName, courseId, courseName) => {
    if (!assignment.trim()) return false

    const newData = {
      assignment,
      deadline,
      teacherName: teacherName || "Unknown Teacher",
      courseId: courseId || null,
      courseName: courseName || null,
      createdAt: new Date().toISOString()
    }

    try {
      setCreating(true)
      const res = await axios.post(API_URL, newData)
      setAssignmentsList((prev) => [...prev, res.data])
      toast.success('Successfully Uploaded')
      return true
    } catch (error) {
      toast.error('Error when uploading')
      return false
    } finally {
      setCreating(false)
    }
  }

  const deleteAssignment = async (id) => {
    try {
      setDeletingId(id)
      await axios.delete(`${API_URL}/${id}`)
      setAssignmentsList((prev) => prev.filter((item) => item.id !== id))
      toast.success('Successfully Deleted')
    } catch (error) {
      toast.error('Error when Deleting')
    } finally {
      setDeletingId(null)
    }
  }


  const submitAssignment = async (id, submissionText, studentName) => {
    if (!submissionText.trim()) return false

    const current = assignmentsList.find((item) => item.id === id)
    if (!current) return false

    const existingSubmissions = Array.isArray(current.submissions) ? current.submissions : []
    const name = studentName || "Unknown Student"
    const submittedAt = new Date()

    const isLate = current.deadline ? submittedAt > new Date(current.deadline) : false

    const newEntry = {
      studentName: name,
      text: submissionText.trim(),
      submittedAt: submittedAt.toISOString(),
      late: isLate
    }

    const alreadySubmittedIndex = existingSubmissions.findIndex((s) => s.studentName === name)
    const updatedSubmissions = alreadySubmittedIndex >= 0
      ? existingSubmissions.map((s, i) => (i === alreadySubmittedIndex ? newEntry : s))
      : [...existingSubmissions, newEntry]

    const updated = { ...current, submissions: updatedSubmissions }

    try {
      setSubmittingId(id)
      const res = await axios.put(`${API_URL}/${id}`, updated)
      setAssignmentsList((prev) => prev.map((item) => (item.id === id ? res.data : item)))
      toast.success(isLate ? 'Submitted (late)' : 'Assignment submitted successfully')
      return true
    } catch (error) {
      toast.error('Error submitting assignment')
      return false
    } finally {
      setSubmittingId(null)
    }
  }

  // Teacher grades one student's submission — saves score + optional feedback
  const gradeSubmission = async (assignmentId, studentName, grade, feedback) => {
    const current = assignmentsList.find((item) => item.id === assignmentId)
    if (!current) return false

    const existingSubmissions = Array.isArray(current.submissions) ? current.submissions : []
    const updatedSubmissions = existingSubmissions.map((s) =>
      s.studentName === studentName
        ? { ...s, grade, feedback: feedback?.trim() || "", gradedAt: new Date().toISOString() }
        : s
    )

    const updated = { ...current, submissions: updatedSubmissions }
    const key = `${assignmentId}:${studentName}`

    try {
      setGradingKey(key)
      const res = await axios.put(`${API_URL}/${assignmentId}`, updated)
      setAssignmentsList((prev) => prev.map((item) => (item.id === assignmentId ? res.data : item)))
      toast.success('Grade saved')
      return true
    } catch (error) {
      toast.error('Error saving grade')
      return false
    } finally {
      setGradingKey(null)
    }
  }

  return (
    <AssignmentContext.Provider
      value={{
        assignmentsList,
        fetching,
        creating,
        deletingId,
        submittingId,
        gradingKey,
        fetchAssignments,
        addAssignment,
        deleteAssignment,
        submitAssignment,
        gradeSubmission
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