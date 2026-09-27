import { useState, useRef } from "react"
import { Link } from "react-router-dom"
import { FaEnvelope } from "react-icons/fa"
import { CgSpinner, CgCheckO, CgDanger, CgCloseO } from "react-icons/cg"
import MatrixBg from "../SmallComponents/MatrixBg"
import { useLanguage } from "../Providers/LanguageProvider"
import api from "../api"

const ForgotPassword = () => {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  // Ref guard against double-submit on rapid Enter presses.
  const sendingRef = useRef(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (sendingRef.current) return
    sendingRef.current = true
    setSending(true)
    try {
      // Always 200 on the backend, even for unknown emails (anti-enumeration).
      await api.post("/forgot-password", { email: email.trim() })
      setSent(true)
    } catch (error) {
      const status = error?.response?.status
      if (status === 404) {
        // 404 safety net in case the endpoint is ever removed/misrouted.
        setSent("unsupported")
      } else if (status === 429) {
        // Backend rate limit: max 3 requests per 10 min per email.
        setSent("rate_limited")
      } else {
        // Network failure / Render cold start / 5xx — don't fake success,
        // the email most likely never went out.
        setSent("error")
      }
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  return (
    <div className="w-full relative min-h-screen animated-bg p-4 flex flex-col items-center justify-center">
      <MatrixBg />

      <form onSubmit={handleSubmit} className="w-full max-w-[420px] relative z-10">
        <div className="flex flex-col text-white gap-2 text-center pb-5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide">{t('brand')}</h1>
          <p className="text-sm sm:text-base text-slate-400">{t('slogan')}</p>
        </div>

        <div className="bg-indigo-950/90 backdrop-blur-sm shadow-2xl shadow-indigo-900/50 w-full rounded-2xl p-6 sm:p-8 border border-indigo-900/50">
          {sent === true ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CgCheckO className="text-5xl text-emerald-400" />
              <h1 className="text-white text-2xl font-bold">{t('forgot_password_sent_title')}</h1>
              <p className="text-slate-300 text-sm">{t('forgot_password_sent_msg', email.trim())}</p>
              <Link
                to="/login"
                className="mt-2 text-indigo-400 font-medium underline hover:text-indigo-300 transition-colors"
              >
                {t('back_to_login')}
              </Link>
            </div>
            ) : sent === "rate_limited" ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CgDanger className="text-5xl text-amber-400" />
              <h1 className="text-white text-2xl font-bold">{t('forgot_password_title')}</h1>
              <p className="text-slate-300 text-sm">{t('forgot_password_rate_limited')}</p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-2 text-indigo-400 font-medium underline hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {t('forgot_password_try_again')}
              </button>
              <Link
                to="/login"
                className="text-slate-400 text-sm underline hover:text-slate-300 transition-colors"
              >
                {t('back_to_login')}
              </Link>
            </div>
            ) : sent === "error" ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CgCloseO className="text-5xl text-rose-400" />
              <h1 className="text-white text-2xl font-bold">{t('forgot_password_title')}</h1>
              <p className="text-slate-300 text-sm">{t('forgot_password_error')}</p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-2 text-indigo-400 font-medium underline hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {t('forgot_password_try_again')}
              </button>
              <Link
                to="/login"
                className="text-slate-400 text-sm underline hover:text-slate-300 transition-colors"
              >
                {t('back_to_login')}
              </Link>
            </div>
            ) : sent === "unsupported" ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <span className="text-4xl">✉️</span>
              <h1 className="text-white text-2xl font-bold">{t('forgot_password_title')}</h1>
              <p className="text-slate-300 text-sm">{t('forgot_password_unsupported')}</p>
              <Link
                to="/login"
                className="mt-2 text-indigo-400 font-medium underline hover:text-indigo-300 transition-colors"
              >
                {t('back_to_login')}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-white text-2xl sm:text-3xl font-bold pb-1">{t('forgot_password_title')}</h1>
              <p className="text-slate-400 text-sm pb-5">{t('forgot_password_subtitle')}</p>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('email_label')}</label>
                  <div className="relative flex items-center">
                    <FaEnvelope className="absolute left-4 text-slate-500 text-sm" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-slate-900 focus:outline-none focus:border-purple-600 transition-colors"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-indigo-900 hover:bg-indigo-800 transition-colors p-3.5 rounded-xl text-lg text-white cursor-pointer font-bold tracking-wide shadow-lg shadow-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <CgSpinner className="animate-spin" />
                        {t('forgot_password_sending')}
                      </>
                    ) : (
                      t('forgot_password_send_btn')
                    )}
                  </button>

                  <h1 className="text-slate-400 text-center text-sm mt-3">
                    {t('have_account')}{" "}
                    <Link className="text-indigo-400 font-medium underline hover:text-indigo-300 transition-colors" to='/login'>{t('login_link')}</Link>
                  </h1>
                </div>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  )
}

export default ForgotPassword
