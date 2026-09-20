import { useEffect, useMemo, useState } from "react"
import { BiSearch, BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { HiOutlineUsers } from "react-icons/hi2"
import { CgSpinner } from "react-icons/cg"
import { useCourses } from "../Providers/CourseProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { resolveAvatarUrl } from "../Providers/AuthProvider"
import api from "../api"
import { normalizeAttendanceList } from "../utils/backend"
import { attendancePoints } from "../utils/scoring"
import { parseServerDate } from "../utils/datetime"

const PAGE_SIZE = 10

const getScoreMood = (score, t) => {
  if (score >= 90) return { emoji: '🤩', tone: 'text-lime-300', label: t('mood_excellent') }
  if (score >= 75) return { emoji: '😄', tone: 'text-emerald-300', label: t('mood_great') }
  if (score >= 50) return { emoji: '🙂', tone: 'text-amber-300', label: t('mood_good') }
  if (score > 0) return { emoji: '💪', tone: 'text-orange-300', label: t('mood_keep_going') }
  return { emoji: '🌱', tone: 'text-slate-400', label: t('mood_no_score_yet') }
}

// Avatar with photo + initials fallback
const RatingAvatar = ({ member, name, size = 'w-14 h-14 text-lg' }) => {
  const src = resolveAvatarUrl(member?.profile_pic)
  const initial = name?.[0]?.toUpperCase() || '?'
  return (
    <div className={`${size} rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shrink-0`}>
      {src ? (
        <img src={src} alt={name || 'Student'} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }} />
      ) : null}
      <span className={src ? 'hidden' : ''}>{initial}</span>
    </div>
  )
}

