// Helpers for reconciling backend response shapes with what the UI expects.
// The backend mixes field names across endpoints (activity_type vs kind,
// student_id vs user_id), so every consumer normalizes through these helpers.

const KNOWN_KINDS = ['homework', 'exam', 'quiz', 'materials', 'activity']

// Accepts any casing variant of the known activity kinds.
const canonKind = (raw) => {
  const v = String(raw || '').toLowerCase()
  return KNOWN_KINDS.includes(v) ? v : null
}

/**
 * Normalize a lesson item returned by POST/GET /lessons/{id}/activities.
 *
 * Two storage shapes exist server-side:
 *  - items created via POST /lessons/{id}/homework|exam|quiz|materials get
 *    kind = "homework" | "exam" | ... on the row itself;
 *  - items created via POST /lessons/{id}/activities always get
 *    kind = "activity", and the real type (if any) is stored in content.kind.
 * GET /lessons/{id}/activities ONLY lists rows whose kind is "activity".
 *
 * For gradable kinds the teacher flow also mirrors the item into a real
 * object (POST /add-object) so students can submit against it — the mirror
 * id is stored in content.object_id and surfaced here as `objectId`.
 *
 * Returns null for objects that carry no usable id.
 */
export const normalizeActivity = (raw, context = {}) => {
  if (!raw || typeof raw !== 'object') return null
  const id = raw.id ?? raw._id ?? raw.homework_id ?? raw.activity_id ?? raw.object_id
  if (id == null) return null
  const content = raw.content && typeof raw.content === 'object' ? raw.content : {}
  // Row-level kind wins, but "activity" is a placeholder — prefer content.kind then.
  const rowKind = canonKind(raw.activity_type || raw.kind || raw.type)
  const kind = rowKind && rowKind !== 'activity'
    ? rowKind
    : canonKind(content.kind || content.activity_type) || 'activity'
  // Quiz questions ride inside content.questions; mirror objects carry them in
  // the description under a marker so the student detail page can show them.
  let questions = Array.isArray(content.questions) ? content.questions : null
  if (!questions && typeof raw.description === 'string' && raw.description.includes('@@QUIZ@@')) {
    try {
      questions = JSON.parse(raw.description.split('@@QUIZ@@')[1] || '[]')
    } catch { questions = null }
  }
  // Strip the quiz payload marker from the human-readable description.
  const cleanDescription = typeof raw.description === 'string'
    ? raw.description.split('@@QUIZ@@')[0].trim()
    : raw.description ?? null
  return {
    ...raw,
    id,
    title: raw.title ?? raw.name ?? '',
    name: raw.title ?? raw.name ?? '',
    description: cleanDescription,
    url: raw.url ?? null,
    content,
    deadline: content.deadline || raw.deadline || null,
    objectId: content.object_id ?? null,
    kind,
    questions: questions || undefined,
    isActivity: true,
    lessonId: context.lessonId ?? raw.lesson_id ?? null,
    courseId: context.courseId ?? raw.group_id ?? content.group_id ?? null,
    courseName: context.courseName ?? null,
  }
}

/** Normalize a list response from /lessons/{id}/activities. */
export const normalizeActivityList = (data, context = {}) => {
  const items = Array.isArray(data) ? data : data?.items || []
  return items.map((a) => normalizeActivity(a, context)).filter(Boolean)
}

/**
 * Normalize an attendance record from GET/POST /lessons/{id}/attendance.
 * Older payloads used user_id; the backend now expects student_id.
 * Note: the backend does NOT accept or return a `score` field — points are
 * derived from `status` on the client (see ATTENDANCE_POINTS).
 */
export const normalizeAttendance = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const studentId = raw.student_id ?? raw.user_id ?? raw.studentId ?? raw.userId
  if (studentId == null) return null
  return {
    id: raw.id ?? raw.attendance_id ?? null,
    studentId,
    status: raw.status || 'present',
    score: raw.score ?? null,
    markedAt: raw.marked_at ?? raw.markedAt ?? null,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
  }
}

/** Normalize a list response from /lessons/{id}/attendance. */
export const normalizeAttendanceList = (data) => {
  const items = Array.isArray(data) ? data : data?.items || []
  return items.map(normalizeAttendance).filter(Boolean)
}
