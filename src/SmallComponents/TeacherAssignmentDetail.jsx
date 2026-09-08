import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { IoArrowBack, IoCheckmarkCircle } from "react-icons/io5"
import { BiCalendar } from "react-icons/bi"
import { HiOutlineDocumentText } from "react-icons/hi"
import { CgSpinner } from "react-icons/cg"
import api from "../api"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useLanguage } from "../Providers/LanguageProvider"

const formatDate = (deadlineStr) => {
  if (!deadlineStr) return "Not set"
  const date = new Date(deadlineStr)
  if (isNaN(date)) return deadlineStr
  return date.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const formatDateTime = (isoStr) => {
  const date = new Date(isoStr)
  if (isNaN(date)) return isoStr
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const ACCENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
]

const GRADE_MAX = 100

const SubmissionCard = ({ submission, accent, onSave, saving, t }) => {
  const isGraded = submission.grade !== undefined && submission.grade !== null && submission.grade !== ""
  const [editingGrade, setEditingGrade] = useState(!isGraded)
  const [gradeInput, setGradeInput] = useState(isGraded ? String(submission.grade) : "")
  const [feedbackInput, setFeedbackInput] = useState(submission.feedback || "")

  const handleSave = async () => {
    const numericGrade = Number(gradeInput)
    if (gradeInput === "" || isNaN(numericGrade) || numericGrade < 0 || numericGrade > GRADE_MAX) return
    const success = await onSave(numericGrade, feedbackInput)
    if (success) setEditingGrade(false)
  }

  return (
    <div className="relative bg-[#0a1030] border border-indigo-900/40 rounded-2xl p-6 overflow-hidden hover:border-indigo-500/40 transition-colors">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${accent}`} />

      <div className="flex items-center justify-between mb-3 pl-2 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${accent} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
            {submission.studentName?.[0]?.toUpperCase() || "S"}
          </div>
          <span className="text-white font-semibold">{submission.studentName}</span>
          {submission.late && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{t('late_label')}</span>
          )}
        </div>
        <span className="text-slate-500 text-xs">{formatDateTime(submission.submittedAt)}</span>
      </div>

      {submission.text && submission.text.match(/^https?:\/\//) ? (
        <a
          href={submission.text}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline break-all text-sm pl-2 mb-4 block"
        >
          {submission.text}
        </a>
      ) : (
        <p className="text-slate-300 text-sm whitespace-pre-wrap pl-2 mb-4">{submission.text}</p>
      )}

      <div className="pl-2 border-t border-indigo-900/40 pt-4">
        {isGraded && !editingGrade ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <IoCheckmarkCircle className="text-emerald-400 text-lg" />
              <span className="text-emerald-400 font-bold text-lg">{submission.grade}/{GRADE_MAX}</span>
              {submission.feedback && (
                <span className="text-slate-400 text-sm ml-2">— {submission.feedback}</span>
              )}
            </div>
            <button
              onClick={() => setEditingGrade(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              {t('edit_grade')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('grade_word')}</label>
              <input
                type="number"
                min={0}
                max={GRADE_MAX}
                value={gradeInput}
                onChange={(e) => setGradeInput(e.target.value)}
                placeholder="0-100"
                className="w-24 bg-[#030712] text-white text-sm px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-indigo-600"
              />
              <span className="text-slate-500 text-sm">/ {GRADE_MAX}</span>
            </div>
            <textarea
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder={t('feedback_placeholder')}
              rows={2}
              className="w-full bg-[#030712] text-slate-200 placeholder-slate-600 text-sm p-3 rounded-lg border border-slate-800 outline-none focus:border-indigo-600 resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving || gradeInput === ""}
                className="px-4 py-2 rounded-lg bg-[#8fd125] text-black text-sm font-semibold hover:shadow-lg hover:shadow-[#78af1f] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {saving ? <CgSpinner className="animate-spin" /> : null}
                {t('save_grade')}
              </button>
              {isGraded && (
                <button
                  onClick={() => setEditingGrade(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {t('cancel_btn')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const TeacherAssignmentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { assignmentsList, submissionsForAssignment, gradeSubmission, gradingKey } = useAssignments()
  const { t } = useLanguage()

  const [assignment, setAssignment] = useState(() =>
    assignmentsList.find((item) => String(item.id) === String(id)) || null
  )
  const [loadingDetail, setLoadingDetail] = useState(!assignment)

  useEffect(() => {
    const found = assignmentsList.find((item) => String(item.id) === String(id))
    if (found) {
      setAssignment(found)
      setLoadingDetail(false)
      return
    }
    let cancelled = false
    setLoadingDetail(true)
    api.get(`/object/${id}`)
      .then((res) => { if (!cancelled) setAssignment(res.data) })
      .catch(() => { if (!cancelled) setAssignment(null) })
      .finally(() => { if (!cancelled) setLoadingDetail(false) })
    return () => { cancelled = true }
  }, [id, assignmentsList])

  if (loadingDetail) {
    return (
      <div className="min-h-screen w-full bg-[#03071e] flex items-center justify-center">
        <p className="text-white">{t('assignment_loading')}</p>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen w-full bg-[#03071e] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400 text-xl">{t('assignment_not_found_msg')}</p>
        <button
          onClick={() => navigate("/teacher-dashboard")}
          className="px-5 py-2.5 rounded-xl bg-[#0e1b52] text-white text-sm font-semibold hover:bg-indigo-600 transition-colors cursor-pointer"
        >
          {t('back_to_dashboard_btn')}
        </button>
      </div>
    )
  }

  const subs = submissionsForAssignment(Number(id))
  const gradedCount = subs.filter((s) => s.grade !== null && s.grade !== undefined).length

  const handleSaveGrade = async (submissionId, grade, feedback) =>
    gradeSubmission(submissionId, grade, feedback)

  return (
    <div className="min-h-screen w-full bg-[#03071e] p-6 sm:p-10">
      <button
        onClick={() => navigate("/teacher-dashboard")}
        className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors mb-8 cursor-pointer"
      >
        <IoArrowBack /> {t('back_to_dashboard_btn')}
      </button>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-4">{assignment.name}</h1>

        <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
          {assignment.group?.name && (
            <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 font-semibold text-xs">
              {assignment.group.name}
            </span>
          )}
          <div className="flex items-center gap-2 text-slate-300">
            <BiCalendar className="text-indigo-400" />
            {t('due')}: {formatDate(assignment.deadline)}
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 font-semibold text-xs">
            {subs.length} submission{subs.length === 1 ? "" : "s"}
          </span>            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold text-xs">
            {gradedCount}/{subs.length} {t('graded_word')}
          </span>
        </div>

        {subs.length === 0 ? (
          <div className="bg-[#0a1030] border border-indigo-900/40 rounded-2xl p-10 flex flex-col items-center gap-3">
            <HiOutlineDocumentText className="text-4xl text-slate-600" />
            <p className="text-slate-400 text-center">{t('no_submissions_yet')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {subs
              .slice()
              .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
              .map((sub, index) => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  accent={ACCENTS[index % ACCENTS.length]}
                  onSave={(grade, feedback) => handleSaveGrade(sub.id, grade, feedback)}
                  t={t}
                  saving={gradingKey === String(sub.id)}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherAssignmentDetail