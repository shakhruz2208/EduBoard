import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BiArrowBack, BiChevronDown } from "react-icons/bi"
import { IoCheckmarkCircleOutline } from "react-icons/io5"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useAuth } from "../Providers/AuthProvider"
import { useCourses } from "../Providers/CourseProvider"
import api from "../api"
import { useLanguage } from "../Providers/LanguageProvider"

const getScoreMood = (score, t) => {
  if (score >= 90) return { emoji: '🤩', tone: 'text-lime-300', label: t('mood_excellent') }
  if (score >= 75) return { emoji: '😄', tone: 'text-emerald-300', label: t('mood_great') }
  if (score >= 50) return { emoji: '🙂', tone: 'text-amber-300', label: t('mood_good') }
  if (score > 0) return { emoji: '💪', tone: 'text-orange-300', label: t('mood_keep_going') }
  return { emoji: '🌱', tone: 'text-slate-400', label: t('mood_no_score_yet') }
}

const StudentRating = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { assignmentsList, submissions, fetching } = useAssignments()
  const { courses, myGroup } = useCourses()
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [ratingPeriod, setRatingPeriod] = useState("monthly")
  const [now] = useState(() => Date.now())
  const [rating, setRating] = useState(null)
  const [grades, setGrades] = useState([])
  const [ratingFetching, setRatingFetching] = useState(true)
  const [courseMembers, setCourseMembers] = useState([])
  const [attendanceScores, setAttendanceScores] = useState([])

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([api.get('/student/rating'), api.get('/student/grades')])
      .then(([ratingResult, gradesResult]) => {
        if (cancelled) return
        if (ratingResult.status === 'fulfilled') {
          const data = ratingResult.value.data
          const ratings = Array.isArray(data) ? data : data?.items || []
          setRating(ratings)
        }
        if (gradesResult.status === 'fulfilled') {
          const data = gradesResult.value.data
          setGrades(Array.isArray(data) ? data : data?.items || [])
        }
      })
      .finally(() => { if (!cancelled) setRatingFetching(false) })
    return () => { cancelled = true }
  }, [])

  // Fetch attendance scores from all lessons in all courses
  useEffect(() => {
    let cancelled = false
    const allCourses = [...(courses || [])]
    if (myGroup && !allCourses.some((c) => c.id === myGroup.id)) allCourses.push(myGroup)
    if (!allCourses.length) return

    Promise.allSettled(allCourses.map((c) => api.get(`/groups/${c.id}/lessons`)))
      .then(async (lessonResults) => {
        if (cancelled) return
        const lessons = []
        lessonResults.forEach((r) => {
          if (r.status !== 'fulfilled') return
          const items = Array.isArray(r.value.data) ? r.value.data : r.value.data?.items || []
          items.forEach((l) => lessons.push(l))
        })
        if (!lessons.length) return

        const attResults = await Promise.allSettled(
          lessons.map((l) => api.get(`/lessons/${l.id}/attendance`))
        )
        const allAtt = []
        attResults.forEach((r) => {
          if (r.status !== 'fulfilled') return
          const items = Array.isArray(r.value.data) ? r.value.data : r.value.data?.items || []
          items.forEach((a) => allAtt.push(a))
        })
        if (!cancelled) setAttendanceScores(allAtt)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [courses, myGroup])

  useEffect(() => {
    let cancelled = false
    if (!courses.length) return undefined
    Promise.allSettled(courses.map((course) => api.get(`/group/${course.id}/members`)))
      .then((results) => {
        if (cancelled) return
        const members = results.flatMap((result) => {
          if (result.status !== 'fulfilled') return []
          const data = result.value.data
          return Array.isArray(data) ? data : data?.items || []
        })
        const unique = new Map(members.map((member) => [member.id, member]))
        setCourseMembers([...unique.values()])
      })
    return () => { cancelled = true }
  }, [courses])

  const courseOptions = useMemo(() => {
    const available = [...(courses || [])]
    if (myGroup && !available.some((course) => course.id === myGroup.id)) available.push(myGroup)
    const assignmentGroups = new Set(assignmentsList.map((item) => String(item.group_id)))
    return available.filter((course) => assignmentGroups.has(String(course.id)))
  }, [assignmentsList, courses, myGroup])

  const courseAssignments = useMemo(() => assignmentsList.filter((item) => (
    selectedCourse === "all" || String(item.group_id) === String(selectedCourse)
  )), [assignmentsList, selectedCourse])

  const assignmentIds = new Set(courseAssignments.map((item) => String(item.id)))
  const mySubmissions = (grades.length ? grades : submissions).filter((submission) => (
    assignmentIds.has(String(submission.assignmentId))
  ))
  const gradedSubmissions = mySubmissions.filter((submission) => (
    submission.grade !== null && submission.grade !== undefined && submission.grade !== ""
  ))
  const ratingScores = useMemo(() => {
    const periodMs = ratingPeriod === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
    return (Array.isArray(rating) ? rating : rating ? [rating] : []).filter((item) => {
      const createdAt = new Date(item.created_at || item.updated_at).getTime()
      return Number.isFinite(createdAt) && now - createdAt <= periodMs
    })
  }, [now, rating, ratingPeriod])
  const leaderboard = useMemo(() => {
    const scores = new Map()
    // Add assignment/grade scores
    ratingScores.forEach((item) => {
      const id = String(item.student_id)
      scores.set(id, (scores.get(id) || 0) + Number(item.score || 0))
    })
    // Add attendance scores
    attendanceScores.forEach((item) => {
      const id = String(item.user_id || item.student_id)
      if (id && id !== 'undefined') {
        scores.set(id, (scores.get(id) || 0) + Number(item.score || 0))
      }
    })
    courseMembers.forEach((member) => {
      if (!scores.has(String(member.id))) scores.set(String(member.id), 0)
    })
    return [...scores.entries()]
      .map(([studentId, score]) => ({
        studentId,
        score,
        student: courseMembers.find((member) => String(member.id) === studentId)
      }))
      .filter((item) => item.student)
      .sort((a, b) => b.score - a.score)
  }, [courseMembers, ratingScores, attendanceScores])
  const myRank = leaderboard.findIndex((item) => String(item.studentId) === String(user?.id)) + 1
  const selectedCourseName = selectedCourse === "all"
    ? t('all_courses')
    : courseOptions.find((course) => String(course.id) === String(selectedCourse))?.name || "Course"

  return (
    <div className="min-h-screen w-full bg-[#03071e] text-white px-5 py-6 sm:px-10 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/student-dashboard")}
          className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors mb-8 cursor-pointer"
        >
          <BiArrowBack /> {t('back_to_dashboard_btn')}
        </button>

        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-lime-300 font-bold mb-3">{t('student_performance')}</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t('my_rating')}</h1>
            <p className="text-indigo-300 mt-2">{t('rating_progress_hint')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 min-w-56">
          <label className="relative block min-w-56">
            <span className="sr-only">{t('choose_course')}</span>
            <select
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
              className="appearance-none w-full bg-[#0d174b] border border-indigo-700/60 rounded-xl px-4 py-3 pr-10 text-sm text-white outline-none focus:border-lime-400 cursor-pointer"
            >
              <option value="all">{t('all_courses')}</option>
              {courseOptions.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
            <BiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" />
          </label>
          <div className="flex rounded-xl border border-indigo-700/60 bg-[#0d174b] p-1">
            <button onClick={() => setRatingPeriod('weekly')} className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${ratingPeriod === 'weekly' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white'}`}>{t('weekly')}</button>
            <button onClick={() => setRatingPeriod('monthly')} className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${ratingPeriod === 'monthly' ? 'bg-lime-400 text-black' : 'text-indigo-300 hover:text-white'}`}>{t('monthly')}</button>
          </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 mb-8">
          {[1, 0, 2].map((index) => {
            const item = leaderboard[index]
            return (
              <div key={index} className={`${index === 0 ? 'md:order-2 min-h-56 border-lime-400/50' : index === 1 ? 'md:order-1 min-h-48 border-slate-400/40' : 'md:order-3 min-h-48 border-orange-500/40'} bg-gradient-to-b from-[#182665] to-[#101a50] border rounded-2xl p-5 text-center flex flex-col justify-end`}>
                <div className="text-3xl mb-2">{index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}</div>
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg">{item?.student?.full_name?.[0]?.toUpperCase() || '?'}</div>
                <p className="mt-3 text-white font-bold truncate">{item?.student?.full_name || 'No student'}</p>
                <p className="text-lime-300 font-bold mt-1">{item?.score || 0} {t('points')}</p>
                <p className="text-xs mt-1"><span>{getScoreMood(item?.score || 0, t).emoji}</span> <span className={getScoreMood(item?.score || 0, t).tone}>{getScoreMood(item?.score || 0, t).label}</span></p>
              </div>
            )
          })}
        </section>

        <section className="bg-[#0b153f] border border-indigo-800/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-5 border-b border-indigo-800/50">
            <div>
              <p className="text-white font-bold text-lg">{t('overall_ranking')}</p>
              <p className="text-indigo-300 text-xs mt-1">{selectedCourseName} · {t(ratingPeriod)} · {t('your_rank')}: {myRank || '-'}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-lime-300 font-semibold">
              <IoCheckmarkCircleOutline /> {t('graded_count', gradedSubmissions.length)}
            </div>
          </div>

          {(fetching || ratingFetching) && courseAssignments.length === 0 ? (
            <p className="text-center text-slate-400 py-16">{t('loading_results')}</p>
          ) : courseAssignments.length === 0 ? (
            <p className="text-center text-slate-400 py-16">{t('no_assignments_course')}</p>
          ) : leaderboard.length > 0 ? (
            <div className="divide-y divide-indigo-900/60">
              {leaderboard.map((item, index) => {
                return (
                  <div key={item.studentId} className="flex items-center gap-4 px-5 sm:px-7 py-4 hover:bg-indigo-900/20 transition-colors">
                    <span className="w-9 h-9 rounded-xl bg-indigo-900/60 flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-white font-semibold truncate">{item.student.full_name}</span>
                      <span className="block text-xs text-slate-400 mt-1">{item.student.email}</span>
                    </span>
                    <span className="text-right"><span className="block text-sm font-bold text-lime-300">{item.score} {t('points')}</span><span className="text-xs">{getScoreMood(item.score, t).emoji}</span></span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-16">{t('no_rating_data')}</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default StudentRating