const TeacherRating = () => {
  const { t } = useLanguage()
  const { courses } = useCourses()
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [ratingPeriod, setRatingPeriod] = useState("monthly")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [students, setStudents] = useState([])
  const [studentsFetching, setStudentsFetching] = useState(true)
  const [submissions, setSubmissions] = useState([])
  const [submissionsFetching, setSubmissionsFetching] = useState(true)
  const [attendanceRows, setAttendanceRows] = useState([])
  const [now] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    api.get('/teacher/students')
      .then((response) => { if (!cancelled) setStudents(Array.isArray(response.data) ? response.data : response.data?.items || []) })
      .catch(() => { if (!cancelled) setStudents([]) })
      .finally(() => { if (!cancelled) setStudentsFetching(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    api.get('/teacher/homework')
      .then((response) => {
        if (cancelled) return
        const rows = Array.isArray(response.data) ? response.data : response.data?.items || []
        setSubmissions(rows.map((r) => ({
          id: r.id,
          studentId: r.student_id,
          grade: r.grade,
          gradedAt: r.graded_at,
          submittedAt: r.submitted_at,
        })))
      })
      .catch(() => { if (!cancelled) setSubmissions([]) })
      .finally(() => { if (!cancelled) setSubmissionsFetching(false) })
    return () => { cancelled = true }
  }, [])

  // Attendance across every lesson of every course
  useEffect(() => {
    let cancelled = false
    if (!courses.length) return
    Promise.allSettled(courses.map((c) => api.get(`/groups/${c.id}/lessons`)))
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
        if (!lessons.length) { if (!cancelled) setAttendanceRows([]); return }
        const attResults = await Promise.allSettled(
          lessons.map((l) => api.get(`/lessons/${l.id}/attendance`))
        )
        const rows = []
        const seenRows = new Set()
        attResults.forEach((r) => {
          if (r.status !== 'fulfilled') return
          normalizeAttendanceList(r.value.data).forEach((a) => {
            const key = `${a.id ?? ''}:${a.studentId}`
            if (seenRows.has(key)) return
            seenRows.add(key)
            rows.push(a)
          })
        })
        if (!cancelled) setAttendanceRows(rows)
      })
      .catch(() => { if (!cancelled) setAttendanceRows([]) })
    return () => { cancelled = true }
  }, [courses])

  const periodMs = ratingPeriod === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
  const cutoff = now - periodMs

  const leaderboard = useMemo(() => {
    const graded = new Map()
    submissions.forEach((sub) => {
      if (sub.grade == null) return
      const at = parseServerDate(sub.gradedAt || sub.submittedAt)
      if (at && at.getTime() < cutoff) return
      const id = String(sub.studentId)
      graded.set(id, (graded.get(id) || 0) + Number(sub.grade))
    })
    const attendance = new Map()
    attendanceRows.forEach((row) => {
      const at = parseServerDate(row.updatedAt || row.markedAt)
      if (at && at.getTime() < cutoff) return
      const id = String(row.studentId)
      if (!id || id === 'undefined') return
      attendance.set(id, (attendance.get(id) || 0) + attendancePoints(row.status))
    })
    const ids = new Set([
      ...students.map((s) => String(s.id)),
      ...graded.keys(),
      ...attendance.keys(),
    ])
    return [...ids]
      .map((id) => {
        const student = students.find((s) => String(s.id) === id)
        const g = graded.get(id) || 0
        const a = attendance.get(id) || 0
        return {
          studentId: id,
          gradedPoints: g,
          attendancePoints: a,
          score: g + a,
          student,
        }
      })
      .filter((item) => item.student)
      .filter((item) => selectedCourse === 'all' || String(item.student.group_id) === String(selectedCourse))
      .sort((a, b) => b.score - a.score)
  }, [students, submissions, attendanceRows, cutoff, selectedCourse])

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leaderboard
    return leaderboard.filter((item) =>
      item.student?.full_name?.toLowerCase().includes(q) ||
      item.student?.email?.toLowerCase().includes(q)
    )
  }, [leaderboard, search])

  const podium = searched.slice(0, 3)
  const rest = searched.slice(3)
  const pageCount = Math.max(1, Math.ceil(rest.length / PAGE_SIZE))
  const visibleRest = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const isLoading = studentsFetching || submissionsFetching

  return (
    <div className="min-h-screen w-full bg-[#03071e] text-white px-5 py-6 sm:px-10 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-lime-300 font-bold mb-3">{t('student_performance')}</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t('teacher_rating_title')}</h1>
          <p className="text-indigo-300 mt-2 max-w-2xl">{t('teacher_rating_subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="relative flex-1">
            <span className="sr-only">{t('search_students')}</span>
            <BiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder={t('search_students')} className="w-full bg-[#0b153f] border border-indigo-800/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-indigo-400/70 outline-none focus:border-lime-400" />
          </label>
          <select value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); setPage(1) }} className="bg-[#0b153f] border border-indigo-800/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-lime-400 cursor-pointer">
            <option value="all">{t('all_courses')}</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex rounded-xl border border-indigo-800/60 bg-[#0b153f] p-1 self-stretch">
            <button onClick={() => { setRatingPeriod('weekly'); setPage(1) }} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${ratingPeriod === 'weekly' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white'}`}>{t('weekly')}</button>
            <button onClick={() => { setRatingPeriod('monthly'); setPage(1) }} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${ratingPeriod === 'monthly' ? 'bg-lime-400 text-black' : 'text-indigo-300 hover:text-white'}`}>{t('monthly')}</button>
          </div>
        </div>

        {isLoading && students.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-20 text-indigo-300"><CgSpinner className="animate-spin" /> {t('loading')}</div>
        ) : searched.length === 0 ? (
          <div className="py-20 text-center text-slate-400"><HiOutlineUsers className="text-5xl mx-auto mb-3 text-indigo-500" />{t('no_rating_data')}</div>
        ) : (
          <>
            {/* TOP-3 podium */}
            {podium.length >= 3 && (
              <section className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 mb-8">
                {[1, 0, 2].map((index) => {
                  const item = podium[index]
                  if (!item) return null
                  return (
                    <div key={item.studentId} className={`${index === 0 ? 'md:order-2 min-h-56 border-lime-400/50' : index === 1 ? 'md:order-1 min-h-48 border-slate-400/40' : 'md:order-3 min-h-48 border-orange-500/40'} bg-gradient-to-b from-[#182665] to-[#101a50] border rounded-2xl p-5 text-center flex flex-col justify-end`}>
                      <div className="text-3xl mb-2">{index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}</div>
                      <div className="mx-auto"><RatingAvatar member={item.student} name={item.student?.full_name} size={index === 0 ? 'w-16 h-16 text-xl' : 'w-14 h-14 text-lg'} /></div>
                      <p className="mt-3 text-white font-bold truncate">{item.student?.full_name || '—'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.student?.email}</p>
                      <p className="text-lime-300 font-bold mt-1">{item.score} {t('points')}</p>
                      <p className="text-xs mt-1"><span>{getScoreMood(item.score, t).emoji}</span> <span className={getScoreMood(item.score, t).tone}>{getScoreMood(item.score, t).label}</span></p>
                    </div>
                  )
                })}
              </section>
            )}

            {/* Rest of the ranking */}
            <section className="bg-[#0b153f] border border-indigo-800/50 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-5 border-b border-indigo-800/50">
                <div>
                  <p className="text-white font-bold text-lg">{t('overall_ranking')}</p>
                  <p className="text-indigo-300 text-xs mt-1">
                    {selectedCourse === 'all' ? t('all_courses') : courses.find((c) => String(c.id) === String(selectedCourse))?.name || ''} · {t(ratingPeriod)} · {t('teacher_rating_count', searched.length)}
                  </p>
                </div>
              </div>

              {visibleRest.length === 0 ? (
                podium.length > 0 && podium.length < 3 ? (
                  <div className="divide-y divide-indigo-900/60">
                    {podium.map((item, index) => (
                      <div key={item.studentId} className="flex items-center gap-4 px-5 sm:px-7 py-4 hover:bg-indigo-900/20 transition-colors">
                        <span className="w-9 h-9 rounded-xl bg-indigo-900/60 flex items-center justify-center shrink-0">{index + 1}</span>
                        <RatingAvatar member={item.student} name={item.student?.full_name} size="w-9 h-9 text-sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-white font-semibold truncate">{item.student?.full_name}</span>
                          <span className="block text-xs text-slate-400 mt-1">{item.student?.email}</span>
                        </span>
                        <span className="text-right"><span className="block text-sm font-bold text-lime-300">{item.score} {t('points')}</span><span className="text-xs">{getScoreMood(item.score, t).emoji}</span></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-12">{t('teacher_rating_all_in_podium')}</p>
                )
              ) : (
                <div className="divide-y divide-indigo-900/60">
                  {visibleRest.map((item, index) => (
                    <div key={item.studentId} className="flex items-center gap-4 px-5 sm:px-7 py-4 hover:bg-indigo-900/20 transition-colors">
                      <span className="w-9 h-9 rounded-xl bg-indigo-900/60 flex items-center justify-center shrink-0">{index + 4}</span>
                      <RatingAvatar member={item.student} name={item.student?.full_name} size="w-9 h-9 text-sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-white font-semibold truncate">{item.student?.full_name}</span>
                        <span className="block text-xs text-slate-400 mt-1">
                          {item.student?.email} · {t('teacher_rating_homework')}: {item.gradedPoints} · {t('teacher_rating_attendance')}: {item.attendancePoints}
                        </span>
                      </span>
                      <span className="text-right"><span className="block text-sm font-bold text-lime-300">{item.score} {t('points')}</span><span className="text-xs">{getScoreMood(item.score, t).emoji}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pagination */}
            {rest.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-5 text-xs text-indigo-300">
                <span>{t('student_page', rest.length, page, pageCount)}</span>
                <div className="flex items-center gap-1">
                  <button disabled={page === 1} onClick={() => setPage((v) => v - 1)} className="w-8 h-8 rounded-lg bg-[#0b153f] border border-indigo-800 disabled:opacity-40 cursor-pointer"><BiChevronLeft className="mx-auto" /></button>
                  <span className="px-3">{page} / {pageCount}</span>
                  <button disabled={page === pageCount} onClick={() => setPage((v) => v + 1)} className="w-8 h-8 rounded-lg bg-[#0b153f] border border-indigo-800 disabled:opacity-40 cursor-pointer"><BiChevronRight className="mx-auto" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TeacherRating
