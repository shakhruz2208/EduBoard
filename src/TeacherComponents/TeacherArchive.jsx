import { useEffect, useMemo, useState } from "react"
import { CgSpinner } from "react-icons/cg"
import { IoBookOutline, IoChevronDown, IoChevronForward } from "react-icons/io5"
import { BiCalendar } from "react-icons/bi"
import { useCourses } from "../Providers/CourseProvider"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import api from "../api"
import { normalizeActivityList, normalizeAttendanceList } from "../utils/backend"
import { groupLessonsByWeek, isWeekFinished, isObjectArchived, objectWeekLabel } from "../utils/archive"
import { formatDate } from "../utils/datetime"

const KIND_ICONS = { homework: "📝", exam: "📋", quiz: "❓", materials: "📚", activity: "📌" }

const TeacherArchive = () => {
  const { t } = useLanguage()
  const { courses } = useCourses()
  const { assignmentsList, submissions } = useAssignments()
  const [tab, setTab] = useState("assignments") // assignments | lessons
  const [selectedCourse, setSelectedCourse] = useState("")
  const [courseLessons, setCourseLessons] = useState([]) // lessons of selected course
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState({}) // lessonId → activities[]
  const [expandedLoading, setExpandedLoading] = useState({})

  useEffect(() => {
    if (!selectedCourse && courses[0]) setSelectedCourse(String(courses[0].id))
  }, [courses, selectedCourse])

  useEffect(() => {
    if (!selectedCourse) return
    let cancelled = false
    setLoading(true)
    setExpanded({})
    api.get(`/groups/${selectedCourse}/lessons`)
      .then((res) => {
        if (cancelled) return
        const items = Array.isArray(res.data) ? res.data : res.data?.items || []
        // Keep only lessons whose week has fully ended
        setCourseLessons(items.filter((l) => isWeekFinished(l.starts_at || l.date || l.created_at || new Date())))
      })
      .catch(() => { if (!cancelled) setCourseLessons([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedCourse])

  const weeks = useMemo(() => groupLessonsByWeek(courseLessons).archived, [courseLessons])

  const toggleLesson = async (lesson) => {
    if (expanded[lesson.id]) {
      setExpanded((p) => { const n = { ...p }; delete n[lesson.id]; return n })
      return
    }
    setExpandedLoading((p) => ({ ...p, [lesson.id]: true }))
    try {
      const [actRes, attRes] = await Promise.allSettled([
        api.get(`/lessons/${lesson.id}/activities`),
        api.get(`/lessons/${lesson.id}/attendance`),
      ])
      const activities = actRes.status === 'fulfilled'
        ? normalizeActivityList(actRes.value.data, { lessonId: lesson.id })
        : []
      const attendance = attRes.status === 'fulfilled'
        ? normalizeAttendanceList(attRes.value.data)
        : []
      setExpanded((p) => ({ ...p, [lesson.id]: { activities, attendance } }))
    } finally {
      setExpandedLoading((p) => ({ ...p, [lesson.id]: false }))
    }
  }

  const courseName = courses.find((c) => String(c.id) === String(selectedCourse))?.name

  // Archived assignments of the selected course, grouped by week (newest first)
  // together with every submission they received.
  const subsByAssignment = useMemo(() => {
    const map = new Map()
    ;(submissions || []).forEach((s) => {
      const key = String(s.assignmentId)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    })
    return map
  }, [submissions])

  const assignmentWeeks = useMemo(() => {
    const filtered = assignmentsList.filter((a) => {
      if (!isObjectArchived(a)) return false
      if (!selectedCourse) return true
      return String(a.group?.id ?? a.group_id ?? a.courseId) === String(selectedCourse)
    })
    const map = new Map()
    filtered.forEach((item) => {
      const label = objectWeekLabel(item)
      if (!map.has(label)) map.set(label, { label, items: [] })
      map.get(label).items.push(item)
    })
    return [...map.values()]
  }, [assignmentsList, selectedCourse])

  return (
    <div className="min-h-screen w-full bg-[#03071e] text-white px-5 py-6 sm:px-10 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-lime-300 font-bold mb-3">{t('nav_archive')}</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t('archive_title')}</h1>
          <p className="text-indigo-300 mt-2 max-w-2xl">{t('archive_subtitle')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="bg-[#0b153f] border border-indigo-800/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-lime-400 cursor-pointer">
            <option value="">{t('select_course')}</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Tabs: archived assignments (with submissions) vs archived lessons */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "assignments", label: t("archive_tab_assignments"), icon: "⚡" },
            { key: "lessons", label: t("archive_tab_lessons"), icon: "📚" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${tab === key ? "bg-lime-500/15 text-lime-300 border border-lime-500/40" : "bg-[#0b153f] text-indigo-300/70 border border-indigo-800/60 hover:text-white"}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {tab === "assignments" ? (
          assignmentWeeks.length === 0 ? (
            <div className="py-20 text-center text-slate-400">⚡ {t('archive_empty')}</div>
          ) : (
            <div className="flex flex-col gap-6">
              {assignmentWeeks.map((week) => (
                <section key={week.label} className="bg-[#0b153f] border border-indigo-800/50 rounded-2xl overflow-hidden">
                  <div className="px-5 sm:px-7 py-4 border-b border-indigo-800/50 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">⚡</div>
                    <div>
                      <p className="text-white font-bold">{t('archive_week_label')} · {week.label}</p>
                      <p className="text-indigo-300/60 text-xs mt-0.5">{t('archive_assignments_count', `${week.items.length}`)}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-indigo-900/60">
                    {week.items.map((item) => {
                      const subs = (subsByAssignment.get(String(item.objectId ?? item.id)) || [])
                        .slice()
                        .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
                      return (
                        <div key={item.id} className="px-5 sm:px-7 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-white">{item.name || item.title}</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300">{item.kind || "homework"}</span>
                            {item.deadline && <span className="text-[10px] text-slate-500">{formatDate(item.deadline)}</span>}
                            <span className="text-[10px] text-indigo-300/70 ml-auto">{t("archive_subs_count", `${subs.length}`)}</span>
                          </div>
                          {subs.length > 0 && (
                            <div className="mt-3 flex flex-col gap-2">
                              {subs.map((s) => {
                                return (
                                  <div key={s.id} className="rounded-xl bg-[#0e1442] border border-indigo-900/50 p-3 flex items-center gap-3 flex-wrap">
                                    <span className="text-sm text-white font-medium">{s.studentName}</span>
                                    {s.late && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{t("late_label")}</span>}
                                    <span className="text-[11px] text-slate-500">{formatDate(s.submittedAt)}</span>
                                    {s.grade != null && (
                                      <span className="text-[11px] font-bold text-emerald-400 ml-auto">{s.grade}/100</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-indigo-300"><CgSpinner className="animate-spin" /> {t('loading')}</div>
        ) : weeks.length === 0 ? (
          <div className="py-20 text-center text-slate-400"><IoBookOutline className="text-5xl mx-auto mb-3 text-indigo-500" />{t('archive_empty')}</div>
        ) : (
          <div className="flex flex-col gap-6">
            {weeks.map((week) => (
              <section key={week.label} className="bg-[#0b153f] border border-indigo-800/50 rounded-2xl overflow-hidden">
                <div className="px-5 sm:px-7 py-4 border-b border-indigo-800/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center"><BiCalendar className="text-indigo-300" /></div>
                    <div>
                      <p className="text-white font-bold">{t('archive_week_label')} · {week.label}</p>
                      <p className="text-indigo-300/60 text-xs mt-0.5">
                        {courseName} · {t('archive_lessons_count', week.lessons.length)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-indigo-900/60">
                  {week.lessons.map((lesson) => {
                    const open = Boolean(expanded[lesson.id])
                    const loadingL = expandedLoading[lesson.id]
                    return (
                      <div key={lesson.id}>
                        <button
                          onClick={() => toggleLesson(lesson)}
                          className="w-full flex items-center gap-3 px-5 sm:px-7 py-4 hover:bg-indigo-900/20 transition-colors text-left cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 flex items-center justify-center shrink-0"><IoBookOutline className="text-indigo-300" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold truncate">{lesson.title}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{lesson.description || t('lesson_content_hint')}</p>
                          </div>
                          {open
                            ? <IoChevronDown className="text-indigo-400 shrink-0" />
                            : <IoChevronForward className="text-indigo-400 shrink-0" />}
                        </button>

                        {open && (
                          <div className="px-5 sm:px-7 pb-5 pl-[68px] sm:pl-[84px]">
                            {loadingL ? (
                              <div className="flex items-center gap-2 text-indigo-300 py-3"><CgSpinner className="animate-spin" /><span className="text-xs">{t('loading')}</span></div>
                            ) : (
                              <>
                                {/* Activities kept in full */}
                                {(expanded[lesson.id]?.activities || []).length === 0 ? (
                                  <p className="text-xs text-slate-500 py-2">{t('no_activities')}</p>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    {expanded[lesson.id].activities.map((act) => (
                                      <div key={act.id} className="rounded-xl bg-[#0e1442] border border-indigo-900/50 p-3">
                                        <div className="flex items-center gap-2">
                                          <span>{KIND_ICONS[act.kind] || "📌"}</span>
                                          <span className="font-semibold text-sm text-white truncate flex-1">{act.title}</span>
                                          <span className="text-[10px] uppercase text-lime-300">{t(`activity_${act.kind}`)}</span>
                                        </div>
                                        {act.description && <p className="text-xs text-slate-400 mt-1">{act.description}</p>}
                                        {act.deadline && <p className="text-xs text-amber-300 mt-1"><BiCalendar className="inline mr-1" />{formatDate(act.deadline)}</p>}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Attendance summary */}
                                {(expanded[lesson.id]?.attendance || []).length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-indigo-900/50">
                                    <p className="text-[10px] uppercase tracking-wider text-indigo-400/60 font-bold mb-2">{t("attendance")}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {expanded[lesson.id].attendance.map((a) => (
                                        <span key={`${a.id}-${a.studentId}`} className={`text-[10px] font-bold px-2 py-1 rounded-full ${a.status === 'present' ? 'bg-emerald-500/15 text-emerald-400' : a.status === 'late' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                                          {a.status === 'present' ? '✓' : a.status === 'late' ? '⏰' : '✗'} +{{ present: 10, late: 7, absent: 0 }[a.status] ?? 0}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherArchive
