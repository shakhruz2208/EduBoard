import api from '../api'
import { normalizeActivity } from '../utils/backend'

/**
 * Shared lesson-activity service used by the teacher surfaces.
 *
 * Backend reality (probed against the live API):
 *  - GET /lessons/{id}/activities only ever returns rows whose kind is
 *    "activity". Items created via POST /lessons/{id}/homework|exam|quiz
 *    are stored with that kind and are NOT listed back by any endpoint —
 *    creating them that way makes them invisible to students.
 *  - POST /lessons/{id}/activities ignores a client-supplied kind (always
 *    writes "activity"), so the real type is stored in content.kind.
 *  - Lesson items cannot be submitted by students (no submit route accepts
 *    their ids), so every gradable activity is mirrored into a real object
 *    via POST /add-object; the mirror id is kept in content.object_id and
 *    students submit against POST /object/{id}/submit as usual.
 *  - There is no PATCH route for lesson items or objects, so "edit" is
 *    implemented as delete + recreate.
 */

export const GRADABLE_KINDS = ['homework', 'exam', 'quiz']

export const isGradableKind = (kind) => GRADABLE_KINDS.includes(kind)

/**
 * Create a lesson activity (and its gradable mirror object when needed).
 * Returns the normalized activity, or throws on failure.
 */
export const createActivity = async ({ lessonId, kind, title, description, deadline, courseName, courseId, questions }) => {
  const content = {}
  if (deadline) content.deadline = deadline
  // The row's own kind is forced to "activity" by the backend; the real
  // type lives here so normalizeActivity() can recover it on read.
  content.kind = kind
  // Quiz questions are stored inside content.questions (backend passes the
  // JSON through untouched).
  if (Array.isArray(questions) && questions.length) content.questions = questions

  // Mirror objects show their description on the student's detail page —
  // quiz questions ride along under a marker so they survive the round-trip.
  const mirrorDescription = (Array.isArray(questions) && questions.length)
    ? `${description ? `${description}\n\n` : ''}@@QUIZ@@${JSON.stringify(questions)}`
    : description

  let mirror = null
  if (isGradableKind(kind)) {
    // Mirror into a real object so students can open AND submit it.
    mirror = await api.post('/add-object', {
      name: title,
      description: mirrorDescription || null,
      deadline: deadline || null,
      group_id: Number(courseId),
    })
    content.object_id = mirror.data.id
  }

  const res = await api.post(`/lessons/${lessonId}/activities`, {
    title,
    description: description || null,
    url: null,
    content,
  })

  const normalized = normalizeActivity(res.data, { lessonId, courseId, courseName })
  if (mirror) normalized.objectId = mirror.data.id
  return normalized
}

/**
 * Delete a lesson activity plus its mirror object (best-effort on both).
 * Tries every known delete route because item ids and object ids live in
 * different tables.
 */
export const deleteActivity = async (activity) => {
  const endpoints = [
    `/lessons/${activity.lessonId}/homework/${activity.id}`,
    `/lessons/${activity.lessonId}/activities/${activity.id}`,
    `/object/${activity.id}`,
  ]
  let deleted = false
  for (const url of endpoints) {
    try {
      await api.delete(url)
      deleted = true
      break
    } catch { /* try next route */ }
  }
  // The mirror object is a separate row — remove it too (best effort).
  if (activity.objectId) {
    api.delete(`/object/${activity.objectId}`).catch(() => {})
  }
  return deleted
}

/**
 * "Update" an activity. The backend has no PATCH route for lesson items,
 * so we delete the old rows and create fresh ones with the new values.
 * Returns the normalized replacement activity, or null when the delete
 * failed (caller keeps the original).
 */
export const updateActivity = async (activity, { title, description, deadline, questions }) => {
  const ok = await deleteActivity(activity)
  if (!ok) return null
  return createActivity({
    lessonId: activity.lessonId,
    kind: activity.kind,
    title,
    description,
    deadline: deadline || activity.deadline || null,
    courseName: activity.courseName,
    courseId: activity.courseId,
    questions: questions ?? activity.questions ?? null,
  })
}

/**
 * Notify every member of a course about a new assignment.
 * Uses POST /notifications/bulk with group_id — fires and forgets.
 */
export const notifyGroupAssignment = (groupId, title, kindLabel) => {
  return api.post('/notifications/bulk', {
    title: `New ${kindLabel}: ${title}`,
    description: `A new ${kindLabel} was posted in your course. Check your assignments!`,
    notification_type: 'assignment',
    icon_url: null,
    group_id: Number(groupId),
  }).catch((err) => console.error('Error sending assignment notification', err))
}
