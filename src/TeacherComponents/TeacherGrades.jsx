import { useMemo, useState } from "react"
import { BiSearch, BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { IoCheckmarkCircle } from "react-icons/io5"
import { HiOutlineDocumentText } from "react-icons/hi2"
import { CgSpinner } from "react-icons/cg"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useCourses } from "../Providers/CourseProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { parseServerDate } from "../utils/datetime"
import { toCsv, downloadCsv } from "../utils/csv"
import { toast } from "react-toastify"

const PAGE_SIZE = 10

const TeacherGrades = () => {
  const { t } = useLanguage()
  const { courses } = useCourses()
  const { assignmentsList, submissions, fetching } = useAssignments()
  const [search, setSearch] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [selectedAssignment, setSelectedAssignment] = useState("all")
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState("name") // name | grade | date

  // Build per-student grade summaries
  const studentGrades = useMemo(() => {
    const map = new Map()

    submissions.forEach((sub) => {
      const key = String(sub.studentId)
      if (!map.has(key)) {
        map.set(key, {
          studentId: sub.studentId,
          studentName: sub.studentName || `Student #${sub.studentId}`,
          studentEmail: sub.studentEmail || "",
          submissions: [],
          totalGrade: 0,
          gradedCount: 0,
          totalCount: 0,
        })
      }
      const entry = map.get(key)
      entry.submissions.push(sub)
      entry.totalCount++
      if (sub.grade !== null && sub.grade !== undefined && sub.grade !== "") {
        entry.totalGrade += Number(sub.grade)
        entry.gradedCount++
      }
    })

    return [...map.values()].map((entry) => ({
      ...entry,
      averageGrade: entry.gradedCount > 0 ? Math.round(entry.totalGrade / entry.gradedCount) : null,
    }))
  }, [submissions])

  // Filter by course
  const courseFiltered = useMemo(() => {
    if (selectedCourse === "all") return studentGrades
    const assignmentIds = new Set(
      assignmentsList
        .filter((a) => String(a.group_id) === String(selectedCourse))
        .map((a) => String(a.id))
    )
    return studentGrades.filter((s) =>
      s.submissions.some((sub) => assignmentIds.has(String(sub.assignmentId)))
    )
  }, [studentGrades, selectedCourse, assignmentsList])

  // Filter by assignment
  const assignmentFiltered = useMemo(() => {
    if (selectedAssignment === "all") return courseFiltered
    return courseFiltered.filter((s) =>
      s.submissions.some((sub) => String(sub.assignmentId) === String(selectedAssignment))
    )
  }, [courseFiltered, selectedAssignment])

  // Search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return assignmentFiltered
    return assignmentFiltered.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.studentEmail.toLowerCase().includes(q)
    )
  }, [assignmentFiltered, search])

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered]
    if (sortBy === "grade") {
      copy.sort((a, b) => (b.averageGrade ?? -1) - (a.averageGrade ?? -1))
    } else if (sortBy === "date") {
      copy.sort((a, b) => {
        const latestA = a.submissions.reduce(
          (max, s) => Math.max(max, parseServerDate(s.submittedAt || 0)?.getTime() ?? 0),
          0
        )
        const latestB = b.submissions.reduce(
          (max, s) => Math.max(max, parseServerDate(s.submittedAt || 0)?.getTime() ?? 0),
          0
        )
        return latestB - latestA
      })
    } else {
      copy.sort((a, b) => a.studentName.localeCompare(b.studentName))
    }
    return copy
  }, [filtered, sortBy])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Stats
  const totalGraded = submissions.filter(
    (s) => s.grade !== null && s.grade !== undefined
  ).length
  const totalSubmissions = submissions.length
  const pendingGrades = totalSubmissions - totalGraded

  // Assignments for the selected course
  const filteredAssignments = useMemo(() => {
    if (selectedCourse === "all") return assignmentsList
    return assignmentsList.filter((a) => String(a.group_id) === String(selectedCourse))
  }, [assignmentsList, selectedCourse])

  const getGradeColor = (grade) => {
    if (grade === null || grade === undefined) return "text-slate-500"
    if (grade >= 90) return "text-emerald-400"
    if (grade >= 70) return "text-lime-400"
    if (grade >= 50) return "text-amber-400"
    return "text-red-400"
  }

  // One row per submission — full grade book dump for Excel.
  const exportCsv = () => {
    if (submissions.length === 0) {
      toast.error(t("export_no_data"))
      return
    }
    const headers = [t("student_label"), "Email", t("assignment_label"), "Grade", "Late", "Submitted at", "Feedback"]
    const rows = submissions.map((s) => [
      s.studentName || `Student #${s.studentId}`,
      s.studentEmail || "",
      assignmentsList.find((a) => String(a.id) === String(s.assignmentId))?.name || s.assignmentId,
      s.grade ?? "",
      s.late ? "yes" : "no",
      s.submittedAt ? new Date(parseServerDate(s.submittedAt)).toLocaleString() : "",
      s.feedback || "",
    ])
    downloadCsv(`grades_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows))
    toast.success(t("export_done"))
  }

  return (
    <div className="min-h-screen w-full bg-[#03071e] text-white px-5 py-6 sm:px-10 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-lime-300 font-bold mb-3">
            {t("nav_grades")}
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            {t("nav_grades")}
          </h1>
          <p className="text-indigo-300 mt-2 max-w-2xl">
            {t('view_manage_grades')}
          </p>
          <button
            onClick={exportCsv}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0e1b52] border border-indigo-500/40 text-indigo-200 text-sm font-semibold hover:bg-indigo-600 transition-colors cursor-pointer"
          >
            ⬇ {t("export_csv")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0b153f] border border-indigo-800/50 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
              {t("total_label")}
            </p>
            <p className="text-3xl text-white font-bold mt-2">{totalSubmissions}</p>
            <p className="text-indigo-300 text-sm mt-1">{t('submissions_word')}</p>
          </div>
          <div className="bg-[#0b153f] border border-emerald-800/30 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              GRADED
            </p>
            <p className="text-3xl text-white font-bold mt-2">{totalGraded}</p>
            <p className="text-emerald-300 text-sm mt-1">{t('completed_reviews')}</p>
          </div>
          <div className="bg-[#0b153f] border border-amber-800/30 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
              PENDING
            </p>
            <p className="text-3xl text-white font-bold mt-2">{pendingGrades}</p>
            <p className="text-amber-300 text-sm mt-1">{t('awaiting_review')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="relative flex-1">
            <span className="sr-only">{t("search_students")}</span>
            <BiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder={t("search_students")}
              className="w-full bg-[#0b153f] border border-indigo-800/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-indigo-400/70 outline-none focus:border-lime-400"
            />
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value)
              setSelectedAssignment("all")
              setPage(1)
            }}
            className="bg-[#0b153f] border border-indigo-800/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-lime-400 cursor-pointer"
          >
            <option value="all">{t("all_courses")}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <select
            value={selectedAssignment}
            onChange={(e) => {
              setSelectedAssignment(e.target.value)
              setPage(1)
            }}
            className="bg-[#0b153f] border border-indigo-800/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-lime-400 cursor-pointer"
          >
            <option value="all">{t('all_assignments')}</option>
            {filteredAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0b153f] border border-indigo-800/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-lime-400 cursor-pointer"
          >
            <option value="name">{t('sort_by_name')}</option>
            <option value="grade">{t('sort_by_grade')}</option>
            <option value="date">{t('sort_by_date')}</option>
          </select>
        </div>

        {/* Table */}
        <section className="bg-[#0b153f] border border-indigo-800/50 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_100px_100px_100px] gap-4 px-7 py-3 border-b border-indigo-800/50 text-[10px] uppercase tracking-wider text-indigo-400 font-bold">              <span>{t('student_column')}</span>
            <span className="text-center">{t('submissions_column')}</span>
            <span className="text-center">{t('graded_column')}</span>
            <span className="text-center">{t('avg_grade_column')}</span>
            <span className="text-right">{t('status_column')}</span>
          </div>

          {fetching && sorted.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-20 text-indigo-300">
              <CgSpinner className="animate-spin" /> {t("loading")}
            </div>
          ) : visible.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <HiOutlineDocumentText className="text-5xl mx-auto mb-3 text-indigo-500" />
              {t('no_grade_data')}
            </div>
          ) : (
            <div className="divide-y divide-indigo-900/60">
              {visible.map((student) => (
                <div
                  key={student.studentId}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_120px_100px_100px_100px] gap-3 sm:gap-4 items-center px-5 sm:px-7 py-4 hover:bg-indigo-900/20 transition-colors"
                >
                  {/* Student info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {student.studentName?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate text-sm">
                        {student.studentName}
                      </p>
                      <p className="text-[11px] text-indigo-300 truncate">
                        {student.studentEmail}
                      </p>
                    </div>
                  </div>

                  {/* Submissions count */}
                  <div className="text-center">
                    <span className="text-white font-bold text-sm">
                      {student.totalCount}
                    </span>
                  </div>

                  {/* Graded count */}
                  <div className="text-center">
                    <span className="text-emerald-400 font-bold text-sm">
                      {student.gradedCount}
                    </span>
                  </div>

                  {/* Average grade */}
                  <div className="text-center">
                    {student.averageGrade !== null ? (
                      <span
                        className={`font-bold text-sm ${getGradeColor(student.averageGrade)}`}
                      >
                        {student.averageGrade}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-sm">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="text-right">
                    {student.gradedCount === student.totalCount && student.totalCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                        <IoCheckmarkCircle /> {t('status_complete')}
                      </span>
                    ) : student.gradedCount > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-400">
                        {t('status_partial')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-500/15 text-slate-400">
                        {t('status_pending')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        {sorted.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-5 text-xs text-indigo-300">
            <span>
              {sorted.length} total • Page {page} of {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="w-8 h-8 rounded-lg bg-[#0b153f] border border-indigo-800 disabled:opacity-40 cursor-pointer"
              >
                <BiChevronLeft className="mx-auto" />
              </button>
              <span className="px-3">
                {page} / {pageCount}
              </span>
              <button
                disabled={page === pageCount}
                onClick={() => setPage((p) => p + 1)}
                className="w-8 h-8 rounded-lg bg-[#0b153f] border border-indigo-800 disabled:opacity-40 cursor-pointer"
              >
                <BiChevronRight className="mx-auto" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherGrades
