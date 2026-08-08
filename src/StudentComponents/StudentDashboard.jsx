import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { HiOutlineBookOpen, HiOutlineClipboardList } from "react-icons/hi"
import { FaRegStar } from "react-icons/fa"
import { IoChevronForward } from "react-icons/io5"
import { BiCalendar } from "react-icons/bi"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useAuth } from "../Providers/AuthProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { useCourses } from "../Providers/CourseProvider"

const getDeadlineStatus = (deadlineStr, t) => {
  if (!deadlineStr) return { label: t('not_set'), color: "text-slate-500" }

  const now = new Date()
  const deadlineDate = new Date(deadlineStr)
  const diffMs = deadlineDate - now

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffMs) / (1000 * 60 * 60)
    if (overdueHours < 24) return { label: `-${Math.max(1, Math.round(overdueHours))}h`, color: "text-red-400" }
    const overdueDays = Math.floor(overdueHours / 24)
    return { label: `-${overdueDays}d`, color: "text-red-400" }
  }

  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 1) {
    const diffMin = Math.max(1, Math.round(diffMs / (1000 * 60)))
    return { label: `${diffMin}min`, color: "text-red-400" }
  }
  if (diffHours < 24) return { label: `${Math.round(diffHours)}h`, color: "text-amber-400" }
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return { label: "1d", color: "text-amber-300" }
  return { label: `${diffDays}d`, color: "text-emerald-400" }
}

const formatDate = (deadlineStr, t) => {
  if (!deadlineStr) return t('not_set')
  const date = new Date(deadlineStr)
  if (isNaN(date)) return deadlineStr
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

const StudentDashboard = () => {
  const { assignmentsList, fetching } = useAssignments()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { enrollments } = useCourses()
  const navigate = useNavigate()
  const [filter, setFilter] = useState("all") // "all" | "pending"

  const studentFullName = user?.full_name || "Unknown Student"

  const studentName = useMemo(() => studentFullName.split(" ")[0] || "Student", [studentFullName])

  const myCourseIds = useMemo(
    () => new Set(enrollments.filter((e) => e.studentEmail === user?.email).map((e) => String(e.courseId))),
    [enrollments, user]
  )


  const myVisibleAssignments = useMemo(
    () => assignmentsList.filter((a) => !a.courseId || myCourseIds.has(String(a.courseId))),
    [assignmentsList, myCourseIds]
  )

  const hasMySubmission = (item) =>
    Array.isArray(item.submissions) && item.submissions.some((s) => s.studentName === studentFullName)

  const pendingCount = myVisibleAssignments.filter((item) => !hasMySubmission(item)).length

  const visibleAssignments = filter === "pending"
    ? myVisibleAssignments.filter((item) => !hasMySubmission(item))
    : myVisibleAssignments

  return (
    <div className="relative min-h-screen w-full bg-[#03071e] flex">
      <div className="hidden sm:flex flex-col items-center gap-6 py-8 px-4 text-indigo-400">
        <button className="w-10 h-10 rounded-xl bg-[#0e1b52] flex items-center justify-center hover:text-white transition-colors cursor-pointer">
          <HiOutlineBookOpen size={20} />
        </button>
        <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:text-white transition-colors cursor-pointer">
          <HiOutlineClipboardList size={20} />
        </button>
        <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:text-white transition-colors cursor-pointer">
          <FaRegStar size={18} />
        </button>
      </div>

      <div className="flex-1 p-6 sm:p-10">
        <p className="text-[11px] font-bold tracking-widest text-purple-400 mb-2">{t('welcome_back').toUpperCase()}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          {t('hi')}, <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">{studentName}!</span>
        </h1>
        <p className="text-indigo-300 text-sm sm:text-base mb-8">
          {t('student_summary', myVisibleAssignments.length, pendingCount)}
        </p>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
            {t('current_assignments')}
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === "all" ? "bg-[#0e1b52] text-white" : "text-indigo-400 hover:text-white"
              }`}
            >
              {t('filter_all')}
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === "pending" ? "bg-indigo-600 text-white" : "text-indigo-400 hover:text-white"
              }`}
            >
              {t('filter_pending')}
            </button>
          </div>
        </div>

        {fetching && myVisibleAssignments.length === 0 ? (
          <p className="text-white text-center pt-20">{t('loading')}</p>
        ) : visibleAssignments.length === 0 ? (
          <p className="text-slate-400 text-center pt-20 text-xl">{t('no_assignments_here')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleAssignments.map((item) => {
              const deadlineStatus = getDeadlineStatus(item.deadline, t)
              const mySub = Array.isArray(item.submissions)
                ? item.submissions.find((s) => s.studentName === studentFullName)
                : null
              const isGraded = mySub && mySub.grade !== undefined && mySub.grade !== null && mySub.grade !== ""

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/assignment/${item.id}`)}
                  className="bg-[#0a1030] border border-indigo-900/40 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-indigo-500/40 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold truncate">{item.assignment}</h3>
                      {item.courseName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 shrink-0">
                          {item.courseName}
                        </span>
                      )}
                      {mySub?.late && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 shrink-0">
                          {t('late_badge')}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-1">{t('teacher_label')}: {item.teacherName || t('not_set')}</p>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] tracking-wider text-indigo-400 font-semibold flex items-center justify-end gap-1">
                        <BiCalendar /> {formatDate(item.deadline, t)}
                      </p>
                      <p className={`text-sm font-medium ${deadlineStatus.color}`}>{deadlineStatus.label}</p>
                    </div>

                    {isGraded ? (
                      <span className="text-xs font-bold hidden sm:inline text-emerald-400">
                        {mySub.grade}/100
                      </span>
                    ) : (
                      <span className={`text-xs font-semibold hidden sm:inline ${hasMySubmission(item) ? "text-emerald-400" : "text-slate-500"}`}>
                        {hasMySubmission(item) ? t('submitted') : t('not_submitted')}
                      </span>
                    )}

                    <IoChevronForward className="text-indigo-400" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentDashboard