import { useState, useMemo, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import IconsBg from "../SmallComponents/IconsBg"
import { MdAssignment, MdEdit, MdClose } from "react-icons/md"
import { BiCalendar, BiTrash, BiBook, BiCheck } from "react-icons/bi"
import { BsPeople, BsLightningChargeFill } from "react-icons/bs"
import { IoSchoolOutline, IoChevronForward, IoClose, IoAdd, IoBookOutline } from "react-icons/io5"
import { HiOutlineBookOpen } from "react-icons/hi"
import { CgSpinner } from "react-icons/cg"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { useCourses } from "../Providers/CourseProvider"
import { toast } from "react-toastify"
import api from "../api"

const kindColors = {
  homework: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30", icon: "📝" },
  exam: { bg: "bg-red-500/20", text: "text-red-300", border: "border-red-500/30", icon: "📋" },
  quiz: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30", icon: "❓" },
  materials: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30", icon: "📚" },
}

const ACCENTS = ["from-blue-500 to-indigo-600", "from-purple-500 to-pink-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600"]

const TeacherDashboard = () => {
  const { assignmentsList, submissions, fetching, deleteAssignment, deletingId, gradeSubmission, gradingKey, submissionsForAssignment, fetchAssignments } = useAssignments()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { courses, groupMembers, fetchGroupMembers } = useCourses()

  /* ── State ── */
  const [showAll, setShowAll] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [lessonActivities, setLessonActivities] = useState([])
  const [lessonLoading, setLessonLoading] = useState(true)

  /* ── Lesson management ── */
  const [showLessonPanel, setShowLessonPanel] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [lessons, setLessons] = useState([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [activitiesForLesson, setActivitiesForLesson] = useState([])

  /* ── Lesson form ── */
  const [lessonTitle, setLessonTitle] = useState("")
  const [lessonDesc, setLessonDesc] = useState("")
  const [lessonSaving, setLessonSaving] = useState(false)

  /* ── Lesson edit ── */
  const [editingLesson, setEditingLesson] = useState(null)
  const [editLessonTitle, setEditLessonTitle] = useState("")
  const [editLessonDesc, setEditLessonDesc] = useState("")
  const [editLessonSaving, setEditLessonSaving] = useState(false)

  /* ── Activity form ── */
  const [activityKind, setActivityKind] = useState("homework")
  const [activityTitle, setActivityTitle] = useState("")
  const [activityDesc, setActivityDesc] = useState("")
  const [activityDeadline, setActivityDeadline] = useState("")
  const [activitySaving, setActivitySaving] = useState(false)

  /* ── Submissions modal ── */
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [gradeInput, setGradeInput] = useState("")
  const [feedbackInput, setFeedbackInput] = useState("")

  /* ── Assignment edit modal ── */
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [editAssignmentTitle, setEditAssignmentTitle] = useState("")
  const [editAssignmentDesc, setEditAssignmentDesc] = useState("")
  const [editAssignmentSaving, setEditAssignmentSaving] = useState(false)

  /* ── Attendance modal ── */
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [attendanceList, setAttendanceList] = useState([]) // [{user_id, status}]
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  const [existingAttendance, setExistingAttendance] = useState([]) // already saved
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  /* ── Data fetching ── */
  useEffect(() => {
    courses.forEach((c) => { if (!groupMembers[c.id]) fetchGroupMembers(c.id) })
  }, [courses, fetchGroupMembers, groupMembers])

  const fetchLessonActivities = useCallback(async () => {
    if (!courses.length) { setLessonLoading(false); return }
    setLessonLoading(true)
    try {
      const lRes = await Promise.allSettled(courses.map((c) => api.get(`/groups/${c.id}/lessons`)))
      const allLessons = []
      const lMap = {}
      lRes.forEach((r, i) => {
        if (r.status !== "fulfilled") return
        const items = Array.isArray(r.value.data) ? r.value.data : r.value.data?.items || []
        items.forEach((l) => { allLessons.push({ ...l, courseName: courses[i]?.name }); lMap[l.id] = courses[i]?.name })
      })
      const arr = []
      if (allLessons.length) {
        const aRes = await Promise.allSettled(allLessons.map((l) => api.get(`/lessons/${l.id}/activities`)))
        aRes.forEach((r, idx) => {
          if (r.status !== "fulfilled" || !allLessons[idx]) return
          const items = Array.isArray(r.value.data) ? r.value.data : r.value.data?.items || []
          items.forEach((a) => arr.push({
            ...a,
            id: a.id || a._id || a.homework_id || `a-${allLessons[idx].id}-${Math.random()}`,
            name: a.title || a.name,
            description: a.description,
            group: { name: lMap[allLessons[idx].id] },
            deadline: a.content?.deadline || a.deadline,
            isActivity: true,
            activityType: a.kind || 'homework',
            lessonId: allLessons[idx].id,
          }))
        })
      }
      setLessonActivities(arr)
    } catch { setLessonActivities([]) } finally { setLessonLoading(false) }
  }, [courses])

  useEffect(() => { fetchLessonActivities() }, [fetchLessonActivities])

  const fetchLessonsForCourse = useCallback(async (cid) => {
    if (!cid) { setLessons([]); return }
    setLessonsLoading(true)
    try {
      const r = await api.get(`/groups/${cid}/lessons`)
      setLessons(Array.isArray(r.data) ? r.data : r.data?.items || [])
      setSelectedLesson(null)
      setActivitiesForLesson([])
    } catch { setLessons([]) } finally { setLessonsLoading(false) }
  }, [])

  const openLesson = async (lesson) => {
    setSelectedLesson(lesson)
    try {
      const r = await api.get(`/lessons/${lesson.id}/activities`)
      const raw = Array.isArray(r.data) ? r.data : r.data?.items || []
      setActivitiesForLesson(raw.map((a) => ({
        ...a,
        id: a.id || a._id || a.homework_id || a.activity_id,
        name: a.title || a.name,
        isActivity: true,
        activityType: a.kind || 'homework',
        lessonId: lesson.id,
      })))
    } catch { setActivitiesForLesson([]) }
  }

  useEffect(() => { if (selectedCourseId) fetchLessonsForCourse(selectedCourseId) }, [selectedCourseId, fetchLessonsForCourse])

  /* ── Computed ── */
  const activeStudents = useMemo(() => {
    const ids = new Set()
    courses.forEach((c) => { (groupMembers[c.id] || []).forEach((m) => ids.add(m.id)) })
    return ids.size
  }, [groupMembers, courses])

  const allAssignments = [...assignmentsList, ...lessonActivities]
  // Filter by selected lesson if one is chosen
  const filteredAssignments = selectedLesson
    ? allAssignments.filter((a) => String(a.lessonId) === String(selectedLesson.id))
    : allAssignments
  const displayedAssignments = showAll ? filteredAssignments : filteredAssignments.slice(0, 4)
  const pendingReviews = submissions.filter((s) => s.grade == null).length

  /* ═══ HANDLERS ═══ */

  /* ── Delete assignment ── */
  const handleDeleteAssignment = (e, item) => {
    e.stopPropagation()
    setDeleteTarget(item)
  }
  const confirmDeleteAssignment = async () => {
    if (!deleteTarget) return
    if (deleteTarget.isActivity) {
      const kind = deleteTarget.activityType || deleteTarget.kind || "homework"
      try {
        // Backend only has DELETE /object/{item_id} for items
        let deleted = false
        console.log('[Delete] target:', { id: deleteTarget.id, kind, lessonId: deleteTarget.lessonId, item: deleteTarget })
        const endpoints = [
          `/object/${deleteTarget.id}`,
          `/lessons/${deleteTarget.lessonId}/${kind}/${deleteTarget.id}`,
          `/${kind}/${deleteTarget.id}`,
        ]
        for (const url of endpoints) {
          try {
            console.log('[Delete] trying:', url)
            await api.delete(url)
            console.log('[Delete] success:', url)
            deleted = true
            break
          } catch (err) {
            console.log('[Delete] failed:', url, err?.response?.status, err?.response?.data)
          }
        }
        if (deleted) {
          setLessonActivities((p) => p.filter((a) => a.id !== deleteTarget.id))
          setActivitiesForLesson((p) => p.filter((a) => a.id !== deleteTarget.id))
          toast.success("Activity deleted")
        } else {
          toast.error("Could not delete — the item may not exist on the server")
        }
      } catch (err) { toast.error(err?.response?.data?.detail || "Error deleting activity") }
    } else {
      const ok = await deleteAssignment(deleteTarget.id)
      if (!ok) return
    }
    setDeleteTarget(null)
  }

  /* ── Edit assignment (activities only) ── */
  const handleEditAssignment = (e, item) => {
    e.stopPropagation()
    setEditingAssignment(item)
    setEditAssignmentTitle(item.name || item.title || "")
    setEditAssignmentDesc(item.description || "")
  }
  const confirmEditAssignment = async () => {
    if (!editingAssignment) return
    try {
      setEditAssignmentSaving(true)
      const kind = editingAssignment.activityType || editingAssignment.kind || "homework"
      const payload = {
        title: editAssignmentTitle.trim(),
        description: editAssignmentDesc.trim() || null,
      }
      // Try multiple endpoints like delete does
      let updated = false
      const endpoints = []
      if (editingAssignment.lessonId) {
        endpoints.push(`/lessons/${editingAssignment.lessonId}/${kind}/${editingAssignment.id}`)
      }
      endpoints.push(`/${kind}/${editingAssignment.id}`)
      endpoints.push(`/object/${editingAssignment.id}`)

      for (const url of endpoints) {
        try {
          await api.patch(url, payload)
          updated = true
          break
        } catch { /* try next */ }
      }
      if (updated) {
        setLessonActivities((p) => p.map((a) =>
          a.id === editingAssignment.id ? { ...a, name: editAssignmentTitle.trim(), title: editAssignmentTitle.trim(), description: editAssignmentDesc.trim() } : a
        ))
        setActivitiesForLesson((p) => p.map((a) =>
          a.id === editingAssignment.id ? { ...a, title: editAssignmentTitle.trim(), description: editAssignmentDesc.trim() } : a
        ))
        toast.success("Assignment updated")
        setEditingAssignment(null)
      } else {
        toast.error("Error updating assignment")
      }
    } catch { toast.error("Error updating assignment") }
    finally { setEditAssignmentSaving(false) }
  }

  /* ── Open submissions modal ── */
  const openSubmissionsModal = (item) => {
    setSelectedAssignment(item)
    setShowSubmissionsModal(true)
    setGradeInput("")
    setFeedbackInput("")
  }

  /* ── Grade submission ── */
  const handleGradeSubmission = async (submissionId) => {
    const numericGrade = Number(gradeInput)
    if (gradeInput === "" || isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      toast.error("Grade must be 0-100")
      return
    }
    const ok = await gradeSubmission(submissionId, numericGrade, feedbackInput)
    if (ok) {
      setGradeInput("")
      setFeedbackInput("")
    }
  }

  /* ── Create lesson ── */
  const handleCreateLesson = async (e) => {
    e.preventDefault()
    if (!selectedCourseId || !lessonTitle.trim()) return
    try {
      setLessonSaving(true)
      const res = await api.post(`/groups/${selectedCourseId}/lessons`, {
        title: lessonTitle.trim(),
        description: lessonDesc.trim() || null,
      })
      const newLesson = { ...res.data, courseName: courses.find((c) => String(c.id) === String(selectedCourseId))?.name }
      setLessons((p) => [newLesson, ...p])
      setLessonTitle(""); setLessonDesc("")
      setShowLessonPanel(false)
      toast.success(t("lesson_created") || "Lesson created!")
      fetchLessonActivities()
      // Auto-select the new lesson and open attendance modal
      setSelectedLesson(newLesson)
      setTimeout(() => {
        openAttendanceModal(newLesson).catch(() => {
          // Attendance modal failed, but lesson was created — not critical
        })
      }, 300)
    } catch (err) { toast.error(err?.response?.data?.detail || "Error creating lesson") }
    finally { setLessonSaving(false) }
  }

  /* ── Delete lesson ── */
  const [deleteLessonTarget, setDeleteLessonTarget] = useState(null)
  const [deleteLessonSaving, setDeleteLessonSaving] = useState(false)

  const handleDeleteLesson = (e, lesson) => {
    e.stopPropagation()
    setDeleteLessonTarget(lesson)
  }
  const confirmDeleteLesson = async () => {
    if (!deleteLessonTarget) return
    try {
      setDeleteLessonSaving(true)
      await api.delete(`/lessons/${deleteLessonTarget.id}`)
      setLessons((p) => p.filter((l) => l.id !== deleteLessonTarget.id))
      if (selectedLesson?.id === deleteLessonTarget.id) { setSelectedLesson(null); setActivitiesForLesson([]) }
      toast.success("Lesson deleted")
      fetchLessonActivities()
      setDeleteLessonTarget(null)
    } catch { toast.error("Error deleting lesson") }
    finally { setDeleteLessonSaving(false) }
  }

  /* ── Edit lesson ── */
  const handleEditLesson = (e, lesson) => {
    e.stopPropagation()
    setEditingLesson(lesson)
    setEditLessonTitle(lesson.title)
    setEditLessonDesc(lesson.description || "")
  }
  const confirmEditLesson = async () => {
    if (!editingLesson) return
    try {
      setEditLessonSaving(true)
      const res = await api.patch(`/lessons/${editingLesson.id}`, {
        title: editLessonTitle.trim(),
        description: editLessonDesc.trim() || null,
      })
      setLessons((p) => p.map((l) => l.id === editingLesson.id ? { ...l, ...res.data } : l))
      if (selectedLesson?.id === editingLesson.id) setSelectedLesson((p) => ({ ...p, ...res.data }))
      toast.success("Lesson updated")
      setEditingLesson(null)
    } catch { toast.error("Error updating lesson") }
    finally { setEditLessonSaving(false) }
  }

  /* ── Attendance ── */
  // Find which course this lesson belongs to
  const findCourseForLesson = useCallback(async (lessonId) => {
    for (const c of courses) {
      try {
        const res = await api.get(`/groups/${c.id}/lessons`)
        const items = Array.isArray(res.data) ? res.data : res.data?.items || []
        if (items.some((l) => l.id === lessonId)) return c.id
      } catch { /* skip */ }
    }
    return null
  }, [courses])

  const openAttendanceModal = async (lessonOverride) => {
    const lesson = lessonOverride || selectedLesson
    if (!lesson) return
    setShowAttendanceModal(true)
    setAttendanceLoading(true)
    try {
      // Find the course for this lesson
      let courseId = selectedCourseId
      if (!courseId) {
        courseId = await findCourseForLesson(lesson.id)
        if (courseId) setSelectedCourseId(String(courseId))
      }
      // Fetch members for this course
      let members = courseId ? (groupMembers[courseId] || []) : []
      if (courseId && members.length === 0) {
        const fetched = await fetchGroupMembers(courseId)
        members = fetched || []
      }
      // Fetch existing attendance for this lesson
      let existing = []
      try {
        const res = await api.get(`/lessons/${lesson.id}/attendance`)
        existing = Array.isArray(res.data) ? res.data : res.data?.items || []
      } catch { /* no existing attendance */ }
      setExistingAttendance(existing)
      const statusMap = {}
      existing.forEach((a) => { statusMap[a.user_id || a.student_id] = a.status })
      setAttendanceList(members.map((m) => ({
        user_id: m.id,
        name: m.full_name || m.name || m.email,
        status: statusMap[m.id] || "present"
      })))
    } catch {
      setExistingAttendance([])
      setAttendanceList([])
    } finally { setAttendanceLoading(false) }
  }

  const updateAttendanceStatus = (userId, status) => {
    setAttendanceList((prev) => prev.map((a) => a.user_id === userId ? { ...a, status } : a))
  }

  // Attendance score mapping
  const ATTENDANCE_SCORES = { present: 10, late: 7, absent: 0 }

  const saveAttendance = async () => {
    if (!selectedLesson || attendanceList.length === 0) return
    setAttendanceSaving(true)
    try {
      // Try batch first, fall back to individual
      try {
        await api.post(`/lessons/${selectedLesson.id}/attendance`, {
          records: attendanceList.map((a) => ({
            user_id: a.user_id,
            status: a.status,
            score: ATTENDANCE_SCORES[a.status] ?? 0
          }))
        })
      } catch {
        // Batch failed — try one by one
        const promises = attendanceList.map((a) => {
          const existing = existingAttendance.find((e) => (e.user_id || e.student_id) === a.user_id)
          const payload = {
            user_id: a.user_id,
            status: a.status,
            score: ATTENDANCE_SCORES[a.status] ?? 0
          }
          if (existing?.id) {
            return api.patch(`/attendance/${existing.id}`, { status: a.status, score: payload.score })
          } else {
            return api.post(`/lessons/${selectedLesson.id}/attendance`, payload)
          }
        })
        await Promise.allSettled(promises)
      }
      toast.success(t("attendance_saved"))
      setShowAttendanceModal(false)
    } catch (err) {
      const detail = err?.response?.data?.detail
      const msg = Array.isArray(detail) ? detail[0]?.msg : detail
      toast.error(msg || t("attendance_error"))
    } finally { setAttendanceSaving(false) }
  }

  /* ── Create activity ── */
  const handleCreateActivity = async (e) => {
    e.preventDefault()
    if (!selectedLesson || !activityTitle.trim()) return
    try {
      setActivitySaving(true)
      const res = await api.post(`/lessons/${selectedLesson.id}/${activityKind}`, {
        title: activityTitle.trim(),
        description: activityDesc.trim() || null,
        url: null,
        content: activityDeadline ? { deadline: activityDeadline } : null,
      })
      setActivitiesForLesson((p) => [...p, res.data])
      const courseName = courses.find((c) => c.id === selectedCourseId)?.name || ""
      setLessonActivities((p) => [...p, {
        ...res.data,
        id: res.data.id || res.data._id || res.data.homework_id || `a-${selectedLesson.id}-${Math.random()}`,
        name: res.data.title || res.data.name,
        description: res.data.description,
        group: { name: courseName },
        deadline: res.data.content?.deadline || res.data.deadline,
        isActivity: true,
        activityType: res.data.kind || activityKind,
        lessonId: selectedLesson.id,
      }])
      setActivityTitle(""); setActivityDesc(""); setActivityDeadline("")
      toast.success(t("activity_saved") || "Activity added!")
    } catch (err) { toast.error(err?.response?.data?.detail || "Error adding activity") }
    finally { setActivitySaving(false) }
  }

  /* ── Delete activity ── */
  const handleDeleteActivity = async (e, act) => {
    e.stopPropagation()
    const kind = act.kind || act.activityType || "homework"
    try {
      // Backend only has DELETE /object/{item_id} for items
      let deleted = false
      const endpoints = [
        `/object/${act.id}`,
        `/lessons/${selectedLesson.id}/${kind}/${act.id}`,
        `/${kind}/${act.id}`,
      ]
      for (const url of endpoints) {
        try {
          await api.delete(url)
          deleted = true
          break
        } catch { /* try next */ }
      }
      if (deleted) {
        setActivitiesForLesson((p) => p.filter((a) => a.id !== act.id))
        setLessonActivities((p) => p.filter((a) => a.id !== act.id))
        toast.success("Activity deleted")
      } else {
        toast.error("Could not delete — the item may not exist on the server")
      }
    } catch (err) { toast.error(err?.response?.data?.detail || "Error deleting activity") }
  }

  /* ═══ RENDER ═══ */
  return (
    <div className="relative w-full min-h-screen bg-[#03071e]">
      <IconsBg />

      <div className="relative z-10 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 flex flex-col gap-6 max-w-[1400px] mx-auto">

        {/* ═══ HERO HEADER ═══ */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900/80 via-[#0a1450] to-purple-900/60 border border-indigo-500/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImVub3Zsb3kiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-lime-300 font-bold mb-2">{t("teacher_workspace")}</p>
            <h1 className="font-extrabold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight">{t("hello_teacher")}</h1>
            <p className="text-indigo-200/70 mt-2 text-sm sm:text-base max-w-xl">{t("teacher_subtitle")}</p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-lime-400/5 rounded-full blur-3xl" />
        </div>

        {/* ═══ STATS CARDS ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0c1a52] to-[#081040] border border-indigo-500/20 p-4 sm:p-5 hover:border-indigo-400/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center"><MdAssignment className="text-indigo-400 text-base" /></div>
              <span className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-wider">{t("stat_total_assignments")}</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white leading-none">{allAssignments.length}</h3>
            <p className="text-[11px] text-indigo-300/60 mt-1.5">{t("stat_total_assignments")}</p>
          </div>
          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a2e1f] to-[#071f14] border border-emerald-500/20 p-4 sm:p-5 hover:border-emerald-400/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center"><IoSchoolOutline className="text-emerald-400 text-base" /></div>
              <button onClick={() => navigate("/teacher-course")} className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-wider flex items-center gap-0.5 hover:text-emerald-300 transition cursor-pointer">{t("manage")} <IoChevronForward className="text-xs" /></button>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white leading-none">{courses.length}</h3>
            <p className="text-[11px] text-emerald-300/60 mt-1.5">{t("stat_my_courses")}</p>
          </div>
          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a1e3e] to-[#071530] border border-blue-500/20 p-4 sm:p-5 hover:border-blue-400/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center"><BsPeople className="text-blue-400 text-base" /></div>
              <span className="text-[9px] font-bold text-blue-400/60 uppercase tracking-wider">{t("stat_active_students")}</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white leading-none">{activeStudents}</h3>
            <p className="text-[11px] text-blue-300/60 mt-1.5">{t("stat_active_students")}</p>
          </div>
          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#2e1a08] to-[#1f1206] border border-amber-500/20 p-4 sm:p-5 hover:border-amber-400/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center"><HiOutlineBookOpen className="text-amber-400 text-base" /></div>
              <span className="text-[9px] font-bold text-amber-400/60 uppercase tracking-wider">{t("stat_pending_review")}</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white leading-none">{pendingReviews}</h3>
            <p className="text-[11px] text-amber-300/60 mt-1.5">{t("pending_reviews")}</p>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 items-start">

          {/* ──── LEFT: Lessons Panel ──── */}
          <div className="bg-gradient-to-br from-[#081340] to-[#050d2a] border border-indigo-500/15 rounded-2xl overflow-hidden">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-indigo-500/10 bg-indigo-950/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400/20 to-emerald-400/10 flex items-center justify-center border border-lime-400/20"><IoBookOutline className="text-lime-300 text-lg" /></div>
                <div>
                  <h2 className="text-white font-bold text-base">{t("lessons_title")}</h2>
                  <p className="text-indigo-300/50 text-[11px]">{t("lessons_subtitle")}</p>
                </div>
              </div>
              <button onClick={() => setShowLessonPanel(!showLessonPanel)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${showLessonPanel ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-gradient-to-r from-lime-400 to-emerald-400 text-black hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]"}`}>
                {showLessonPanel ? <IoClose className="text-lg" /> : <IoAdd className="text-lg" />}
                <span className="hidden sm:inline">{showLessonPanel ? t("cancel") : t("create_lesson_here")}</span>
              </button>
            </div>

            {/* Create Lesson Form */}
            {showLessonPanel && (
              <div className="px-5 py-4 bg-[#0a1a4a]/50 border-b border-indigo-500/10">
                <form onSubmit={handleCreateLesson} className="flex flex-col sm:flex-row gap-3">
                  <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="flex-1 rounded-xl bg-[#030712] border border-slate-700/50 p-3 text-sm text-white outline-none focus:border-lime-400/50 cursor-pointer transition">
                    <option value="">{t("select_course")}</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder={t("lesson_title")} required className="flex-1 rounded-xl bg-[#030712] border border-slate-700/50 p-3 text-sm text-white outline-none focus:border-lime-400/50 transition" />
                  <input value={lessonDesc} onChange={(e) => setLessonDesc(e.target.value)} placeholder={t("description_optional")} className="flex-1 rounded-xl bg-[#030712] border border-slate-700/50 p-3 text-sm text-white outline-none focus:border-lime-400/50 transition" />
                  <button type="submit" disabled={lessonSaving || !selectedCourseId || !lessonTitle.trim()} className="rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 text-black px-6 py-3 font-bold text-sm disabled:opacity-40 cursor-pointer hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all flex items-center justify-center gap-2 shrink-0">
                    {lessonSaving ? <CgSpinner className="animate-spin text-lg" /> : <><IoAdd className="text-lg" /> {t("save_lesson")}</>}
                  </button>
                </form>
              </div>
            )}

            {/* Course Selector */}
            <div className="px-5 pt-4 pb-2">
              <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="w-full rounded-xl bg-[#030712] border border-slate-700/50 p-3 text-sm text-white outline-none focus:border-indigo-400/50 cursor-pointer transition">
                <option value="">{t("select_course")}</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Lessons List + Activity Form */}
            <div className="px-5 pb-5 flex flex-col lg:flex-row gap-4 max-h-[600px] lg:max-h-[700px]">
              {/* Lessons list */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-indigo-400/50 font-bold mb-2 px-1">{t("recent_lessons")}</p>
                {lessonsLoading ? (
                  <div className="flex items-center gap-2 text-indigo-300/60 py-8 justify-center"><CgSpinner className="animate-spin text-lg" /><span className="text-xs">{t("lessons_loading")}</span></div>
                ) : lessons.length === 0 ? (
                  <div className="text-center py-10 rounded-xl border border-dashed border-indigo-500/20"><IoBookOutline className="text-3xl text-indigo-500/30 mx-auto mb-2" /><p className="text-slate-500 text-xs">{selectedCourseId ? t("no_lessons") : t("select_course")}</p></div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1 custom-scroll">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className={`group rounded-xl border p-3 cursor-pointer transition-all duration-200 shrink-0 ${selectedLesson?.id === lesson.id ? "border-lime-400/50 bg-lime-400/5" : "border-indigo-500/10 bg-[#0a0f35] hover:border-indigo-400/30 hover:bg-[#0e1445]"}`} onClick={() => openLesson(lesson)}>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${selectedLesson?.id === lesson.id ? "bg-lime-400/20 text-lime-300" : "bg-indigo-500/10 text-indigo-400"}`}><BiBook /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{lesson.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">{lesson.description || t("lesson_content_hint")}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => handleEditLesson(e, lesson)} className="p-1 rounded-md hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-300 transition cursor-pointer"><MdEdit className="text-xs" /></button>
                            <button onClick={(e) => handleDeleteLesson(e, lesson)} className="p-1 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition cursor-pointer"><BiTrash className="text-xs" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity form */}
              <div className="flex-1 min-w-0 overflow-y-auto pr-1 custom-scroll">
                {selectedLesson ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-lime-400/50 font-bold mb-2 px-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />{selectedLesson.title}</p>
                    {activitiesForLesson.length > 0 && (
                      <div className="flex flex-col gap-1.5 mb-3">
                        {activitiesForLesson.map((act) => {
                          const c = kindColors[act.kind] || kindColors.homework
                          return (
                            <div key={act.id} className="group/act rounded-xl bg-[#0a0f35] border border-indigo-500/10 p-2.5 flex items-center gap-2.5">
                              <span className="text-sm">{c.icon}</span>
                              <span className="font-medium text-white text-xs truncate flex-1">{act.title}</span>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{act.kind}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {/* Attendance button */}
                    <button type="button" onClick={openAttendanceModal} className="w-full mb-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2.5 font-bold text-xs cursor-pointer hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2">
                      <BiCheck className="text-sm" /> {t("mark_attendance")}
                    </button>
                    <form onSubmit={handleCreateActivity} className="flex flex-col gap-2.5">
                      <select value={activityKind} onChange={(e) => setActivityKind(e.target.value)} className="rounded-xl bg-[#030712] border border-slate-700/50 p-2.5 text-xs text-white outline-none cursor-pointer focus:border-indigo-400/50 transition">
                        <option value="homework">{t("activity_homework")}</option>
                        <option value="exam">{t("activity_exam")}</option>
                        <option value="quiz">{t("activity_quiz")}</option>
                        <option value="materials">{t("activity_materials")}</option>
                      </select>
                      <input value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} placeholder={t("activity_title")} required className="rounded-xl bg-[#030712] border border-slate-700/50 p-2.5 text-xs text-white outline-none focus:border-indigo-400/50 transition" />
                      <textarea value={activityDesc} onChange={(e) => setActivityDesc(e.target.value)} placeholder={t("instructions_optional")} rows={2} className="rounded-xl bg-[#030712] border border-slate-700/50 p-2.5 text-xs text-white outline-none focus:border-indigo-400/50 resize-none transition" />
                      <input type="datetime-local" value={activityDeadline} onChange={(e) => setActivityDeadline(e.target.value)} className="rounded-xl bg-[#030712] border border-slate-700/50 p-2.5 text-xs text-white outline-none focus:border-indigo-400/50 scheme-dark transition" />
                      <button type="submit" disabled={activitySaving || !activityTitle.trim()} className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2.5 font-bold text-xs cursor-pointer disabled:opacity-40 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2">
                        {activitySaving ? <CgSpinner className="animate-spin" /> : <><IoAdd className="text-sm" /> {t("add_activity")}</>}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 rounded-xl border border-dashed border-indigo-500/15"><IoBookOutline className="text-3xl text-indigo-500/20 mb-2" /><p className="text-slate-500 text-xs">{t("select_lesson")}</p></div>
                )}
              </div>
            </div>
          </div>

          {/* ──── RIGHT: Assignments ──── */}
          <div className="bg-gradient-to-br from-[#081340] to-[#050d2a] border border-indigo-500/15 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-indigo-500/10 bg-indigo-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center"><BsLightningChargeFill className="text-amber-400 text-sm" /></div>
                <h2 className="text-white font-bold text-sm">{t("submitted_assignments")}</h2>
              </div>
              <span className="text-[10px] font-bold text-indigo-400/50 bg-indigo-500/10 px-2.5 py-1 rounded-full">{t("total")}: {filteredAssignments.length}{selectedLesson ? ` / ${allAssignments.length}` : ''}</span>
            </div>
            <div className="p-4">
              {fetching || lessonLoading ? (
                <div className="flex items-center justify-center py-16"><CgSpinner className="animate-spin text-2xl text-indigo-400/40" /></div>
              ) : displayedAssignments.length === 0 ? (
                <div className="text-center py-16"><div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3"><MdAssignment className="text-2xl text-indigo-500/30" /></div><p className="text-slate-500 text-sm font-medium">{t("no_assignments_yet")}</p><p className="text-slate-600 text-xs mt-1">{t("lesson_flow_hint")}</p></div>
              ) : (
                <div className="flex flex-col gap-2">
                  {displayedAssignments.map((item) => {
                    const c = item.isActivity ? (kindColors[item.activityType] || kindColors.homework) : null
                    const subCount = submissions.filter((s) => String(s.assignmentId) === String(item.id)).length
                    return (
                      <div key={item.id} className="group/item bg-[#0a0f35] border border-indigo-500/10 rounded-xl p-3.5 hover:border-indigo-400/25 hover:bg-[#0e1445] transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm cursor-pointer ${c ? `${c.bg} border ${c.border}` : "bg-indigo-500/10"}`} onClick={() => openSubmissionsModal(item)}>
                            {item.isActivity ? c?.icon : <MdAssignment className="text-indigo-300 text-base" />}
                          </div>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openSubmissionsModal(item)}>
                            <p className="text-white font-semibold text-sm truncate">{item.name || item.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">{item.group?.name || item.courseName || ""}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.isActivity && <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${c?.bg} ${c?.text}`}>{item.activityType}</span>}
                            {subCount > 0 && <span className="text-[10px] text-indigo-300/60 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">{subCount}</span>}
                            {item.deadline && <span className="text-[10px] text-slate-600 flex items-center gap-0.5"><BiCalendar className="text-[10px]" />{new Date(item.deadline).toLocaleDateString()}</span>}
                            {item.isActivity && (
                              <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                <button onClick={(e) => handleEditAssignment(e, item)} className="p-1 rounded-md hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-300 transition cursor-pointer"><MdEdit className="text-xs" /></button>
                                <button onClick={(e) => handleDeleteAssignment(e, item)} className="p-1 rounded-md hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition cursor-pointer"><BiTrash className="text-xs" /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {filteredAssignments.length > 4 && (
                    <button onClick={() => setShowAll(!showAll)} className="text-center text-[11px] text-indigo-400/60 font-bold py-2.5 hover:text-indigo-300 transition cursor-pointer rounded-lg hover:bg-indigo-500/5">
                      {showAll ? t("show_less") : `${t("show_all")} (${filteredAssignments.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ DELETE ASSIGNMENT MODAL ═══ */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#0c1545] to-[#080e30] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center"><BiTrash className="text-red-400" /></div><h3 className="text-white font-bold">{t("delete")}</h3></div>
            <p className="text-slate-300/80 text-sm mb-6 leading-relaxed">{t("confirm_delete")} <span className="text-white font-semibold">{deleteTarget.name || deleteTarget.title}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl bg-slate-700/50 text-white p-3 text-sm font-bold hover:bg-slate-600/50 transition cursor-pointer border border-slate-600/30">{t("cancel")}</button>
              <button onClick={confirmDeleteAssignment} className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white p-3 text-sm font-bold hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition cursor-pointer">{t("delete")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE LESSON MODAL ═══ */}
      {deleteLessonTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#0c1545] to-[#080e30] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center"><BiTrash className="text-red-400" /></div><h3 className="text-white font-bold">{t("delete")} {t("lessons_title")}</h3></div>
            <p className="text-slate-300/80 text-sm mb-6 leading-relaxed">{t("confirm_delete")} <span className="text-white font-semibold">{deleteLessonTarget.title}</span>? Bu darsdagi barcha activitylar ham o'chiriladi.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteLessonTarget(null)} className="flex-1 rounded-xl bg-slate-700/50 text-white p-3 text-sm font-bold hover:bg-slate-600/50 transition cursor-pointer border border-slate-600/30">{t("cancel")}</button>
              <button onClick={confirmDeleteLesson} disabled={deleteLessonSaving} className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white p-3 text-sm font-bold hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteLessonSaving ? <CgSpinner className="animate-spin" /> : null} {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SUBMISSIONS MODAL ═══ */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#0c1545] to-[#080e30] border border-indigo-500/20 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-indigo-500/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${selectedAssignment.isActivity ? (kindColors[selectedAssignment.activityType]?.bg || "bg-blue-500/20") : "bg-indigo-500/15"}`}>
                  {selectedAssignment.isActivity ? kindColors[selectedAssignment.activityType]?.icon : "📝"}
                </div>
                <div>
                  <h3 className="text-white font-bold">{selectedAssignment.name || selectedAssignment.title}</h3>
                  <p className="text-indigo-300/50 text-xs">{selectedAssignment.group?.name || selectedAssignment.courseName}</p>
                </div>
              </div>
              <button onClick={() => setShowSubmissionsModal(false)} className="p-2 rounded-xl hover:bg-slate-700/50 text-slate-400 hover:text-white transition cursor-pointer"><IoClose className="text-xl" /></button>
            </div>

            {/* Submissions list */}
            <div className="flex-1 overflow-y-auto p-6 custom-scroll">
              {(() => {
                const subs = submissionsForAssignment(Number(selectedAssignment.id))
                if (subs.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3"><HiOutlineBookOpen className="text-2xl text-indigo-500/30" /></div>
                      <p className="text-slate-500 text-sm">{t("no_submissions_yet")}</p>
                    </div>
                  )
                }
                return (
                  <div className="flex flex-col gap-3">
                    {subs.map((sub, idx) => {
                      const isGraded = sub.grade != null
                      const accent = ACCENTS[idx % ACCENTS.length]
                      return (
                        <div key={sub.id} className="relative bg-[#0a1030] border border-indigo-900/40 rounded-xl p-4 overflow-hidden hover:border-indigo-500/30 transition">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${accent}`} />
                          <div className="pl-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${accent} flex items-center justify-center text-white text-xs font-bold`}>{sub.studentName?.[0]?.toUpperCase() || "S"}</div>
                                <span className="text-white font-semibold text-sm">{sub.studentName}</span>
                                {isGraded && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">{sub.grade}/100</span>}
                              </div>
                              <span className="text-slate-500 text-[10px]">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : ""}</span>
                            </div>
                            {sub.text && <a href={sub.text} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline text-xs break-all block mb-2">{sub.text}</a>}
                            {sub.feedback && <p className="text-slate-400 text-xs mb-2">💬 {sub.feedback}</p>}
                            <div className="flex items-center gap-2 mt-2">
                              <input type="number" min={0} max={100} value={isGraded ? String(sub.grade) : gradeInput} onChange={(e) => setGradeInput(e.target.value)} placeholder="0-100" className="w-20 bg-[#030712] text-white text-xs px-2 py-1.5 rounded-lg border border-slate-700/50 outline-none focus:border-indigo-500" />
                              <input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} placeholder="Feedback..." className="flex-1 bg-[#030712] text-white text-xs px-2 py-1.5 rounded-lg border border-slate-700/50 outline-none focus:border-indigo-500" />
                              <button onClick={() => handleGradeSubmission(sub.id)} disabled={gradingKey === String(sub.id)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-lime-400 to-emerald-400 text-black text-xs font-bold cursor-pointer disabled:opacity-50 hover:shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-all flex items-center gap-1">
                                {gradingKey === String(sub.id) ? <CgSpinner className="animate-spin" /> : <BiCheck className="text-sm" />}
                                {t("save")}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ═══ EDIT ASSIGNMENT MODAL ═══ */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#0c1545] to-[#080e30] border border-indigo-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-5"><div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center"><MdEdit className="text-indigo-400" /></div><h3 className="text-white font-bold">{t("edit")} {t("activity_" + (editingAssignment.activityType || "homework"))}</h3></div>
            <div className="flex flex-col gap-3">
              <input value={editAssignmentTitle} onChange={(e) => setEditAssignmentTitle(e.target.value)} placeholder={t("activity_title")} className="rounded-xl bg-[#030712] border border-slate-700/50 p-3 text-sm text-white outline-none focus:border-indigo-400/50 transition" />
              <textarea value={editAssignmentDesc} onChange={(e) => setEditAssignmentDesc(e.target.value)} placeholder={t("instructions_optional")} rows={3} className="rounded-xl bg-[#030712] border border-slate-700/50 p-3 text-sm text-white outline-none focus:border-indigo-400/50 resize-none transition" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingAssignment(null)} className="flex-1 rounded-xl bg-slate-700/50 text-white p-3 text-sm font-bold hover:bg-slate-600/50 transition cursor-pointer border border-slate-600/30">{t("cancel")}</button>
              <button onClick={confirmEditAssignment} disabled={editAssignmentSaving || !editAssignmentTitle.trim()} className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 text-sm font-bold hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {editAssignmentSaving ? <CgSpinner className="animate-spin" /> : null} {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EDIT LESSON MODAL ═══ */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#0c1545] to-[#080e30] border border-lime-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-5"><div className="w-10 h-10 rounded-xl bg-lime-500/15 flex items-center justify-center"><IoBookOutline className="text-lime-400" /></div><h3 className="text-white font-bold">{t("edit")} {t("lessons_title")}</h3></div>
            <div className="flex flex-col gap-3">
              <input value={editLessonTitle} onChange={(e) => setEditLessonTitle(e.target.value)} placeholder={t("lesson_title")} className="rounded-xl bg-[#030712] border border-slate-700/50 p-3 text-sm text-white outline-none focus:border-lime-400/50 transition" />
              <textarea value={editLessonDesc} onChange={(e) => setEditLessonDesc(e.target.value)} placeholder={t("description_optional")} rows={3} className="rounded-xl bg-[#030712] border border-slate-700/50 p-3 text-sm text-white outline-none focus:border-lime-400/50 resize-none transition" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingLesson(null)} className="flex-1 rounded-xl bg-slate-700/50 text-white p-3 text-sm font-bold hover:bg-slate-600/50 transition cursor-pointer border border-slate-600/30">{t("cancel")}</button>
              <button onClick={confirmEditLesson} disabled={editLessonSaving || !editLessonTitle.trim()} className="flex-1 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 text-black p-3 text-sm font-bold hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {editLessonSaving ? <CgSpinner className="animate-spin" /> : null} {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ATTENDANCE MODAL ═══ */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#0c1545] to-[#080e30] border border-blue-500/20 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-blue-500/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center"><BiCheck className="text-blue-400 text-lg" /></div>
                <div>
                  <h3 className="text-white font-bold">{t("attendance")}</h3>
                  <p className="text-blue-300/50 text-xs">{selectedLesson?.title}</p>
                </div>
              </div>
              <button onClick={() => setShowAttendanceModal(false)} className="p-2 rounded-xl hover:bg-slate-700/50 text-slate-400 hover:text-white transition cursor-pointer"><IoClose className="text-xl" /></button>
            </div>

            {/* Student list */}
            <div className="flex-1 overflow-y-auto p-6 custom-scroll">
              {attendanceLoading ? (
                <div className="flex items-center justify-center py-12"><CgSpinner className="animate-spin text-2xl text-blue-400/40" /></div>
              ) : attendanceList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3"><BsPeople className="text-2xl text-blue-500/30" /></div>
                  <p className="text-slate-500 text-sm">{t("no_students")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {attendanceList.map((student) => (
                    <div key={student.user_id} className="bg-[#0a1030] border border-indigo-900/40 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {student.name?.[0]?.toUpperCase() || "S"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{student.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateAttendanceStatus(student.user_id, "present")}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${student.status === "present" ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}
                        >{t("present")} <span className="opacity-60">+10</span></button>
                        <button
                          onClick={() => updateAttendanceStatus(student.user_id, "absent")}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${student.status === "absent" ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}
                        >{t("absent")} <span className="opacity-60">0</span></button>
                        <button
                          onClick={() => updateAttendanceStatus(student.user_id, "late")}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${student.status === "late" ? "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"}`}
                        >{t("late")} <span className="opacity-60">+7</span></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-blue-500/10 flex gap-3 shrink-0">
              <button onClick={() => setShowAttendanceModal(false)} className="flex-1 rounded-xl bg-slate-700/50 text-white p-3 text-sm font-bold hover:bg-slate-600/50 transition cursor-pointer border border-slate-600/30">{t("cancel")}</button>
              <button onClick={saveAttendance} disabled={attendanceSaving || attendanceList.length === 0} className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 text-sm font-bold hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {attendanceSaving ? <CgSpinner className="animate-spin" /> : <><BiCheck /> {t("save")}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard
