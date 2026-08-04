import { useParams, useNavigate } from "react-router-dom"
import { IoArrowBack } from "react-icons/io5"
import { BiCalendar, BiUser } from "react-icons/bi"
import { HiOutlineDocumentText } from "react-icons/hi"
import { useAssignments } from "../SmallComponents/AssignmentProvider"

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

// A small set of accent colors so each student's card in the list reads distinctly
const ACCENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
]

const TeacherAssignmentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { assignmentsList } = useAssignments()

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
                <div
                  key={`${sub.studentName}-${sub.submittedAt}`}
                  className="relative bg-[#0a1030] border border-indigo-900/40 rounded-2xl p-6 overflow-hidden hover:border-indigo-500/40 transition-colors"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${ACCENTS[index % ACCENTS.length]}`} />

                  <div className="flex items-center justify-between mb-3 pl-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${ACCENTS[index % ACCENTS.length]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                        {sub.studentName?.[0]?.toUpperCase() || "S"}
                      </div>
                      <span className="text-white font-semibold">{sub.studentName}</span>
                    </div>
                    <span className="text-slate-500 text-xs">{formatDateTime(sub.submittedAt)}</span>
                  </div>

                  <p className="text-slate-300 text-sm whitespace-pre-wrap pl-2">{sub.text}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherAssignmentDetail