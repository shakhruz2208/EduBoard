import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BiArrowBack, BiChevronDown } from "react-icons/bi"
import { IoCheckmarkCircleOutline } from "react-icons/io5"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useAuth, resolveAvatarUrl } from "../Providers/AuthProvider"
import { useCourses } from "../Providers/CourseProvider"
import api from "../api"
import { normalizeAttendanceList } from "../utils/backend"
import { parseServerDate } from "../utils/datetime"
import { attendancePoints, normalizeGradeRows, totalScore } from "../utils/scoring"
import { useLanguage } from "../Providers/LanguageProvider"

const getScoreMood = (score, t) => {
  if (score >= 90) return { emoji: '🤩', tone: 'text-lime-300', label: t('mood_excellent') }
  if (score >= 75) return { emoji: '😄', tone: 'text-emerald-300', label: t('mood_great') }
  if (score >= 50) return { emoji: '🙂', tone: 'text-amber-300', label: t('mood_good') }
  if (score > 0) return { emoji: '💪', tone: 'text-orange-300', label: t('mood_keep_going') }
  return { emoji: '🌱', tone: 'text-slate-400', label: t('mood_no_score_yet') }
}

// Avatar with photo + initials fallback
const RatingAvatar = ({ member, name, size = 'w-14 h-14 text-lg', round = true }) => {
  const src = resolveAvatarUrl(member?.profile_pic)
  const initial = name?.[0]?.toUpperCase() || '?'
  return (
    <div className={`${size} ${round ? 'rounded-full' : 'rounded-xl'} overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shrink-0`}>
      {src ? (
        <img src={src} alt={name || 'Student'} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }} />
      ) : null}
      <span className={src ? 'hidden' : ''}>{initial}</span>
    </div>
  )
}

