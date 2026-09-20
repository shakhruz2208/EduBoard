/**
 * Quiz engine — questions live inside the activity's content.questions JSON,
 * so the backend needs no changes. Student answers are stored as a JSON
 * payload via the regular object submit route and auto-graded client-side.
 *
 * content.questions = [{ q, options: [..], answer: <index> }, ...]
 * submitted url     = "quiz://<objectId>?answers=<json>" (also readable as plain JSON)
 */

/**
 * Pull the raw questions array from any activity shape:
 *  - content.questions (lesson activities)
 *  - top-level questions (normalizeActivity output)
 *  - @@QUIZ@@ marker in the description (raw /object/{id} responses)
 */
const rawQuestions = (activity) => {
  if (!activity) return null
  if (Array.isArray(activity.content?.questions)) return activity.content.questions
  if (Array.isArray(activity.questions)) return activity.questions
  if (typeof activity.description === 'string' && activity.description.includes('@@QUIZ@@')) {
    try {
      const parsed = JSON.parse(activity.description.split('@@QUIZ@@')[1] || '[]')
      if (Array.isArray(parsed)) return parsed
    } catch { /* malformed marker */ }
  }
  return null
}

export const parseQuestions = (activity) => {
  const raw = rawQuestions(activity)
  if (!Array.isArray(raw)) return []
  return raw
    .filter((q) => q && typeof q.q === 'string' && Array.isArray(q.options) && q.options.length >= 2)
    .map((q, i) => ({
      id: i,
      q: q.q,
      options: q.options.map(String),
      answer: Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length ? q.answer : 0,
    }))
}

/** Grade answers ({questionId: optionIndex}) against parsed questions → percent 0-100. */
export const gradeQuiz = (questions, answers) => {
  if (!questions.length) return null
  const correct = questions.filter((q) => Number(answers?.[q.id]) === q.answer).length
  return Math.round((correct / questions.length) * 100)
}

/** Extract student answers from a submission row (url may hold the payload). */
export const extractQuizAnswers = (submission) => {
  const text = submission?.text || submission?.url || ''
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object' && parsed.__quiz) return parsed.answers || {}
  } catch { /* not JSON — try the quiz URL wrapper */ }
  // Backend only accepts http(s) URLs, so quiz payloads ride inside a
  // https://quiz.local/<id>?answers=<json> wrapper (never actually fetched).
  if (text.startsWith('https://quiz.local/')) {
    try {
      const q = new URL(text).searchParams.get('answers')
      const parsed = JSON.parse(q || '')
      if (parsed && typeof parsed === 'object' && parsed.__quiz) return parsed.answers || {}
    } catch { /* malformed */ }
  }
  // Legacy quiz:// scheme (kept for rows submitted before the wrapper)
  const match = text.match(/^quiz:\/\/\d+\?answers=(.+)$/)
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[1])) || {}
    } catch { /* malformed */ }
  }
  return null
}

/** Encode student answers into the payload submitted to /object/{id}/submit. */
export const buildQuizSubmission = (objectId, answers) =>
  `https://quiz.local/${objectId}?answers=${encodeURIComponent(JSON.stringify({ __quiz: true, answers }))}`

/* ── Attempt tracking ─────────────────────────────────────────────────────
 * A quiz can be taken once plus one retake (MAX_QUIZ_ATTEMPTS = 2). Attempts
 * are counted per object per student in localStorage — they survive reloads
 * and stay bounded even though the backend happily accepts re-submissions.
 */
export const MAX_QUIZ_ATTEMPTS = 2
const ATTEMPTS_KEY = 'quiz_attempts_v1'

const readAttempts = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

const attemptKey = (objectId, userEmail) => `${objectId}:${userEmail || 'anon'}`

/** How many times this student has submitted this quiz (0, 1 or 2). */
export const getQuizAttempts = (objectId, userEmail) =>
  Number(readAttempts()[attemptKey(objectId, userEmail)] || 0)

/** Persist one more attempt after a successful submission. */
export const recordQuizAttempt = (objectId, userEmail) => {
  try {
    const all = readAttempts()
    const key = attemptKey(objectId, userEmail)
    all[key] = (Number(all[key]) || 0) + 1
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all))
  } catch { /* storage unavailable — attempts simply won't persist */ }
}

/** Format a quiz result for the teacher's submissions list. */
export const describeQuizSubmission = (questions, answers) => {
  if (!answers) return null
  const percent = gradeQuiz(questions, answers)
  if (percent == null) return null
  const correct = questions.filter((q) => Number(answers?.[q.id]) === q.answer).length
  return { percent, correct, total: questions.length }
}
