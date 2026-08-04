import { createContext, useContext, useState, useEffect, useCallback } from "react"
import axios from "axios"
import { toast } from "react-toastify"

const AssignmentContext = createContext(null)

const API_URL = "https://6a61aaafda10c59c1809b130.mockapi.io/assignment"

export const AssignmentProvider = ({ children }) => {
  const [assignmentsList, setAssignmentsList] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get(API_URL)
      setAssignmentsList(res.data)
    } catch (error) {
      console.error("Ma'lumotlarni olishda xatolik", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const addAssignment = async (assignment, deadline, teacherName) => {
    if (!assignment.trim()) return false

    const newData = { assignment, deadline, teacherName: teacherName || "Unknown Teacher" }

    try {
      setLoading(true)
      const res = await axios.post(API_URL, newData)
      setAssignmentsList((prev) => [...prev, res.data])
      toast.success('Successfully Uploaded')
      return true
    } catch (error) {
      toast.error('Error when uploading')
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteAssignment = async (id) => {
    try {
      setLoading(true)
      await axios.delete(`${API_URL}/${id}`)
      setAssignmentsList((prev) => prev.filter((item) => item.id !== id))
      toast.success('Successfully Deleted')
    } catch (error) {
      toast.error('Error when Deleting')
    } finally {
      setLoading(false)
    }
  }


  const submitAssignment = async (id, submissionText, studentName) => {
    if (!submissionText.trim()) return false

    const current = assignmentsList.find((item) => item.id === id)
    if (!current) return false

    const existingSubmissions = Array.isArray(current.submissions) ? current.submissions : []
    const name = studentName || "Unknown Student"

    const newEntry = {
      studentName: name,
      text: submissionText.trim(),
      submittedAt: new Date().toISOString()
    }

    const alreadySubmittedIndex = existingSubmissions.findIndex((s) => s.studentName === name)
    const updatedSubmissions = alreadySubmittedIndex >= 0
      ? existingSubmissions.map((s, i) => (i === alreadySubmittedIndex ? newEntry : s))
      : [...existingSubmissions, newEntry]

    const updated = { ...current, submissions: updatedSubmissions }

    try {
      setLoading(true)
      const res = await axios.put(`${API_URL}/${id}`, updated)
      setAssignmentsList((prev) => prev.map((item) => (item.id === id ? res.data : item)))
      toast.success('Assignment submitted successfully')
      return true
    } catch (error) {
      toast.error('Error submitting assignment')
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <AssignmentContext.Provider
      value={{
        assignmentsList,
        loading,
        fetchAssignments,
        addAssignment,
        deleteAssignment,
        submitAssignment
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