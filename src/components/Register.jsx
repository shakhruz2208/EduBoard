import { FaEnvelope, FaLock, FaUser, FaKey } from "react-icons/fa"
import { Link, useNavigate } from "react-router-dom"
import RoleToggle from "../SmallComponents/RoleToggle"
import MatrixBg from "../SmallComponents/MatrixBg"
import { useEffect, useState } from "react"
import { useAuth } from "../Providers/AuthProvider"
import { useLanguage } from "../Providers/LanguageProvider"

const Register = () => {
  const navigate = useNavigate();
  const { registerStudent, registerTeacher, isAuth, user, authLoading } = useAuth()
  const { t } = useLanguage()

  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    secretCode: ""
  });

  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (selectedRole) => {
    setRegisterData((prev) => ({ ...prev, role: selectedRole }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true)

    const success = registerData.role === 'teacher'
      ? await registerTeacher(registerData.fullName, registerData.email, registerData.password, registerData.secretCode)
      : await registerStudent(registerData.fullName, registerData.email, registerData.password)

    setSubmitting(false)
    if (success) {
      navigate(registerData.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard', { replace: true })
    }
  };

  useEffect(() => {
    if (!authLoading && isAuth && user) {
      navigate(user.teacher ? '/teacher-dashboard' : '/student-dashboard', { replace: true });
    }
  }, [authLoading, isAuth, user, navigate]);

  return (
    <div className="w-full relative min-h-screen animated-bg p-4 flex flex-col items-center justify-center">
      <MatrixBg />

      <form onSubmit={handleRegister} className="w-full max-w-[420px] relative z-10">
        <div className="flex flex-col text-white gap-2 text-center pb-5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide">{t('brand')}</h1>
          <p className="text-sm sm:text-base text-slate-400">{t('slogan')}</p>
        </div>

        <div className="bg-indigo-950/90 backdrop-blur-sm shadow-2xl shadow-indigo-900/50 w-full rounded-2xl p-6 sm:p-8 pb-6 border border-indigo-900/50">
          <h1 className="text-white text-2xl sm:text-3xl font-bold pb-4">{t('register_title')}</h1>

          <div className="flex flex-col gap-5">
            <div>
              <RoleToggle activeRole={registerData.role} onChange={handleRoleChange} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('fullname_label')}</label>
              <div className="relative flex items-center">
                <FaUser className="absolute left-4 text-slate-500 text-sm" />
                <input
                  type="text"
                  name="fullName"
                  value={registerData.fullName}
                  onChange={handleChange}
                  placeholder="Anvar Alimov"
                  minLength={3}
                  maxLength={50}
                  className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-slate-900 focus:outline-none focus:border-purple-600 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('email_label')}</label>
              <div className="relative flex items-center">
                <FaEnvelope className="absolute left-4 text-slate-500 text-sm" />
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={registerData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  minLength={8}
                  maxLength={128}
                  className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-slate-900 focus:outline-none focus:border-purple-600 transition-colors"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500">{t('password_hint')}</p>
            </div>

            {registerData.role === "teacher" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-red-400 uppercase tracking-wider">{t('secret_code_label')}</label>
                <div className="relative flex items-center">
                  <FaKey className="absolute left-4 text-red-400 text-sm" />
                  <input
                    type="password"
                    name="secretCode"
                    value={registerData.secretCode}
                    onChange={handleChange}
                    placeholder={t('secret_code_label')}
                    className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-red-900/50 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1 mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-900 hover:bg-indigo-800 transition-colors p-3.5 rounded-xl text-lg text-white cursor-pointer font-bold tracking-wide shadow-lg shadow-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('registering') : t('register_button')}
              </button>
              <h1 className="text-slate-400 text-center text-sm mt-3">
                {t('have_account')}{" "}
                <Link className="text-indigo-400 font-medium underline hover:text-indigo-300 transition-colors" to='/login'>{t('login_link')}</Link>
              </h1>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Register