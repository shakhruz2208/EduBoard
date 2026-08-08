import { createContext, useContext, useState, useEffect, useCallback } from "react"
import axios from "axios"
import { toast } from "react-toastify"

const CourseContext = createContext(null)

const COURSES_URL = "https://6a61aaafda10c59c1809b130.mockapi.io/courses"
const ENROLLMENTS_URL = "https://6a61aaafda10c59c1809b130.mockapi.io/enrollments"

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [fetching, setFetching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      setFetching(true)
      const results = await Promise.allSettled([
        axios.get(COURSES_URL),
        axios.get(ENROLLMENTS_URL)
      ])

      if (results[0].status === "fulfilled") {
        setCourses(results[0].value.data)
      } else {
        console.error("Error fetching courses — does the 'courses' resource exist on mockapi.io?", results[0].reason)
      }

      if (results[1].status === "fulfilled") {
        setEnrollments(results[1].value.data)
      } else {
        console.error("Error fetching enrollments — does the 'enrollments' resource exist on mockapi.io?", results[1].reason)
      }
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const addCourse = async (name, teacherName) => {
    if (!name.trim()) return false
    try {
      setCreating(true)
      const res = await axios.post(COURSES_URL, {
        name: name.trim(),
        teacherName: teacherName || "Unknown Teacher",
        createdAt: new Date().toISOString()
      })
      setCourses((prev) => [...prev, res.data])
      toast.success('Course created')
      return true
    } catch (error) {
      if (error?.response?.status === 404) {
        toast.error('Error: "courses" resource does not exist on mockapi.io yet — create it in your mockapi.io project first.')
      } else if (!error?.response) {
        toast.error('Error: Could not reach mockapi.io. Check your internet connection.')
      } else {
        toast.error(`Error creating course (status ${error.response.status})`)
      }
      console.error('addCourse failed:', error)
      return false
    } finally {
      setCreating(false)
    }
  }

  const deleteCourse = async (id) => {
    try {
      setDeletingId(id)
      await axios.delete(`${COURSES_URL}/${id}`)
      setCourses((prev) => prev.filter((c) => c.id !== id))
      toast.success('Course deleted')
    } catch (error) {
      toast.error('Error deleting course')
    } finally {
      setDeletingId(null)
    }
  }

  // Called right after a student successfully registers, to link them to the course they picked
  const enrollStudent = async (studentEmail, studentName, courseId, courseName) => {
    if (!courseId) return false
    try {
      const res = await axios.post(ENROLLMENTS_URL, {
        studentEmail,
        studentName,
        courseId,
        courseName,
        enrolledAt: new Date().toISOString()
      })
      setEnrollments((prev) => [...prev, res.data])
      return true
    } catch (error) {
      console.error("Error enrolling student in course", error)
      return false
    }
  }

  const studentsInCourse = (courseId) =>
    enrollments.filter((e) => e.courseId === courseId)

  return (
    <CourseContext.Provider
      value={{
        courses,
        enrollments,
        fetching,
        creating,
        deletingId,
        addCourse,
        deleteCourse,
        enrollStudent,
        studentsInCourse
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