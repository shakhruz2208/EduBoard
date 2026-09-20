// Shared scoring rules — used by StudentRating, TeacherStudents and the
// teacher attendance modal so every surface shows identical numbers.

/**
 * Attendance points per status (the backend stores only the status):
 *   present → +10, late → +7, absent → 0
 */
export const ATTENDANCE_POINTS = { present: 10, late: 7, absent: 0 }

export const attendancePoints = (status) => ATTENDANCE_POINTS[status] ?? 0

/**
 * Total rating points for one student:
 * attendance points + one point per grade unit on graded homework
 * (grade 85 → +85). Kept in one place so all pages agree.
 */
export const totalScore = ({ gradedPoints = 0, attendance = 0 }) =>
  Number(gradedPoints) + Number(attendance)

/**
 * Normalize a raw homework row from GET /student/grades or GET /me/homework.
 * The backend uses object_id/student_id and snake_case dates; the UI works
 * with assignmentId/studentId and camelCase.
 */
export const normalizeGradeRow = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const id = raw.id ?? raw.homework_id
  if (id == null) return null
  return {
    id,
    assignmentId: raw.object_id ?? raw.assignment_id ?? raw.assignmentId ?? null,
    studentId: raw.student_id ?? raw.studentId ?? null,
    url: raw.url ?? null,
    grade: raw.grade ?? null,
    feedback: raw.feedback ?? null,
    submittedAt: raw.submitted_at ?? raw.submittedAt ?? null,
    gradedAt: raw.graded_at ?? raw.gradedAt ?? null,
  }
}

/** Normalize a list response from /student/grades or /me/homework. */
export const normalizeGradeRows = (data) => {
  const items = Array.isArray(data) ? data : data?.items || []
  return items.map(normalizeGradeRow).filter(Boolean)
}
