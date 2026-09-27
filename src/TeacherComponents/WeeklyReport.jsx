import { useMemo } from "react"
import { IoDocumentTextOutline } from "react-icons/io5"
import { useLanguage } from "../Providers/LanguageProvider"
import { objectWeekLabel } from "../utils/archive"

/**
 * Weekly report — rendered in place of the "Submitted assignments" panel
 * when archive mode is on. Groups everything into finished weeks and shows
 * a compact per-week summary: how many assignments, how many submissions
 * came in, how many are still ungraded and the quiz average. Each week card
 * links to the full archive page.
 */
const WeeklyReport = ({ assignments, submissions, onOpenArchive }) => {
  const { t } = useLanguage()

  const weeks = useMemo(() => {
    const weekMap = new Map()
    const weekOf = (item) => objectWeekLabel(item)

    // Submissions bucket per assignment id for fast counting.
    const subsByAssignment = new Map()
    ;(submissions || []).forEach((s) => {
      const key = String(s.assignmentId)
      if (!subsByAssignment.has(key)) subsByAssignment.set(key, [])
      subsByAssignment.get(key).push(s)
    })

    ;(assignments || []).forEach((item) => {
      const label = weekOf(item)
      if (!weekMap.has(label)) {
        weekMap.set(label, { label, total: 0, subs: 0, ungraded: 0, quizScores: [] })
      }
      const bucket = weekMap.get(label)
      bucket.total += 1
      const subs = subsByAssignment.get(String(item.objectId ?? item.id)) || []
      bucket.subs += subs.length
      subs.forEach((s) => { if (s.grade == null) bucket.ungraded += 1 })
      // Quiz submissions carry a parsed score in text (https://quiz.local/...)
      subs.forEach((s) => {
        if (typeof s.text === 'string' && s.text.includes('quiz.local')) {
          try {
            const payload = JSON.parse(decodeURIComponent(s.text.split('/payload=')[1] || 'null'))
            const qs = payload?.questions || []
            const answered = Object.keys(payload?.answers || {}).length
            const correct = qs.filter((q, i) => payload?.answers?.[String(i)] === Number(q.answer)).length
            if (qs.length > 0) bucket.quizScores.push(Math.round((correct / qs.length) * 100))
            else if (answered === 0) bucket.quizScores.push(0)
          } catch { /* malformed payload — skip */ }
        }
      })
    })
    return [...weekMap.values()].sort((a, b) => b.label.localeCompare(a.label))
  }, [assignments, submissions])

  if (weeks.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
            <IoDocumentTextOutline className="text-2xl text-indigo-500/30" />
          </div>
          <p className="text-slate-500 text-sm font-medium">{t("no_assignments_yet")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-wider text-indigo-400/60 font-bold px-1 pb-1">{t("weekly_report_title")}</p>
      {weeks.map((w) => (
        <button
          key={w.label}
          onClick={onOpenArchive}
          className="group/week bg-[#0a0f35] border border-indigo-500/10 rounded-xl p-3.5 hover:border-indigo-400/25 hover:bg-[#0e1445] transition-all duration-200 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-white font-semibold text-sm">📅 {w.label}</p>
            {w.ungraded > 0 && (
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                {t("weekly_report_ungraded", `${w.ungraded}`)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-400">
            <span>📦 {t("weekly_report_assignments", `${w.total}`)}</span>
            <span className="text-indigo-300/70">📥 {t("weekly_report_subs", `${w.subs}`)}</span>
            {w.quizScores.length > 0 && (
              <span className="text-emerald-300/70">
                🧠 {t("weekly_report_quiz_avg", `${Math.round(w.quizScores.reduce((a, b) => a + b, 0) / w.quizScores.length)}%`)}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

export default WeeklyReport
