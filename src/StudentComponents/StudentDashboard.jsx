import { useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { HiOutlineBookOpen, HiOutlineClipboardList } from "react-icons/hi"
import { FaRegStar } from "react-icons/fa"
import { IoChevronForward } from "react-icons/io5"
import { BiCalendar } from "react-icons/bi"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useAuth } from "../Providers/AuthProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { useCourses } from "../Providers/CourseProvider"
import api from "../api"

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
  const { assignmentsList, fetching, mySubmission } = useAssignments()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { myGroup, courses } = useCourses()
  const navigate = useNavigate()
  const [filter, setFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [lessonActivities, setLessonActivities] = useState([])

  // Fetch lesson activities (homework from lessons)
  useEffect(() => {
    let cancelled = false
    const enrolledCourses = myGroup ? [myGroup] : courses
    if (!enrolledCourses.length) {
      console.log('[StudentDashboard] No enrolled courses found. myGroup:', myGroup, 'courses:', courses)
      return
    }

    Promise.allSettled(enrolledCourses.map((course) => api.get(`/groups/${course.id}/lessons`)))
      .then(async (results) => {
        if (cancelled) return
        const lessons = []
        const lessonCourseMap = {}
        results.forEach((result, courseIndex) => {
          if (result.status !== 'fulfilled') return
          const data = result.value.data
          const items = Array.isArray(data) ? data : data?.items || []
          items.forEach((lesson) => {
            lessons.push(lesson)
            lessonCourseMap[lesson.id] = { name: enrolledCourses[courseIndex]?.name, id: enrolledCourses[courseIndex]?.id }
          })
        })

        const activityResults = await Promise.allSettled(
          lessons.map((lesson) => api.get(`/lessons/${lesson.id}/activities`))
        )

        const activitiesArr = []
        activityResults.forEach((result, index) => {
          if (result.status !== 'fulfilled' || !lessons[index]) return
          const data = result.value.data
          const items = Array.isArray(data) ? data : data?.items || []
          const lesson = lessons[index]
          items.forEach((activity) => {
            activitiesArr.push({
              ...activity,
              id: activity.id || activity._id || activity.homework_id || `activity-${lesson.id}-${Math.random()}`,
              name: activity.title || activity.name,
              description: activity.description,
              group_id: lessonCourseMap[lesson.id]?.id,
              group: { name: lessonCourseMap[lesson.id]?.name },
              deadline: activity.content?.deadline || activity.deadline,
              isActivity: true,
              activityType: activity.kind || 'homework'
            })
          })
        })
        if (!cancelled) setLessonActivities(activitiesArr)
      })
      .catch(() => { if (!cancelled) setLessonActivities([]) })

    return () => { cancelled = true }
  }, [myGroup, courses])

  const studentFullName = user?.full_name || "Unknown Student"
  const studentName = useMemo(() => studentFullName.split(" ")[0] || "Student", [studentFullName])

  const hasMySubmission = (item) => Boolean(item.submitted || mySubmission(item.id, user?.email))

  // Debug: log data to help diagnose visibility issues
  useEffect(() => {
    console.log('[StudentDashboard] Debug info:', {
      assignmentsCount: assignmentsList.length,
      assignments: assignmentsList.map(a => ({ id: a.id, name: a.name, group_id: a.group_id })),
      coursesCount: courses.length,
      courses: courses.map(c => ({ id: c.id, name: c.name })),
      myGroup: myGroup ? { id: myGroup.id, name: myGroup.name } : null,
      myGroupId: myGroup?.id,
      enrolledGroupIds: courses.map(c => String(c.id)),
      lessonActivitiesCount: lessonActivities.length
    })
  }, [assignmentsList, courses, myGroup, lessonActivities])

  // Only assignments belonging to the course the student was actually added
  // to — even if the backend ever returns everyone's objects, this guarantees
  // a student never sees another course's homework.
  const courseOptions = useMemo(() => {
    const knownCourses = [...(courses || [])]
    if (myGroup && !knownCourses.some((course) => course.id === myGroup.id)) {
      knownCourses.push(myGroup)
    }
    // Consider both regular assignments AND lesson activities
    const assignmentGroupIds = new Set([
      ...assignmentsList.map((item) => String(item.group_id)),
      ...lessonActivities.map((item) => String(item.group_id))
    ])
    // If no group_ids found, show all enrolled courses
    if (assignmentGroupIds.size === 0) return knownCourses
    return knownCourses.filter((course) => assignmentGroupIds.has(String(course.id)))
  }, [assignmentsList, lessonActivities, courses, myGroup])

  const myGroupAssignments = useMemo(
    () => {
      const enrolledGroupIds = new Set(courseOptions.map((course) => String(course.id)))
      const regularAssignments = assignmentsList.filter((item) => (
        enrolledGroupIds.has(String(item.group_id)) &&
        (courseFilter === "all" || String(item.group_id) === String(courseFilter))
      ))
      const filteredActivities = lessonActivities.filter((item) => (
        courseFilter === "all" || String(item.group_id) === String(courseFilter)
      ))
      return [...regularAssignments, ...filteredActivities]
    },
    [assignmentsList, lessonActivities, courseFilter, courseOptions]
  )

  const pendingCount = myGroupAssignments.filter((item) => !hasMySubmission(item)).length

  const visibleAssignments = filter === "pending"
    ? myGroupAssignments.filter((item) => !hasMySubmission(item))
    : myGroupAssignments

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
          {t('student_summary', myGroupAssignments.length, pendingCount)}
        </p>

        {courses.length === 0 && (
          <div
            onClick={() => navigate('/student-profile')}
            className="bg-[#0e1442] border border-indigo-500/40 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 cursor-pointer hover:border-indigo-400/60 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{t('not_in_course')}</p>
              <p className="text-slate-400 text-xs mt-0.5">{t('share_id_with_teacher')}</p>
            </div>
            <span className="text-indigo-300 text-xs font-bold shrink-0">{t('view_id')}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
            {t('current_assignments')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${filter === "all" ? "bg-[#0e1b52] text-white" : "text-indigo-400 hover:text-white"}`}
            >
              {t('filter_all')}
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${filter === "pending" ? "bg-indigo-600 text-white" : "text-indigo-400 hover:text-white"}`}
            >
              {t('filter_pending')}
            </button>
          </div>
        </div>

        {courseOptions.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2">
            <button
              onClick={() => setCourseFilter("all")}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${courseFilter === "all" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-[#0a1030] border-indigo-900/50 text-indigo-300 hover:border-indigo-500/60 hover:text-white"}`}
            >
              {t('all_courses')}
            </button>
            {courseOptions.map((course) => (
              <button
                key={course.id}
                onClick={() => setCourseFilter(String(course.id))}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${String(courseFilter) === String(course.id) ? "bg-emerald-500 border-emerald-400 text-black" : "bg-[#0a1030] border-indigo-900/50 text-indigo-300 hover:border-indigo-500/60 hover:text-white"}`}
              >
                {course.name}
              </button>
            ))}
          </div>
        )}

        {fetching && assignmentsList.length === 0 ? (
          <p className="text-white text-center pt-20">{t('loading')}</p>
        ) : visibleAssignments.length === 0 ? (
          <p className="text-slate-400 text-center pt-20 text-xl">{t('no_assignments_here')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleAssignments.map((item) => {
              const deadlineStatus = getDeadlineStatus(item.deadline, t)
              const mySub = mySubmission(item.id, user?.email)
              const isGraded = mySub && mySub.grade !== undefined && mySub.grade !== null && mySub.grade !== ""

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/assignment/${item.id}`)}
                  className="bg-[#0a1030] border border-indigo-900/40 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-indigo-500/40 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold truncate">{item.name}</h3>
                      {item.group?.name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 shrink-0">
                          {item.group.name}
                        </span>
                      )}
                      {mySub?.late && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 shrink-0">
                          {t('late_badge')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] tracking-wider text-indigo-400 font-semibold flex items-center justify-end gap-1">
                        <BiCalendar /> {formatDate(item.deadline, t)}
                      </p>
                      <p className={`text-sm font-medium ${deadlineStatus.color}`}>{deadlineStatus.label}</p>
                    </div>

                    {isGraded ? (
                      <span className="text-xs font-bold hidden sm:inline text-emerald-400">{mySub.grade}/100</span>
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