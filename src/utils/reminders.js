import { parseServerDate, msUntil } from './datetime'

/**
 * Deadline reminders — client-side scheduler. Every 5 minutes it checks the
 * student's assignments and fires a toast-style reminder when a deadline is
 * within the next 24h (and again 1h before). Reminders are remembered in
 * localStorage so a reload doesn't spam the same message.
 */

const KEY = 'deadline_reminders_sent'
const CHECK_INTERVAL_MS = 5 * 60 * 1000

const readSent = () => {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { return new Set() }
}

const writeSent = (set) => {
  try {
    // Keep only the last 200 ids so the list never grows unbounded
    localStorage.setItem(KEY, JSON.stringify([...set].slice(-200)))
  } catch { /* storage full/unavailable — reminders just re-fire */ }
}

/**
 * Check all assignments and invoke onReminder for any due-soon item that
 * hasn't been reminded yet. Returns the number of reminders fired.
 */
export const checkDeadlines = (assignments, isSubmitted, onReminder) => {
  if (!Array.isArray(assignments)) return 0
  const sent = readSent()
  let fired = 0

  assignments.forEach((item) => {
    if (!item.deadline || isSubmitted(item)) return
    const ms = msUntil(item.deadline)
    if (Number.isNaN(ms)) return
    // Fire windows: 24h … 23h55m and 1h … 55m before the deadline
    const in24h = ms > 0 && ms <= 24 * 60 * 60 * 1000
    const in1h = ms > 0 && ms <= 60 * 60 * 1000
    if (!in24h && !in1h) return

    const deadline = parseServerDate(item.deadline)
    const bucket = in1h ? '1h' : '24h'
    const key = `${item.id}:${bucket}:${deadline?.toISOString?.() || item.deadline}`
    if (sent.has(key)) return

    sent.add(key)
    fired++
    const label = in1h ? '1 hour' : '24 hours'
    onReminder(item, label)
  })

  if (fired) writeSent(sent)
  return fired
}

/** Start the recurring check; returns a stop function. */
export const startDeadlineWatcher = (getAssignments, isSubmitted, onReminder) => {
  const run = () => {
    try { checkDeadlines(getAssignments(), isSubmitted, onReminder) } catch { /* never crash the app */ }
  }
  run()
  const timer = setInterval(run, CHECK_INTERVAL_MS)
  return () => clearInterval(timer)
}
