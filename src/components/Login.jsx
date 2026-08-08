import { FaEnvelope, FaLock } from "react-icons/fa"
import { Link, useNavigate } from "react-router-dom"
import MatrixBg from "../SmallComponents/MatrixBg"
import { useEffect, useState } from "react"
import { useAuth } from "../Providers/AuthProvider"

const Login = () => {
  const navigate = useNavigate()
  const { login, isAuth, user, authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [slowHint, setSlowHint] = useState(false)

  useEffect(() => {
    if (!authLoading && isAuth && user) {
      navigate(user.teacher ? '/teacher-dashboard' : '/student-dashboard', { replace: true });
    }
  }, [authLoading, isAuth, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true)
    setSlowHint(false)


    const slowTimer = setTimeout(() => setSlowHint(true), 4000)

    await login(email, password)

    clearTimeout(slowTimer)
    setSlowHint(false)
    setSubmitting(false)

  }

  return (
    <div className="w-full relative min-h-screen animated-bg p-3 flex flex-col items-center justify-center">
      <MatrixBg />

      <div className="relative z-10 flex flex-col text-white gap-2 text-center pb-3">
        <h1 className="text-2xl sm:text-3xl font-bold">DevsClub.uz</h1>
        <p className="text-base sm:text-lg">A New Step Towards Knowledge</p>
      </div>

      <form onSubmit={handleLogin} className="relative z-10 mx-auto bg-indigo-950 shadow-2xl shadow-indigo-800 w-full max-w-[380px] rounded-2xl p-6 pb-3">
        <h1 className="text-white text-2xl sm:text-3xl font-bold pb-3">Login</h1>
        <div className="flex flex-col gap-5">

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
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
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
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
              className="w-full bg-indigo-900 hover:bg-indigo-800 transition-colors p-3 rounded-xl text-xl text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>
            {slowHint && (
              <p className="text-amber-400 text-xs text-center mt-1">
                Waking up the server, this can take up to a minute on the first request...
              </p>
            )}
            <h1 className="text-white text-center mt-2">
              Don't Have an account?{" "}
              <Link className="text-indigo-400 underline" to='/register'>Register</Link>
            </h1>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Login