import { FaEnvelope, FaLock, FaUser, FaKey } from "react-icons/fa"
import { Link, useNavigate } from "react-router-dom"
import RoleToggle from "../SmallComponents/RoleToggle"
import MatrixBg from "../SmallComponents/MatrixBg"
import { useEffect, useState } from "react"

const Login = ({ setIsAuth, isAuth }) => {
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [secretCode, setSecretCode] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const TEACHER_SECRET_KEY = "MAKTEB_TECH_2026"

  useEffect(() => {
    const savedRemember = localStorage.getItem("rememberMe") === "true"
    if (savedRemember) {
      setRememberMe(true)
      setEmail(localStorage.getItem("savedEmail") || "")
    }

    if (isAuth) {
      const savedRole = localStorage.getItem('role')
      if (savedRole === 'student') {
        navigate('/student-dashboard', { replace: true });
      } else if (savedRole === 'teacher') {
        navigate('/teacher-dashboard', { replace: true });
      }
    }
  }, [isAuth, navigate]);

  const handleLogin = () => {
    if (role === 'teacher' && secretCode !== TEACHER_SECRET_KEY) {
      alert("Error: Secret code is incorrect");
      return;
    }

    localStorage.setItem('auth', 'true')
    localStorage.setItem('role', role)

    if (rememberMe) {
      localStorage.setItem("rememberMe", "true")
      localStorage.setItem("savedEmail", email)
    } else {
      localStorage.removeItem("rememberMe")
      localStorage.removeItem("savedFullName")
      localStorage.removeItem("savedEmail")
    }

    setIsAuth(true)
    if (role === 'student') {
      navigate('/student-dashboard', { replace: true })
    } else {
      navigate('/teacher-dashboard', { replace: true })
    }
  }

  return (
    <div className="w-full relative min-h-screen animated-bg p-3 flex flex-col items-center justify-center">
      <MatrixBg />
    
      <div className="relative z-10 flex flex-col text-white gap-2 text-center pb-3">
        <h1 className="text-2xl sm:text-3xl font-bold">DevsClub.uz</h1>
        <p className="text-base sm:text-lg">A New Step Towards Knowledge</p>
      </div>

      <div className="relative z-10 mx-auto bg-indigo-950 shadow-2xl shadow-indigo-800 w-full max-w-[380px] rounded-2xl p-6 pb-3">
        <h1 className="text-white text-2xl sm:text-3xl font-bold pb-3">Login</h1>
        <div className="flex flex-col gap-5">
          <div>
            <RoleToggle activeRole={role} onChange={setRole} />
          </div>

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
              />
            </div>
          </div>

          {role === "teacher" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-red-400 uppercase tracking-wider">Secret Code *</label>
              <div className="relative flex items-center">
                <FaKey className="absolute left-4 text-red-400 text-sm" />
                <input
                  type="password"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="Secret Code"
                  className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-red-900/50 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 py-0.5">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-[#030712] border-slate-900 text-purple-600 focus:ring-purple-600 cursor-pointer"
            />
            <label htmlFor="remember" className="text-xs font-medium text-slate-400 cursor-pointer select-none">
              Remember me
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-900 p-3 rounded-xl text-xl text-white cursor-pointer"
            >
              Login
            </button>
            <h1 className="text-white text-center">
              Don't Have an account?
              <Link className="text-indigo-400 underline" to='/register'>Register</Link>
            </h1>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login