
import { useEffect, useMemo, useState } from "react"
import { BiSearch, BiChevronLeft, BiChevronRight, BiDotsVerticalRounded, BiCopy } from "react-icons/bi"
import { HiOutlineUsers } from "react-icons/hi2"
import { IoCheckmarkCircle } from "react-icons/io5"
import { CgSpinner } from "react-icons/cg"
import { toast } from "react-toastify"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useCourses } from "../Providers/CourseProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { resolveAvatarUrl } from "../Providers/AuthProvider"
import api from "../api"
import { normalizeAttendanceList } from "../utils/backend"
import { attendancePoints } from "../utils/scoring"
import { studentCode } from "../utils/studentCode"
import { toCsv, downloadCsv } from "../utils/csv"

// Avatar with photo + initials fallback (photo comes from profile_pic)
const StudentAvatar = ({ student, size = "w-10 h-10 text-sm" }) => {
  const src = resolveAvatarUrl(student.profile_pic)
  const initial = student.full_name?.[0]?.toUpperCase() || "S"
  return (
    <div className={`${size} rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold shrink-0`}>
      {src ? (
        <img
          src={src}
          alt={student.full_name || "Student"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none"
            e.currentTarget.nextElementSibling?.classList.remove("hidden")
          }}
        />
      ) : null}
      <span className={src ? "hidden" : ""}>{initial}</span>
    </div>
  )
}

const PAGE_SIZE = 6

