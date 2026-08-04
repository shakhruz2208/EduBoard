import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { HiOutlineBookOpen, HiOutlineClipboardList } from "react-icons/hi"
import { FaRegStar } from "react-icons/fa"
import { IoChevronForward } from "react-icons/io5"
import { BiCalendar } from "react-icons/bi"
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const StudentDashboard = () => {
  const { assignmentsList, loading } = useAssignments()
  const navigate = useNavigate()
  const [filter, setFilter] = useState("all") // "all" | "pending"

  const studentFullName = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("userProfile"))
      return saved?.fullName || "Unknown Student"
    } catch {
      return "Unknown Student"
    }
  }, [])

  const studentName = useMemo(() => studentFullName.split(" ")[0] || "Student", [studentFullName])

  const hasMySubmission = (item) =>
    Array.isArray(item.submissions) && item.submissions.some((s) => s.studentName === studentFullName)

  const pendingCount = assignmentsList.filter((item) => !hasMySubmission(item)).length

  const visibleAssignments = filter === "pending"
    ? assignmentsList.filter((item) => !hasMySubmission(item))
    : assignmentsList

  return (
    <div className="relative min-h-screen w-full bg-[#03071e] flex">
      {/* Left icon rail */}
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
        <p className="text-[11px] font-bold tracking-widest text-purple-400 mb-2">WELCOME BACK</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Hi, <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">{studentName}!</span>
        </h1>
        <p className="text-indigo-300 text-sm sm:text-base mb-8">
          You have {assignmentsList.length} assignment{assignmentsList.length === 1 ? "" : "s"} total, {pendingCount} still pending. Keep up the learning!
        </p>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
            Current Assignments
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === "all" ? "bg-[#0e1b52] text-white" : "text-indigo-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === "pending" ? "bg-indigo-600 text-white" : "text-indigo-400 hover:text-white"
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {loading && assignmentsList.length === 0 ? (
          <p className="text-white text-center pt-20">Loading...</p>
        ) : visibleAssignments.length === 0 ? (
          <p className="text-slate-400 text-center pt-20 text-xl">No assignments here</p>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleAssignments.map((item) => {
              const deadlineStatus = getDeadlineStatus(item.deadline)

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/assignment/${item.id}`)}
                  className="bg-[#0a1030] border border-indigo-900/40 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-indigo-500/40 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold truncate">{item.assignment}</h3>
                    <p className="text-slate-500 text-xs mt-1">Teacher: {item.teacherName || "Not specified"}</p>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] tracking-wider text-indigo-400 font-semibold flex items-center justify-end gap-1">
                        <BiCalendar /> {formatDate(item.deadline)}
                      </p>
                      <p className={`text-sm font-medium ${deadlineStatus.color}`}>{deadlineStatus.label}</p>
                    </div>

                    <span className={`text-xs font-semibold hidden sm:inline ${hasMySubmission(item) ? "text-emerald-400" : "text-slate-500"}`}>
                      {hasMySubmission(item) ? "Submitted" : "Not submitted"}
                    </span>

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