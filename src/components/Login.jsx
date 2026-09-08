import { FaEnvelope, FaLock } from "react-icons/fa"
import { Link, useNavigate } from "react-router-dom"
import MatrixBg from "../SmallComponents/MatrixBg"
import { useEffect, useState, useRef, useCallback } from "react"
import { useAuth } from "../Providers/AuthProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { CgSpinner } from "react-icons/cg"

const Login = () => {
  const navigate = useNavigate()
  const { login, isAuth, user, authLoading } = useAuth()
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(null) // { attempt, total, phase }
  const [countdown, setCountdown] = useState(0)
  const [showProgress, setShowProgress] = useState(false)

  const countdownRef = useRef(null)
  const progressDelayRef = useRef(null)

  useEffect(() => {
    if (!authLoading && isAuth && user) {
      navigate(user.teacher ? '/teacher-dashboard' : '/student-dashboard', { replace: true });
    }
  }, [authLoading, isAuth, user, navigate]);

  // Countdown timer when waiting between retries
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(countdownRef.current)
  }, [countdown])

  const handleProgress = useCallback((info) => {
    setProgress(info)
    if (info.phase === 'retrying') {
      setCountdown(8)
    } else {
      setCountdown(0)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true)
    setProgress(null)
    setCountdown(0)
    setShowProgress(false)

    // Show progress indicator after 4 seconds delay
    // If server responds fast, progress won't show at all
    progressDelayRef.current = setTimeout(() => {
      setShowProgress(true)
    }, 4000)

    await login(email, password, 3, handleProgress)

    // Server responded — clear delay and hide progress
    clearTimeout(progressDelayRef.current)
    setProgress(null)
    setSubmitting(false)
    setCountdown(0)
    setShowProgress(false)
    clearInterval(countdownRef.current)
  }

  const totalAttempts = progress?.total || 5
  const currentAttempt = progress?.attempt || 0
  const progressPercent = Math.round((currentAttempt / totalAttempts) * 100)

  return (
    <div className="w-full relative min-h-screen animated-bg p-3 flex flex-col items-center justify-center">
      <MatrixBg />

      <div className="relative z-10 flex flex-col text-white gap-2 text-center pb-3">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('brand')}</h1>
        <p className="text-base sm:text-lg">{t('slogan')}</p>
      </div>

      <form onSubmit={handleLogin} className="relative z-10 mx-auto bg-indigo-950 shadow-2xl shadow-indigo-800 w-full max-w-[380px] rounded-2xl p-6 pb-3">
        <h1 className="text-white text-2xl sm:text-3xl font-bold pb-3">{t('login_title')}</h1>
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
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('password_label')}</label>
            <div className="relative flex items-center">
              <FaLock className="absolute left-4 text-slate-500 text-sm" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-slate-900 focus:outline-none focus:border-purple-600 transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-900 hover:bg-indigo-800 transition-colors p-3 rounded-xl text-xl text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <CgSpinner className="animate-spin" />
                  {t('logging_in')}
                </>
              ) : t('login_button')}
            </button>

            {/* Progress indicator during cold start — shows after 4s delay */}
            {submitting && progress && showProgress && (
              <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 space-y-2.5">
                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="text-center space-y-1">
                  <p className="text-amber-400 text-xs font-semibold">
                    {progress.phase === 'success'
                      ? '✅ Server is ready!'
                      : `🌐 Waking up the server... (attempt ${currentAttempt}/${totalAttempts})`
                    }
                  </p>

                  {progress.phase === 'retrying' && countdown > 0 && (
                    <p className="text-amber-400/50 text-[10px]">
                      ⏳ Retrying in {countdown}s — please don't close this page
                    </p>
                  )}

                  {progress.phase === 'connecting' && (
                    <p className="text-amber-400/50 text-[10px]">
                      📡 Connecting... this may take up to a minute
                    </p>
                  )}
                </div>
              </div>
            )}

            <h1 className="text-white text-center mt-2">
              {t('no_account')}{" "}
              <Link className="text-indigo-400 underline" to='/register'>{t('register_link')}</Link>
            </h1>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Login
