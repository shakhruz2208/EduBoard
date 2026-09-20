/**
 * Student ID code — the 5-digit "mixed" identifier shown to users.
 *
 * Backend sends `student_code` for accounts created after that feature; older
 * accounts have none, so we derive a stable pseudo-random 5-digit code from the
 * numeric id. Deterministic derivation (not random) guarantees the SAME code
 * appears everywhere: the student's own profile, the teacher's student list,
 * and copied values all match without any server round-trip.
 */

export const studentCode = (u) => {
  if (!u) return ''
  if (u.student_code) return String(u.student_code)
  const id = Number(u.id ?? u.studentId ?? u.student_id)
  if (!Number.isFinite(id)) return ''
  // 7919 is prime; (id * 7919) % 90000 spreads ids evenly across 10000-99999
  return String(10000 + ((id * 7919) % 90000))
}
