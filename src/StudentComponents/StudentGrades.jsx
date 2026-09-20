import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { BiArrowBack } from "react-icons/bi"
import { IoCheckmarkCircle, IoTimeOutline } from "react-icons/io5"
import { HiOutlineDocumentText } from "react-icons/hi2"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useAuth } from "../Providers/AuthProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { formatDate, parseServerDate } from "../utils/datetime"
import { StudentGradeCharts } from "../SmallComponents/Analytics"

// formatDate now comes from utils/datetime (UTC-safe)

const getGradeColor = (grade) => {
  if (grade === null || grade === undefined) return "text-slate-500"
  if (grade >= 90) return "text-emerald-400"
  if (grade >= 70) return "text-lime-400"
  if (grade >= 50) return "text-amber-400"
  return "text-red-400"
}

const StudentGrades = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { assignmentsList, submissions } = useAssignments()

  const mySubmissions = useMemo(() => {
    return submissions.filter(
      (s) =>
        (!s.studentEmail || !user?.email ||
          String(s.studentEmail).toLowerCase() === String(user.email).toLowerCase())
    )
  }, [submissions, user])

  const gradesWithAssignment = useMemo(() => {
    const assignmentMap = new Map(assignmentsList.map((a) => [String(a.id), a]))
    return mySubmissions
      .map((sub) => ({
        ...sub,
        assignment: assignmentMap.get(String(sub.assignmentId)),
      }))
      .sort((a, b) => parseServerDate(b.submittedAt || 0) - parseServerDate(a.submittedAt || 0))
  }, [mySubmissions, assignmentsList])

  const gradedSubmissions = gradesWithAssignment.filter(
    (g) => g.grade !== null && g.grade !== undefined && g.grade !== ""
  )
  const pendingSubmissions = gradesWithAssignment.filter(
    (g) => g.grade === null || g.grade === undefined || g.grade === ""
  )

  const averageGrade = gradedSubmissions.length > 0
    ? Math.round(
        gradedSubmissions.reduce((sum, g) => sum + Number(g.grade), 0) /
          gradedSubmissions.length
      )
    : null

  return (
    <div className="min-h-screen w-full bg-[#03071e] text-white px-5 py-6 sm:px-10 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/student-dashboard")}
          className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors mb-8 cursor-pointer"
        >
          <BiArrowBack /> {t("back_to_dashboard")}
        </button>

        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-lime-300 font-bold mb-3">
            {t("nav_grades")}
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            {t("nav_grades")}
          </h1>
          <p className="text-indigo-300 mt-2">
            {t('grades_across')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 stagger stagger">
          <div className="bg-[#0b153f] border border-indigo-800/50 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
              {t("total_label")}
            </p>
            <p className="text-3xl text-white font-bold mt-2">
              {gradesWithAssignment.length}
            </p>
            <p className="text-indigo-300 text-sm mt-1">{t('submissions_word_short')}</p>
          </div>
          <div className="bg-[#0b153f] border border-emerald-800/30 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              GRADED
            </p>
            <p className="text-3xl text-white font-bold mt-2">
              {gradedSubmissions.length}
            </p>
            <p className="text-emerald-300 text-sm mt-1">{t('completed_word')}</p>
          </div>
          <div className="bg-[#0b153f] border border-purple-800/30 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">
              AVERAGE
            </p>
            <p
              className={`text-3xl font-bold mt-2 ${getGradeColor(averageGrade)}`}
            >
              {averageGrade !== null ? `${averageGrade}` : "—"}
            </p>
            <p className="text-purple-300 text-sm mt-1">{t('avg_grade_word')}</p>
          </div>
          <div className="bg-[#0b153f] border border-amber-800/30 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
              PENDING
            </p>
            <p className="text-3xl text-white font-bold mt-2">
              {pendingSubmissions.length}
            </p>
            <p className="text-amber-300 text-sm mt-1">{t('awaiting_review_word')}</p>
          </div>
        </div>

        {/* Charts */}
        <StudentGradeCharts gradesWithAssignment={gradesWithAssignment} />

        {/* Grades list */}
        <section className="bg-[#0b153f] border border-indigo-800/50 rounded-2xl overflow-hidden">
          <div className="px-5 sm:px-7 py-4 border-b border-indigo-800/50">
            <h2 className="text-white font-bold text-lg">{t('all_grades')}</h2>
          </div>

          {gradesWithAssignment.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <HiOutlineDocumentText className="text-5xl mx-auto mb-3 text-indigo-500" />
              {t('no_grades_yet')}
            </div>
          ) : (
            <div className="divide-y divide-indigo-900/60">
              {gradesWithAssignment.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-5 sm:px-7 py-4 hover:bg-indigo-900/20 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm truncate">
                        {item.assignment?.name || `Assignment #${item.assignmentId}`}
                      </p>
                      {item.assignment?.group?.name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 shrink-0">
                          {item.assignment.group.name}
                        </span>
                      )}
                      {item.late && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 shrink-0">
                          {t("late_badge")}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {t('submitted_at_label')} {formatDate(item.submittedAt)}
                    </p>
                  </div>

                  {/* Grade */}
                  <div className="text-right shrink-0">
                    {item.grade !== null && item.grade !== undefined && item.grade !== "" ? (
                      <div className="flex items-center gap-2">
                        <div>
                          <p
                            className={`font-bold text-lg ${getGradeColor(item.grade)}`}
                          >
                            {item.grade}
                            <span className="text-slate-500 text-sm font-normal">
                              /100
                            </span>
                          </p>
                          {item.feedback && (
                            <p className="text-[11px] text-slate-400 max-w-48 truncate">
                              {item.feedback}
                            </p>
                          )}
                        </div>
                        <IoCheckmarkCircle className="text-emerald-400 text-lg shrink-0" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-sm">{t('pending_word')}</span>
                        <IoTimeOutline className="text-amber-400 text-lg shrink-0" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default StudentGrades
