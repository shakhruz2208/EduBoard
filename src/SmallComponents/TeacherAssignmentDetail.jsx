import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { IoArrowBack, IoCheckmarkCircle } from "react-icons/io5"
import { BiCalendar, BiUser } from "react-icons/bi"
import { HiOutlineDocumentText } from "react-icons/hi"
import { CgSpinner } from "react-icons/cg"
import { useAssignments } from "../Providers/AssignmentProvider"

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

const SubmissionCard = ({ submission, accent, onSave, saving }) => {
  const isGraded = submission.grade !== undefined && submission.grade !== null && submission.grade !== ""
  const [editingGrade, setEditingGrade] = useState(!isGraded)
  const [gradeInput, setGradeInput] = useState(isGraded ? String(submission.grade) : "")
  const [feedbackInput, setFeedbackInput] = useState(submission.feedback || "")

  const handleSave = async () => {
    const numericGrade = Number(gradeInput)
    if (gradeInput === "" || isNaN(numericGrade) || numericGrade < 0 || numericGrade > GRADE_MAX) return
    const success = await onSave(submission.studentName, numericGrade, feedbackInput)
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
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Late</span>
          )}
        </div>
        <span className="text-slate-500 text-xs">{formatDateTime(submission.submittedAt)}</span>
      </div>

      <p className="text-slate-300 text-sm whitespace-pre-wrap pl-2 mb-4">{submission.text}</p>

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
              Edit Grade
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grade</label>
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
              placeholder="Feedback for the student (optional)"
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
                Save Grade
              </button>
              {isGraded && (
                <button
                  onClick={() => setEditingGrade(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
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
  const { assignmentsList, gradingKey, gradeSubmission } = useAssignments()

  const assignment = assignmentsList.find((item) => String(item.id) === String(id))

  if (!assignment) {
    return (
      <div className="min-h-screen w-full bg-[#03071e] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400 text-xl">Assignment not found</p>
        <button
          onClick={() => navigate("/teacher-dashboard")}
          className="px-5 py-2.5 rounded-xl bg-[#0e1b52] text-white text-sm font-semibold hover:bg-indigo-600 transition-colors cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const submissions = Array.isArray(assignment.submissions) ? assignment.submissions : []
  const gradedCount = submissions.filter((s) => s.grade !== undefined && s.grade !== null && s.grade !== "").length

  const handleSaveGrade = async (studentName, grade, feedback) => {
    return await gradeSubmission(assignment.id, studentName, grade, feedback)
  }

  return (
    <div className="min-h-screen w-full bg-[#03071e] p-6 sm:p-10">
      <button
        onClick={() => navigate("/teacher-dashboard")}
        className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors mb-8 cursor-pointer"
      >
        <IoArrowBack /> Back to Dashboard
      </button>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-4">{assignment.assignment}</h1>

        <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <BiUser className="text-indigo-400" />
            Assigned by: {assignment.teacherName || "Not specified"}
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <BiCalendar className="text-indigo-400" />
            Due: {formatDate(assignment.deadline)}
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 font-semibold text-xs">
            {submissions.length} submission{submissions.length === 1 ? "" : "s"}
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold text-xs">
            {gradedCount}/{submissions.length} graded
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-[#0a1030] border border-indigo-900/40 rounded-2xl p-10 flex flex-col items-center gap-3">
            <HiOutlineDocumentText className="text-4xl text-slate-600" />
            <p className="text-slate-400 text-center">No student has submitted this assignment yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {submissions
              .slice()
              .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
              .map((sub, index) => (
                <SubmissionCard
                  key={`${sub.studentName}-${sub.submittedAt}`}
                  submission={sub}
                  accent={ACCENTS[index % ACCENTS.length]}
                  onSave={handleSaveGrade}
                  saving={gradingKey === `${assignment.id}:${sub.studentName}`}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherAssignmentDetail