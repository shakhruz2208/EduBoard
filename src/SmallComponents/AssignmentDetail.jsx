import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { IoArrowBack } from "react-icons/io5"
import { BiCalendar } from "react-icons/bi"
import { CgSpinner } from "react-icons/cg"
import api from "../api"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useAuth } from "../Providers/AuthProvider"
import { useLanguage } from "../Providers/LanguageProvider"

const getDeadlineStatus = (deadlineStr, t) => {
  if (!deadlineStr) return { label: t('no_deadline_set'), color: "text-slate-500" }
  const now = new Date()
  const deadlineDate = new Date(deadlineStr)
  const diffMs = deadlineDate - now

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffMs) / (1000 * 60 * 60)
    if (overdueHours < 24) return { label: t('overdue_by', `${Math.max(1, Math.round(overdueHours))}h`), color: "text-red-400" }
    const overdueDays = Math.floor(overdueHours / 24)
    return { label: t('overdue_by', `${overdueDays}d`), color: "text-red-400" }
  }
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 1) {
    const diffMin = Math.max(1, Math.round(diffMs / (1000 * 60)))
    return { label: t('due_in', `${diffMin}min`), color: "text-red-400" }
  }
  if (diffHours < 24) return { label: t('due_in', `${Math.round(diffHours)}h`), color: "text-amber-400" }
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return { label: t('due_tomorrow'), color: "text-amber-300" }
  return { label: t('days_left', diffDays), color: "text-emerald-400" }
}

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

const AssignmentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { assignmentsList, submittingId, submitAssignment, mySubmission } = useAssignments()
  const { user } = useAuth()
  const { t } = useLanguage()

  const [assignment, setAssignment] = useState(() =>
    assignmentsList.find((item) => String(item.id) === String(id)) || null
  )
  const [loadingDetail, setLoadingDetail] = useState(!assignment)
  const [answer, setAnswer] = useState("")
  const [editing, setEditing] = useState(false)

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
          onClick={() => navigate("/student-dashboard")}
          className="px-5 py-2.5 rounded-xl bg-[#0e1b52] text-white text-sm font-semibold hover:bg-indigo-600 transition-colors cursor-pointer"
        >
          {t('back_to_dashboard_btn')}
        </button>
      </div>
    )
  }

  const deadlineStatus = getDeadlineStatus(assignment.deadline, t)
  const mySub = mySubmission(Number(id), user?.email)
  const hasSubmission = Boolean(mySub)

  const isPastDeadline = assignment.deadline ? new Date(assignment.deadline) < new Date() : false
  const isGraded = Boolean(mySub?.grade !== undefined && mySub?.grade !== null && mySub?.grade !== "")
  const isLocked = isGraded || isPastDeadline
  const lockReason = isGraded
    ? t('lock_reason_graded')
    : t('lock_reason_deadline')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!answer.trim() || isLocked) return
    const success = await submitAssignment(Number(id), answer, user?.full_name, user?.email)
    if (success) {
      setAnswer("")
      setEditing(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#03071e] p-6 sm:p-10">
      <button
        onClick={() => navigate("/student-dashboard")}
        className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors mb-8 cursor-pointer"
      >
        <IoArrowBack /> {t('back_to_dashboard_btn')}
      </button>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">{assignment.name}</h1>
        {assignment.group?.name && (
          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 mb-4">
            {assignment.group.name}
          </span>
        )}
        {assignment.description && (
          <p className="text-slate-300 mb-4">{assignment.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <BiCalendar className="text-indigo-400" />
            {t('due')}: {formatDate(assignment.deadline)}
          </div>
          <span className={`font-semibold ${deadlineStatus.color}`}>{deadlineStatus.label}</span>
        </div>

        {hasSubmission && !editing ? (
          <div className="bg-[#0a1030] border border-emerald-700/40 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold text-sm">{t('submitted_label')}</span>
                {mySub.late && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{t('late_label')}</span>
                )}
              </div>
              <span className="text-slate-500 text-xs">{formatDateTime(mySub.submittedAt)}</span>
            </div>
            {mySub.text && mySub.text.match(/^https?:\/\//) ? (
              <a
                href={mySub.text}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline break-all text-sm"
              >
                {mySub.text}
              </a>
            ) : (
              <p className="text-slate-200 whitespace-pre-wrap">{mySub.text}</p>
            )}

            {isGraded ? (
              <div className="mt-5 bg-emerald-500/10 border border-emerald-700/40 rounded-xl p-4">
                <span className="text-emerald-400 font-bold text-lg">Grade: {mySub.grade}/100</span>
                {mySub.feedback && <p className="text-slate-300 text-sm mt-2">{mySub.feedback}</p>}
              </div>
            ) : (
              <p className="text-slate-500 text-sm mt-5">{t('not_graded_msg')}</p>
            )}

            {isLocked ? (
              <p className="text-slate-500 text-xs mt-3 italic">{lockReason}</p>
            ) : (
              <>
                <p className="text-amber-400 text-xs mt-2">{t('editing_clears_grade')}</p>
                <button
                  onClick={() => { setAnswer(mySub.text); setEditing(true) }}
                  className="mt-3 px-5 py-2 rounded-xl bg-[#0e1b52] text-white text-sm font-semibold hover:bg-indigo-600 transition-colors cursor-pointer"
                >
                  {t('edit_submission_btn')}
                </button>
              </>
            )}
          </div>
        ) : isLocked ? (
          <div className="bg-[#0a1030] border border-red-900/40 rounded-2xl p-6 text-center">
            <p className="text-red-400 font-semibold mb-1">{t('submission_closed_label')}</p>
            <p className="text-slate-500 text-sm">{lockReason}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#0a1030] border border-indigo-900/40 rounded-2xl p-6 flex flex-col gap-4">
            <label className="text-white font-semibold text-sm" htmlFor="answer">{t('submit_url_label')}</label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              rows={8}
              placeholder={t('submit_url_placeholder')}
              className="w-full bg-[#030712] text-slate-200 placeholder-slate-600 text-sm p-4 rounded-xl border border-slate-800 outline-none focus:border-indigo-600 transition-colors resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submittingId === Number(id) || !answer.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#8fd125] text-black font-semibold text-sm hover:shadow-lg hover:shadow-[#78af1f] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {submittingId === Number(id) ? <CgSpinner className="animate-spin" /> : null}
                {t('submit_assignment_button')}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AssignmentDetail