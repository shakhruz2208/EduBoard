import { useEffect, useMemo, useRef, useState } from "react"
import { CgSpinner } from "react-icons/cg"
import { IoTimerOutline, IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5"
import { parseQuestions, gradeQuiz } from "../utils/quiz"
import { useLanguage } from "../Providers/LanguageProvider"

const PER_QUESTION_SECONDS = 30

const QuizModal = ({ assignment, initialAnswers = {}, onClose, onSubmit, submitting }) => {
  const { t } = useLanguage()
  const questions = useMemo(() => parseQuestions(assignment), [assignment])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers)
  const [secondsLeft, setSecondsLeft] = useState(PER_QUESTION_SECONDS)
  const [finished, setFinished] = useState(false)
  const submittedRef = useRef(false)

  const total = questions.length

  const finish = () => setFinished(true)

  // Central submit — fires exactly once, either on "Finish" or on timeout.
  useEffect(() => {
    if (!finished || submittedRef.current) return
    submittedRef.current = true
    onSubmit(answers)
  }, [finished, answers, onSubmit])

  // Per-question countdown — auto-advances when time runs out.
  // All state changes happen inside the timeout callback (not in the effect body).
  useEffect(() => {
    if (finished) return undefined
    const timer = setTimeout(() => {
      if (secondsLeft <= 1) {
        if (step >= total - 1) setFinished(true)
        else {
          setStep(step + 1)
          setSecondsLeft(PER_QUESTION_SECONDS)
        }
      } else {
        setSecondsLeft(secondsLeft - 1)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, finished, step, total])

  if (!total) return null

  const q = questions[step]
  const picked = answers[q.id]
  const timeCritical = secondsLeft <= 10
  const allAnswered = questions.every((item) => answers[item.id] != null)

  const pick = (oi) => setAnswers((p) => ({ ...p, [q.id]: oi }))

  const next = () => {
    if (step >= total - 1) finish()
    else {
      setStep((s) => s + 1)
      setSecondsLeft(PER_QUESTION_SECONDS)
    }
  }

  const prev = () => {
    if (step === 0) return
    setStep((s) => s - 1)
    setSecondsLeft(PER_QUESTION_SECONDS)
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />

      {/* Centered modal */}
      <div className="relative w-full max-w-xl bg-[#0a1030] border border-indigo-800/50 rounded-3xl shadow-2xl shadow-indigo-950 overflow-hidden animate-scale-in">
        {/* Header: progress + timer */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <span className="text-slate-400 text-xs font-semibold">
            {t('quiz_question_of', `${step + 1}`, `${total}`)}
          </span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold tabular-nums ${
            timeCritical ? "bg-red-500/15 text-red-400 animate-pulse" : "bg-indigo-500/15 text-indigo-300"
          }`}>
            <IoTimerOutline className={timeCritical ? "animate-pulse" : ""} />
            {fmt(secondsLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6">
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((step + (finished ? 1 : 0)) / total) * 100}%` }}
            />
          </div>
        </div>

        {finished ? (
          /* Finishing state — sending to teacher */
          <div className="flex flex-col items-center gap-4 px-8 py-14 text-center">
            <CgSpinner className="text-5xl text-[#8fd125] animate-spin" />
            <p className="text-white font-bold text-lg">{t('quiz_sending')}</p>
            <p className="text-slate-500 text-sm">{t('quiz_sending_sub')}</p>
          </div>
        ) : (
          <>
            {/* Question */}
            <div className="px-6 py-5">
              <p className="text-white font-semibold text-base sm:text-lg leading-relaxed mb-5">
                {step + 1}. {q.q}
              </p>
              <div className="flex flex-col gap-2.5">
                {q.options.map((opt, oi) => {
                  const selected = picked === oi
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => pick(oi)}
                      className={`flex items-center gap-3 text-left text-sm px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? "border-[#8fd125] bg-[#8fd125]/10 text-white"
                          : "border-slate-800 bg-[#030712] text-slate-300 hover:border-indigo-600 hover:bg-indigo-500/5"
                      }`}
                    >
                      <span className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold ${
                        selected ? "border-[#8fd125] bg-[#8fd125] text-black" : "border-slate-700 text-slate-500"
                      }`}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={prev}
                disabled={step === 0}
                className="px-4 py-2 rounded-xl text-slate-400 text-sm font-semibold hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer"
              >
                {t('quiz_prev')}
              </button>
              <div className="flex items-center gap-2">
                {!allAnswered && (
                  <span className="text-slate-600 text-xs">{t('quiz_answer_all_hint')}</span>
                )}
                <button
                  type="button"
                  onClick={next}
                  disabled={picked == null}
                  className="px-6 py-2 rounded-xl bg-[#8fd125] text-black font-semibold text-sm hover:shadow-lg hover:shadow-[#78af1f]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {step >= total - 1 ? t('quiz_finish') : t('quiz_next')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Compact result card shown after the modal closes. */
export const QuizResultBadge = ({ questions, answers }) => {
  const { t } = useLanguage()
  const percent = gradeQuiz(questions, answers)
  if (percent == null) return null
  const correct = questions.filter((qq) => Number(answers?.[qq.id]) === qq.answer).length
  const good = percent >= 60
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border ${
      good ? "bg-emerald-500/10 border-emerald-700/40 text-emerald-400" : "bg-amber-500/10 border-amber-700/40 text-amber-400"
    }`}>
      {good ? <IoCheckmarkCircle /> : <IoCloseCircle />}
      <span className="font-bold">{t('quiz_your_score')}: {percent}%</span>
      <span className="text-xs opacity-75">({correct}/{questions.length})</span>
    </div>
  )
}

export default QuizModal