const TeacherStudents = () => {
  const { t } = useLanguage()
  const { courses, fetching: coursesFetching } = useCourses()
  const { assignmentsList, submissions, fetching: assignmentsFetching } = useAssignments()
  const [search, setSearch] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [page, setPage] = useState(1)
  const [students, setStudents] = useState([])
  const [studentsFetching, setStudentsFetching] = useState(true)
  const [attendanceRows, setAttendanceRows] = useState([]) // [{studentId, status, lessonId}]

  useEffect(() => {
    let cancelled = false
    api.get('/teacher/students')
      .then((response) => { if (!cancelled) setStudents(Array.isArray(response.data) ? response.data : response.data?.items || []) })
      .catch(() => { if (!cancelled) setStudents([]) })
      .finally(() => { if (!cancelled) setStudentsFetching(false) })
    return () => { cancelled = true }
  }, [])

  // Attendance across every lesson of every course — points are derived from
  // status on the client (present +10, late +7, absent +0).
  useEffect(() => {
    let cancelled = false
    if (!courses.length) return
    Promise.allSettled(courses.map((c) => api.get(`/groups/${c.id}/lessons`)))
      .then(async (lessonResults) => {
        if (cancelled) return
        const lessons = []
        const seen = new Set()
        lessonResults.forEach((r) => {
          if (r.status !== 'fulfilled') return
          const items = Array.isArray(r.value.data) ? r.value.data : r.value.data?.items || []
          items.forEach((l) => {
            if (seen.has(l.id)) return
            seen.add(l.id)
            lessons.push(l)
          })
        })
        if (!lessons.length) { if (!cancelled) setAttendanceRows([]); return }
        const attResults = await Promise.allSettled(
          lessons.map((l) => api.get(`/lessons/${l.id}/attendance`))
        )
        const rows = []
        const seenRows = new Set()
        attResults.forEach((r, idx) => {
          if (r.status !== 'fulfilled') return
          normalizeAttendanceList(r.value.data).forEach((a) => {
            const key = `${a.id ?? ''}:${a.studentId}`
            if (seenRows.has(key)) return
            seenRows.add(key)
            rows.push({ ...a, lessonId: lessons[idx]?.id })
          })
        })
        if (!cancelled) setAttendanceRows(rows)
      })
      .catch(() => { if (!cancelled) setAttendanceRows([]) })
    return () => { cancelled = true }
  }, [courses])

  const studentsWithProgress = useMemo(() => students
    .filter((student) => selectedCourse === 'all' || String(student.group_id) === String(selectedCourse))
    .map((student) => {
      const studentSubmissions = submissions.filter((submission) => String(submission.studentId) === String(student.id))
      const graded = studentSubmissions.filter((submission) => submission.grade !== null && submission.grade !== undefined)
      // Score = homework grades (1 grade point per grade unit) + attendance
      // points from status (present +10, late +7, absent +0).
      const attendanceSum = attendanceRows
        .filter((row) => String(row.studentId) === String(student.id))
        .reduce((sum, row) => sum + attendancePoints(row.status), 0)
      return {
        ...student,
        score: graded.reduce((sum, submission) => sum + Number(submission.grade), 0) + attendanceSum,
        submitted: studentSubmissions.length,
        totalAssignments: assignmentsList.filter((assignment) => String(assignment.group_id) === String(student.group_id)).length
      }
    }), [assignmentsList, selectedCourse, students, submissions, attendanceRows])

  const filteredStudents = studentsWithProgress.filter((student) => {
    const query = search.trim().toLowerCase()
    return !query || student.full_name?.toLowerCase().includes(query) || student.email?.toLowerCase().includes(query)
  })
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE))
  const visibleStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const isLoading = coursesFetching || assignmentsFetching || studentsFetching

  // Roster dump: student, ID code, score breakdown, submission count.
  const exportCsv = () => {
    if (studentsWithProgress.length === 0) {
      toast.error(t("export_no_data"))
      return
    }
    const headers = [t("student_label"), "Email", "ID", "Score", "Homework pts", "Attendance pts", "Submitted"]
    const rows = studentsWithProgress.map((s) => {
      const attendanceSum = attendanceRows
        .filter((row) => String(row.studentId) === String(s.id))
        .reduce((sum, row) => sum + attendancePoints(row.status), 0)
      const graded = submissions.filter((sub) => String(sub.studentId) === String(s.id) && sub.grade !== null && sub.grade !== undefined)
      return [
        s.full_name || "",
        s.email || "",
        studentCode(s),
        s.score ?? 0,
        graded.reduce((sum, sub) => sum + Number(sub.grade), 0),
        attendanceSum,
        s.submitted ?? 0,
      ]
    })
    downloadCsv(`students_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows))
    toast.success(t("export_done"))
  }

  return (
    <div className="min-h-screen w-full bg-[#03071e] text-white px-5 py-6 sm:px-10 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-lime-300 font-bold mb-3">{t('teacher_students_eyebrow')}</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t('teacher_students_title')}</h1>
          <p className="text-indigo-300 mt-2 max-w-2xl">{t('teacher_students_subtitle')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="relative flex-1">
            <span className="sr-only">{t('search_students')}</span>
            <BiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder={t('search_students')} className="w-full bg-[#0b153f] border border-indigo-800/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-indigo-400/70 outline-none focus:border-lime-400" />
          </label>
          <select value={selectedCourse} onChange={(event) => { setSelectedCourse(event.target.value); setPage(1) }} className="bg-[#0b153f] border border-indigo-800/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-lime-400 cursor-pointer">
            <option value="all">{t('all_courses')}</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
          <button onClick={exportCsv} className="px-4 py-3 rounded-xl bg-[#0e1b52] border border-indigo-500/40 text-indigo-200 text-sm font-semibold hover:bg-indigo-600 transition-colors cursor-pointer shrink-0">
            ⬇ {t('export_csv')}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-indigo-300 mb-3 px-2">
          <span>{t('student_count', filteredStudents.length)}</span>
          <span>{t('completed_assignments')}</span>
        </div>

        <section className="bg-[#0b153f] border border-indigo-800/50 rounded-2xl overflow-hidden">
          {isLoading && students.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-20 text-indigo-300"><CgSpinner className="animate-spin" /> {t('loading')}</div>
          ) : visibleStudents.length === 0 ? (
            <div className="py-20 text-center text-slate-400"><HiOutlineUsers className="text-5xl mx-auto mb-3 text-indigo-500" />{t('no_students')}</div>
          ) : (
            <div className="divide-y divide-indigo-900/60">
              {visibleStudents.map((student) => {
                const percent = student.totalAssignments ? Math.min(100, Math.round((student.submitted / student.totalAssignments) * 100)) : 0
                return (
                  <div key={student.id} className="flex items-center gap-4 px-5 sm:px-7 py-4 hover:bg-indigo-900/20 transition-colors">
                    <StudentAvatar student={student} />
                    <div className="min-w-0 w-44 shrink-0">
                      <p className="text-white font-semibold truncate">{student.full_name}</p>
                      <p className="text-xs text-indigo-300 truncate">{student.email}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(studentCode(student))
                          toast.success("ID copied")
                        }}
                        title="Copy student ID"
                        className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-lime-300 transition-colors cursor-pointer"
                      >
                        <BiCopy /> ID: {studentCode(student)}
                      </button>
                    </div>
                    <div className="flex-1 min-w-24"><div className="h-2 rounded-full bg-[#030712] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-400" style={{ width: `${percent}%` }} /></div></div>
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 w-28"><IoCheckmarkCircle className="text-lime-300" /> {student.submitted}/{student.totalAssignments || 0}</div>
                    <div className="w-20 text-right font-bold text-lime-300">{student.score} {t('pts_label')}</div>
                    <button title={t('more_actions')} className="text-indigo-400 hover:text-white cursor-pointer"><BiDotsVerticalRounded size={20} /></button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <div className="flex items-center justify-between mt-5 text-xs text-indigo-300">
          <span>{t('student_page', filteredStudents.length, page, pageCount)}</span>
          <div className="flex items-center gap-1"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="w-8 h-8 rounded-lg bg-[#0b153f] border border-indigo-800 disabled:opacity-40 cursor-pointer"><BiChevronLeft className="mx-auto" /></button><span className="px-3">{page} / {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} className="w-8 h-8 rounded-lg bg-[#0b153f] border border-indigo-800 disabled:opacity-40 cursor-pointer"><BiChevronRight className="mx-auto" /></button></div>
        </div>
      </div>
    </div>
  )
}

export default TeacherStudents