const StudentRating = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { assignmentsList, fetching } = useAssignments()
  const { courses, myGroup } = useCourses()
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [ratingPeriod, setRatingPeriod] = useState("monthly")
  const [now] = useState(() => Date.now())
  const [grades, setGrades] = useState([]) // rows from /student/grades
  const [ratingFetching, setRatingFetching] = useState(true)
  const [courseMembers, setCourseMembers] = useState([])
  const [attendanceScores, setAttendanceScores] = useState([])
  const [bonusByStudent, setBonusByStudent] = useState({}) // studentId → bonus points from /student/rating

  // All enrolled courses (union of /me/groups and /me/group)
  const allCourses = useMemo(() => {
    const list = [...(courses || [])]
    if (myGroup && !list.some((c) => c.id === myGroup.id)) list.push(myGroup)
    return list
  }, [courses, myGroup])

  useEffect(() => {
    let cancelled = false
    api.get('/student/grades')
      .then((res) => { if (!cancelled) setGrades(normalizeGradeRows(res.data)) })
      .catch(() => { if (!cancelled) setGrades([]) })
      .finally(() => { if (!cancelled) setRatingFetching(false) })
    return () => { cancelled = true }
  }, [])

  // Teacher bonus points (GET /student/rating) — additive on top of grades+attendance.
  useEffect(() => {
    let cancelled = false
    api.get('/student/rating')
      .then((res) => {
        if (cancelled) return
        const items = Array.isArray(res.data) ? res.data : res.data?.items || []
        const map = {}
        items.forEach((r) => {
          const sid = String(r.student_id ?? r.id ?? '')
          if (!sid) return
          map[sid] = (map[sid] || 0) + Number(r.score || 0)
        })
        setBonusByStudent(map)
      })
      .catch(() => { if (!cancelled) setBonusByStudent({}) })
    return () => { cancelled = true }
  }, [])

  // Fetch attendance from all lessons in all enrolled courses
  useEffect(() => {
    let cancelled = false
    if (!allCourses.length) return

    Promise.allSettled(allCourses.map((c) => api.get(`/groups/${c.id}/lessons`)))
      .then(async (lessonResults) => {
        if (cancelled) return
        const lessons = []
        const seen = new Set()
        lessonResults.forEach((r) => {
          if (r.status !== 'fulfilled') return
          const items = Array.isArray(r.value.data) ? r.value.data : r.value.data?.items || []
          items.forEach((l) => {
            if (seen.has(l.id)) return
            seen.add(l.id)
            lessons.push(l)
          })
        })
        if (!lessons.length) { if (!cancelled) setAttendanceScores([]); return }

        const attResults = await Promise.allSettled(
          lessons.map((l) => api.get(`/lessons/${l.id}/attendance`))
        )
        const allAtt = []
        const seenRows = new Set()
        attResults.forEach((r) => {
          if (r.status !== 'fulfilled') return
          normalizeAttendanceList(r.value.data).forEach((a) => {
            const key = `${a.id ?? ''}:${a.studentId}`
            if (seenRows.has(key)) return
            seenRows.add(key)
            allAtt.push(a)
          })
        })
        if (!cancelled) setAttendanceScores(allAtt)
      })
      .catch(() => { if (!cancelled) setAttendanceScores([]) })
    return () => { cancelled = true }
  }, [allCourses])

  useEffect(() => {
    let cancelled = false
    if (!allCourses.length) return undefined
    Promise.allSettled(allCourses.map((course) => api.get(`/group/${course.id}/members`)))
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
      .catch(() => { if (!cancelled) setCourseMembers([]) })
    return () => { cancelled = true }
  }, [allCourses])

  const courseOptions = useMemo(() => {
    const known = new Set(assignmentsList.map((item) => String(item.group_id)))
    known.add('all')
    return allCourses.filter((course) => known.has(String(course.id)) || selectedCourse === String(course.id))
  }, [assignmentsList, allCourses, selectedCourse])

  // Assignments of the selected course (mirrored objects carry activity meta)
  const courseAssignments = useMemo(() => assignmentsList.filter((item) => (
    selectedCourse === "all" || String(item.group_id) === String(selectedCourse)
  )), [assignmentsList, selectedCourse])

  const assignmentIds = useMemo(() =>
    new Set(courseAssignments.map((item) => String(item.id))),
  [courseAssignments])

  // Graded homework rows within the selected course (grade → points 1:1)
  const gradedRows = useMemo(() => {
    const periodMs = ratingPeriod === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
    const cutoff = now - periodMs
    return grades.filter((row) => {
      if (row.grade == null || row.grade === "") return false
      if (!assignmentIds.has(String(row.assignmentId))) return false
      // Server timestamps are naive UTC — parseServerDate handles the offset
      const gradedAt = parseServerDate(row.gradedAt || row.submittedAt)
      if (!gradedAt) return true // undated rows always count
      return gradedAt.getTime() >= cutoff
    })
  }, [grades, assignmentIds, ratingPeriod, now])

  // Attendance rows within the selected course, filtered by the same period
  const periodAttendance = useMemo(() => {
    const periodMs = ratingPeriod === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
    const cutoff = now - periodMs
    return attendanceScores.filter((row) => {
      const at = parseServerDate(row.updatedAt || row.markedAt)
      if (!at) return true
      return at.getTime() >= cutoff
    })
  }, [attendanceScores, ratingPeriod, now])

  const myGradedRows = gradedRows.filter((row) => String(row.studentId) === String(user?.id))

  const leaderboard = useMemo(() => {
    const graded = new Map()
    gradedRows.forEach((row) => {
      const id = String(row.studentId)
      graded.set(id, (graded.get(id) || 0) + Number(row.grade))
    })
    const attendance = new Map()
    periodAttendance.forEach((row) => {
      const id = String(row.studentId)
      if (!id || id === 'undefined') return
      attendance.set(id, (attendance.get(id) || 0) + attendancePoints(row.status))
    })
    const ids = new Set([
      ...graded.keys(),
      ...attendance.keys(),
      ...courseMembers.map((m) => String(m.id)),
    ])
    return [...ids]
      .map((id) => ({
        studentId: id,
        gradedPoints: graded.get(id) || 0,
        attendancePoints: attendance.get(id) || 0,
        score: totalScore({ gradedPoints: graded.get(id) || 0, attendance: attendance.get(id) || 0 }),
        bonusPoints: bonusByStudent[id] || 0,
        student: courseMembers.find((member) => String(member.id) === id)
      }))
      .map((item) => ({ ...item, score: item.score + item.bonusPoints }))
      .filter((item) => item.student || item.score > 0)
      .sort((a, b) => b.score - a.score)
  }, [courseMembers, gradedRows, periodAttendance, bonusByStudent])

  const myRank = leaderboard.findIndex((item) => String(item.studentId) === String(user?.id)) + 1
  const myScore = leaderboard.find((item) => String(item.studentId) === String(user?.id))?.score || 0
  const selectedCourseName = selectedCourse === "all"
    ? t('all_courses')
    : allCourses.find((course) => String(course.id) === String(selectedCourse))?.name || "Course"

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

        {/* TOP-3 podium */}
        {leaderboard.length >= 3 && (
          <section className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 mb-8">
            {[1, 0, 2].map((index) => {
              const item = leaderboard[index]
              return (
                <div key={index} className={`${index === 0 ? 'md:order-2 min-h-56 border-lime-400/50' : index === 1 ? 'md:order-1 min-h-48 border-slate-400/40' : 'md:order-3 min-h-48 border-orange-500/40'} bg-gradient-to-b from-[#182665] to-[#101a50] border rounded-2xl p-5 text-center flex flex-col justify-end`}>
                  <div className="text-3xl mb-2">{index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}</div>
                  <div className="mx-auto"><RatingAvatar member={item?.student} name={item?.student?.full_name} size={index === 0 ? 'w-16 h-16 text-xl' : 'w-14 h-14 text-lg'} /></div>
                  <p className="mt-3 text-white font-bold truncate">{item?.student?.full_name || '—'}</p>
                  <p className="text-lime-300 font-bold mt-1">{item?.score || 0} {t('points')}</p>
                  <p className="text-xs mt-1"><span>{getScoreMood(item?.score || 0, t).emoji}</span> <span className={getScoreMood(item?.score || 0, t).tone}>{getScoreMood(item?.score || 0, t).label}</span></p>
                </div>
              )
            })}
          </section>
        )}

        {/* My score summary */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-b from-[#182665] to-[#101a50] border border-lime-400/40 rounded-2xl p-5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">{t('your_rank')}</p>
            <p className="text-3xl font-black text-white mt-2">{myRank || '—'}</p>
          </div>
          <div className="bg-gradient-to-b from-[#182665] to-[#101a50] border border-indigo-500/30 rounded-2xl p-5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">{t('points')}</p>
            <p className="text-3xl font-black text-lime-300 mt-2">{myScore}</p>
          </div>
          <div className="bg-gradient-to-b from-[#182665] to-[#101a50] border border-indigo-500/30 rounded-2xl p-5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">{t('graded_count', myGradedRows.length)}</p>
            <p className="text-xs mt-3"><span>{getScoreMood(myScore, t).emoji}</span> <span className={getScoreMood(myScore, t).tone}>{getScoreMood(myScore, t).label}</span></p>
          </div>
        </section>

        <section className="bg-[#0b153f] border border-indigo-800/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-5 border-b border-indigo-800/50">
            <div>
              <p className="text-white font-bold text-lg">{t('overall_ranking')}</p>
              <p className="text-indigo-300 text-xs mt-1">
                {selectedCourseName} · {t(ratingPeriod)} · {t('your_rank')}: {myRank || '-'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-lime-300 font-semibold">
              <IoCheckmarkCircleOutline /> {t('graded_count', myGradedRows.length)}
            </div>
          </div>

          {(fetching || ratingFetching) && courseAssignments.length === 0 ? (
            <p className="text-center text-slate-400 py-16">{t('loading_results')}</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-center text-slate-400 py-16">{t('no_rating_data')}</p>
          ) : (
            <div className="divide-y divide-indigo-900/60">
              {leaderboard.map((item, index) => (                  <div key={item.studentId} className={`flex items-center gap-4 px-5 sm:px-7 py-4 hover:bg-indigo-900/20 transition-colors ${String(item.studentId) === String(user?.id) ? 'bg-lime-400/5' : ''}`}>
                    <span className="w-9 h-9 rounded-xl bg-indigo-900/60 flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <RatingAvatar member={item.student} name={item.student?.full_name} size="w-9 h-9 text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-white font-semibold truncate">
                      {item.student?.full_name || `Student #${item.studentId}`}
                      {String(item.studentId) === String(user?.id) && <span className="text-lime-300 text-xs ml-2">({t('your_rank')})</span>}
                    </span>
                    <span className="block text-xs text-slate-400 mt-1">
                      {item.student?.email || `Homework: ${item.gradedPoints} pts · Attendance: ${item.attendancePoints} pts`}
                      {item.bonusPoints > 0 && <span className="text-emerald-400 ml-2">· ⭐ +{item.bonusPoints}</span>}
                    </span>
                  </span>
                  <span className="text-right"><span className="block text-sm font-bold text-lime-300">{item.score} {t('points')}</span><span className="text-xs">{getScoreMood(item.score, t).emoji}</span></span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default StudentRating
