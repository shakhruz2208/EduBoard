/**
 * Lesson archive — groups each lesson into the calendar week it belongs to.
 *
 * The backend has no archive table, so "archived" is a client-side view:
 * any lesson whose week has fully ended (week ends Sunday 23:59:59) is
 * considered archived, along with all of its activities. Nothing is deleted —
 * current-week lessons stay on the dashboard and everything older shows up
 * here, complete with activities, deadlines and attendance.
 */

import { parseServerDate } from './datetime'

/** Monday 00:00 of the week containing `date` (local time). */
export const startOfWeek = (date) => {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday = 0 … Sunday = 6
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Sunday 23:59:59.999 of the week containing `date`. */
export const endOfWeek = (date) => {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  end.setMilliseconds(-1)
  return end
}

/**
 * A week is "finished" when its Sunday 23:59:59 is in the past.
 * The current calendar week is NEVER archived, even if its lessons are old.
 */
export const isWeekFinished = (date) => endOfWeek(date).getTime() < Date.now()

/**
 * Human label for a week: "Sep 8 – Sep 14".
 */
export const weekLabel = (date) => {
  const s = startOfWeek(date)
  const e = endOfWeek(date)
  const sameMonth = s.getMonth() === e.getMonth()
  const fmt = (d, opts) => d.toLocaleDateString('en-US', opts)
  return sameMonth
    ? `${fmt(s, { month: 'short', day: 'numeric' })} – ${e.getDate()}`
    : `${fmt(s, { month: 'short', day: 'numeric' })} – ${fmt(e, { month: 'short', day: 'numeric' })}`
}

/**
 * Split lessons into { current, archived } — archived is sorted newest week
 * first. Each archived group: { weekStart, label, lessons }.
 */
export const groupLessonsByWeek = (lessons) => {
  const current = []
  const weekMap = new Map() // weekStartMs → { weekStart, label, lessons }
  ;(lessons || []).forEach((lesson) => {
    // Prefer the lesson's own date; fall back to its creation stamp.
    const when = parseServerDate(lesson.starts_at || lesson.date || lesson.created_at) || new Date()
    if (!isWeekFinished(when)) {
      current.push(lesson)
      return
    }
    const weekStart = startOfWeek(when)
    const key = weekStart.getTime()
    if (!weekMap.has(key)) {
      weekMap.set(key, { weekStart, label: weekLabel(when), lessons: [] })
    }
    weekMap.get(key).lessons.push(lesson)
  })
  const archived = [...weekMap.values()].sort((a, b) => b.weekStart - a.weekStart)
  return { current, archived }
}

/** Build a lessonId → course info map from course lessons responses. */
export const buildLessonCourseMap = (coursesWithLessons) => {
  const map = {}
  coursesWithLessons.forEach(({ course, lessons }) => {
    ;(lessons || []).forEach((lesson) => {
      map[lesson.id] = { id: course.id, name: course.name }
    })
  })
  return map
}

/*
 * Object (assignment) archiving — a finished week's assignments and their
 * submissions leave the dashboard and live only in the archive view.
 * Same client-side rule as lessons: the object belongs to the week of its
 * deadline (falling back to the lesson date / creation stamp), and once that
 * week's Sunday 23:59:59 has passed it is considered archived.
 */

/** The timestamp that decides which week an assignment belongs to. */
export const objectDate = (item) => {
  const when = parseServerDate(
    item?.deadline || item?.starts_at || item?.date || item?.created_at
  )
  return when || new Date()
}

/** True when the assignment's week has fully ended → hidden from dashboards. */
export const isObjectArchived = (item) => isWeekFinished(objectDate(item))

/** Week label for an assignment ("Sep 8 – Sep 14"), consistent with lessons. */
export const objectWeekLabel = (item) => weekLabel(objectDate(item))
