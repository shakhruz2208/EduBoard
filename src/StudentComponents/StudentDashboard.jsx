import { useMemo, useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { HiOutlineBookOpen, HiOutlineClipboardList } from "react-icons/hi"
import { FaRegStar } from "react-icons/fa"
import { IoChevronForward } from "react-icons/io5"
import { BiCalendar } from "react-icons/bi"
import { toast } from "react-toastify"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useAuth } from "../Providers/AuthProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { useCourses } from "../Providers/CourseProvider"
import { normalizeActivityList } from "../utils/backend"
import { msUntil, formatDate as formatDateUtil } from "../utils/datetime"
import { startDeadlineWatcher } from "../utils/reminders"
import api from "../api"

const getDeadlineStatus = (deadlineStr, t) => {
  if (!deadlineStr) return { label: t('not_set'), color: "text-slate-500" }
  const diffMs = msUntil(deadlineStr)
  if (isNaN(diffMs)) return { label: t('not_set'), color: "text-slate-500" }

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
  return formatDateUtil(deadlineStr)
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
    // Union of /me/group and /me/groups: a student can appear in only one of
    // the two responses, so combining them guarantees full lesson coverage.
    const enrolledCourses = [...(courses || [])]
    if (myGroup && !enrolledCourses.some((c) => c.id === myGroup.id)) enrolledCourses.push(myGroup)
    if (!enrolledCourses.length) return

    Promise.allSettled(enrolledCourses.map((course) => api.get(`/groups/${course.id}/lessons`)))
      .then(async (results) => {
        if (cancelled) return
        const lessons = []
        const lessonCourseMap = {}
        const seenLessonIds = new Set()
        results.forEach((result, courseIndex) => {
          if (result.status !== 'fulfilled') return
          const data = result.value.data
          const items = Array.isArray(data) ? data : data?.items || []
          items.forEach((lesson) => {
            if (seenLessonIds.has(lesson.id)) return
            seenLessonIds.add(lesson.id)
            lessons.push(lesson)
            lessonCourseMap[lesson.id] = { name: enrolledCourses[courseIndex]?.name, id: enrolledCourses[courseIndex]?.id }
          })
        })

        const activityResults = await Promise.allSettled(
          lessons.map((lesson) => api.get(`/lessons/${lesson.id}/activities`))
        )

        const activitiesArr = []
        const seenActivityIds = new Set()
        activityResults.forEach((result, index) => {
          if (result.status !== 'fulfilled' || !lessons[index]) return
          const lesson = lessons[index]
          const courseInfo = lessonCourseMap[lesson.id] || {}
          // Backend may return activity_type or kind — normalize in one place
          normalizeActivityList(result.value.data, {
            lessonId: lesson.id,
            courseId: courseInfo.id,
            courseName: courseInfo.name
          }).forEach((activity) => {
            if (seenActivityIds.has(activity.id)) return
            seenActivityIds.add(activity.id)
            activitiesArr.push({
              ...activity,
              group_id: courseInfo.id,
              group: { name: courseInfo.name }
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

  // Deadline reminders: every 5 minutes check pending work and toast when a
  // deadline is within 24h (and again within 1h). Each threshold fires once.
  // Latest values are read through a ref so the interval is started once.
  const deadlineDeps = useRef({})
  deadlineDeps.current = { assignmentsList, lessonActivities, mySubmission, user, t }
  useEffect(() => {
    const stop = startDeadlineWatcher(
      () => { const d = deadlineDeps.current; return [...d.assignmentsList, ...d.lessonActivities] },
      (item) => { const d = deadlineDeps.current; return Boolean(item.submitted || d.mySubmission(item.id, d.user?.email)) },
      (item, label) => { const d = deadlineDeps.current; toast.warn(`${item.name || item.title}: ${d.t('deadline_reminder', label)}`) }
    )
    return stop
  }, [])

  // Only assignments belonging to courses the student was actually added to
  // — even if the backend ever returns everyone's objects, this guarantees
  // a student never sees another course's homework.
  const courseOptions = useMemo(() => {
    const knownCourses = [...(courses || [])]
    if (myGroup && !knownCourses.some((course) => course.id === myGroup.id)) {
      knownCourses.push(myGroup)
    }
    // Consider regular assignments AND lesson activities. If nothing carries
    // a group/course id yet, fall back to showing every enrolled course.
    const assignmentGroupIds = new Set([
      ...assignmentsList.map((item) => String(item.group_id)),
      ...lessonActivities.map((item) => String(item.group_id ?? item.courseId ?? ''))
    ])
    assignmentGroupIds.delete('')
    if (assignmentGroupIds.size === 0) return knownCourses
    return knownCourses.filter((course) => assignmentGroupIds.has(String(course.id)))
  }, [assignmentsList, lessonActivities, courses, myGroup])

  const myGroupAssignments = useMemo(
    () => {
      const enrolledGroupIds = new Set(courseOptions.map((course) => String(course.id)))
      const inCourse = (item) => (
        enrolledGroupIds.has(String(item.group_id)) ||
        (item.courseId != null && enrolledGroupIds.has(String(item.courseId)))
      )
      const matchesFilter = (item) => (
        courseFilter === "all" ||
        String(item.group_id) === String(courseFilter) ||
        String(item.courseId) === String(courseFilter)
      )

      // Gradable activities arrive twice: as a lesson activity AND as its
      // mirror object (content.object_id). Show them ONCE through the object
      // — enriched with the activity's metadata — so submissions keep working
      // against /object/{id}/submit.
      const activityByObjectId = new Map()
      const standaloneActivities = []
      lessonActivities.forEach((act) => {
        if (!inCourse(act) || !matchesFilter(act)) return
        if (act.objectId != null) activityByObjectId.set(String(act.objectId), act)
        else standaloneActivities.push(act)
      })

      const regularAssignments = []
      assignmentsList.forEach((item) => {
        if (!inCourse(item) || !matchesFilter(item)) return
        const act = activityByObjectId.get(String(item.id))
        regularAssignments.push(act
          ? {
              ...item,
              name: item.name || act.title,
              description: item.description || act.description,
              deadline: item.deadline || act.deadline,
              kind: act.kind,
              isActivity: true,
            }
          : item)
      })

      return [...regularAssignments, ...standaloneActivities]
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
              // Materials (and legacy kind:"activity" rows) have no submit
              // route — render them as read-only cards.
              const isReadOnlyMaterial = item.isActivity && (item.kind === "materials" || item.kind === "activity")

              return (
                <div
                  key={item.id}
                  onClick={() => { if (!isReadOnlyMaterial) navigate(`/assignment/${item.objectId || item.id}`) }}
                  className={`bg-[#0a1030] border border-indigo-900/40 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-indigo-500/40 transition-colors ${isReadOnlyMaterial ? "" : "cursor-pointer"}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold truncate">{item.name}</h3>
                      {item.group?.name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 shrink-0">
                          {item.group.name}
                        </span>
                      )}
                      {item.isActivity && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 shrink-0">
                          {t(`activity_${item.kind}`)}
                        </span>
                      )}
                      {mySub?.late && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 shrink-0">
                          {t('late_badge')}
                        </span>
                      )}
                    </div>
                    {isReadOnlyMaterial && item.description && (
                      <p className="text-slate-400 text-xs mt-1 truncate">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                    {isReadOnlyMaterial ? (
                      item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold text-indigo-300 hover:text-indigo-200 underline"
                        >
                          {t('open_link')}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">{t('materials_hint')}</span>
                      )
                    ) : (
                      <>
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
                      </>
                    )}
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