import { useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { IoArrowBack } from "react-icons/io5"
import { BiCalendar, BiUser } from "react-icons/bi"
import { CgSpinner } from "react-icons/cg"
import { useAssignments } from "../SmallComponents/AssignmentProvider"

const getDeadlineStatus = (deadlineStr) => {
  if (!deadlineStr) return { label: "No deadline set", color: "text-slate-500" }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const deadlineDate = new Date(deadlineStr)
  deadlineDate.setHours(0, 0, 0, 0)

  const diffDays = Math.round((deadlineDate - today) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`, color: "text-red-400" }
  if (diffDays === 0) return { label: "Due today", color: "text-amber-400" }
  if (diffDays === 1) return { label: "Due tomorrow", color: "text-amber-300" }
  return { label: `${diffDays} days left`, color: "text-emerald-400" }
}

const formatDate = (deadlineStr) => {
  if (!deadlineStr) return "Not set"
  const date = new Date(deadlineStr)
  if (isNaN(date)) return deadlineStr
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

const formatDateTime = (isoStr) => {
  const date = new Date(isoStr)
  if (isNaN(date)) return isoStr
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const AssignmentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { assignmentsList, loading, submitAssignment } = useAssignments()

  const assignment = assignmentsList.find((item) => String(item.id) === String(id))

  const [answer, setAnswer] = useState("")
  const [editing, setEditing] = useState(false)

  const studentName = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("userProfile"))
      return saved?.fullName || "Unknown Student"
    } catch {
      return "Unknown Student"
    }
  }, [])

  if (!assignment) {
    return (
      <div className="min-h-screen w-full bg-[#03071e] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400 text-xl">Assignment not found</p>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="px-5 py-2.5 rounded-xl bg-[#0e1b52] text-white text-sm font-semibold hover:bg-indigo-600 transition-colors cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const deadlineStatus = getDeadlineStatus(assignment.deadline)
  const submissions = Array.isArray(assignment.submissions) ? assignment.submissions : []
  const mySubmission = submissions.find((s) => s.studentName === studentName)
  const hasSubmission = Boolean(mySubmission)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!answer.trim()) return
    const success = await submitAssignment(assignment.id, answer, studentName)
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
        <IoArrowBack /> Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-4">{assignment.assignment}</h1>

        <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <BiUser className="text-indigo-400" />
            Teacher: {assignment.teacherName || "Not specified"}
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <BiCalendar className="text-indigo-400" />
            Due: {formatDate(assignment.deadline)}
          </div>
          <span className={`font-semibold ${deadlineStatus.color}`}>{deadlineStatus.label}</span>
        </div>

        {hasSubmission && !editing ? (
          <div className="bg-[#0a1030] border border-emerald-700/40 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-400 font-semibold text-sm">Submitted</span>
              <span className="text-slate-500 text-xs">{formatDateTime(mySubmission.submittedAt)}</span>
            </div>
            <p className="text-slate-200 whitespace-pre-wrap">{mySubmission.text}</p>
            <button
              onClick={() => {
                setAnswer(mySubmission.text)
                setEditing(true)
              }}
              className="mt-5 px-5 py-2 rounded-xl bg-[#0e1b52] text-white text-sm font-semibold hover:bg-indigo-600 transition-colors cursor-pointer"
            >
              Edit Submission
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#0a1030] border border-indigo-900/40 rounded-2xl p-6 flex flex-col gap-4">
            <label className="text-white font-semibold text-sm" htmlFor="answer">
              Your work
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              rows={8}
              placeholder="Write or paste your completed assignment here..."
              className="w-full bg-[#030712] text-slate-200 placeholder-slate-600 text-sm p-4 rounded-xl border border-slate-800 outline-none focus:border-indigo-600 transition-colors resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !answer.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#8fd125] text-black font-semibold text-sm hover:shadow-lg hover:shadow-[#78af1f] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {loading ? <CgSpinner className="animate-spin" /> : null}
                Submit Assignment
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
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