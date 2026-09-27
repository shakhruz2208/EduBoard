import { useState, useRef } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { FaLock } from "react-icons/fa"
import { CgSpinner, CgCheckO } from "react-icons/cg"
import MatrixBg from "../SmallComponents/MatrixBg"
import { useLanguage } from "../Providers/LanguageProvider"
import api from "../api"

const ResetPassword = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [params] = useSearchParams()
  const token = params.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [mismatch, setMismatch] = useState(false)
  const savingRef = useRef(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (savingRef.current) return
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    savingRef.current = true
    setSaving(true)
    try {
      // 400 = expired/invalid token (backend sends a generic detail message).
      await api.post("/reset-password", { token, new_password: password })
      setDone(true)
    } catch (err) {
      if (err?.response?.status === 404) {
        setError("unsupported")
      } else if ([400, 401, 403].includes(err?.response?.status)) {
        // Expired/invalid token is the overwhelmingly common case here.
        setError("invalid")
      } else {
        setError("generic")
      }
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  // No token in the URL — the link was copied incompletely or malformed.
  if (!token && !done) {
    return (
      <div className="w-full relative min-h-screen animated-bg p-4 flex flex-col items-center justify-center">
        <MatrixBg />
        <div className="bg-indigo-950/90 backdrop-blur-sm shadow-2xl shadow-indigo-900/50 w-full max-w-[420px] relative z-10 rounded-2xl p-8 text-center">
          <span className="text-4xl">⚠️</span>
          <h1 className="text-white text-2xl font-bold mt-3">{t('forgot_password_title')}</h1>
          <p className="text-slate-300 text-sm mt-2">{t('reset_password_missing_token')}</p>
          <Link to="/login" className="inline-block mt-4 text-indigo-400 font-medium underline hover:text-indigo-300 transition-colors">
            {t('back_to_login')}
          </Link>
        </div>
    </div>
    )
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
          {done ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CgCheckO className="text-5xl text-emerald-400" />
              <h1 className="text-white text-2xl font-bold">{t('reset_password_title')}</h1>
              <p className="text-slate-300 text-sm">{t('reset_password_success')}</p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-2 w-full bg-indigo-900 hover:bg-indigo-800 transition-colors p-3 rounded-xl text-lg text-white cursor-pointer font-bold"
              >
                {t('login_button')}
              </button>
            </div>
          ) : error === "invalid" ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <span className="text-4xl">⏳</span>
              <h1 className="text-white text-2xl font-bold">{t('forgot_password_title')}</h1>
              <p className="text-slate-300 text-sm">{t('reset_password_token_invalid')}</p>
              <Link to="/forgot-password" className="mt-1 text-indigo-400 font-medium underline hover:text-indigo-300 transition-colors">
                {t('forgot_password_link')}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-white text-2xl sm:text-3xl font-bold pb-1">{t('reset_password_title')}</h1>
              <p className="text-slate-400 text-sm pb-5">{t('reset_password_subtitle')}</p>

              {error === "unsupported" && (
                <div className="mb-4 rounded-xl bg-red-950/40 border border-red-900/50 px-4 py-3 text-red-300 text-sm">
                  {t('forgot_password_unsupported')}
                </div>
              )}
              {error === "generic" && (
                <div className="mb-4 rounded-xl bg-red-950/40 border border-red-900/50 px-4 py-3 text-red-300 text-sm">
                  {t('reset_password_error_generic')}
                </div>
              )}

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('new_password')}</label>
                  <div className="relative flex items-center">
                    <FaLock className="absolute left-4 text-slate-500 text-sm" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setMismatch(false) }}
                      placeholder="••••••••"
                      minLength={8}
                      maxLength={128}
                      className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-slate-900 focus:outline-none focus:border-purple-600 transition-colors"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('confirm_new_password')}</label>
                  <div className="relative flex items-center">
                    <FaLock className="absolute left-4 text-slate-500 text-sm" />
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setMismatch(false) }}
                      placeholder="••••••••"
                      minLength={8}
                      maxLength={128}
                      className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-slate-900 focus:outline-none focus:border-purple-600 text-slate-300 transition-colors"
                      required
                    />
                  </div>
                  {mismatch && (
                    <p className="text-[11px] text-red-400">{t('passwords_no_match')}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-indigo-900 hover:bg-indigo-800 transition-colors p-3.5 rounded-xl text-lg text-white cursor-pointer font-bold tracking-wide shadow-lg shadow-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <CgSpinner className="animate-spin" />
                        {t('reset_password_saving')}
                      </>
                    ) : (
                      t('reset_password_btn')
                    )}
                  </button>

                  <h1 className="text-slate-400 text-center text-sm mt-3">
                    {t('no_account')}{" "}
                    <Link className="text-indigo-400 font-medium underline hover:text-indigo-300 transition-colors" to='/register'>{t('register_link')}</Link>
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

export default ResetPassword
