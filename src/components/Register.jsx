import { FaEnvelope, FaLock, FaUser, FaKey } from "react-icons/fa"
import { HiOutlineAcademicCap } from "react-icons/hi2"
import { Link, useNavigate } from "react-router-dom"
import RoleToggle from "../SmallComponents/RoleToggle"
import MatrixBg from "../SmallComponents/MatrixBg"
import { useEffect, useState } from "react"
import { useAuth } from "../Providers/AuthProvider"
import { useCourses } from "../Providers/CourseProvider"

const Register = () => {
  const navigate = useNavigate();
  const { registerStudent, registerTeacher, isAuth, user, authLoading } = useAuth()
  const { courses, enrollStudent } = useCourses()

  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    secretCode: "",
    courseId: ""
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

    if (registerData.role === 'teacher') {
      const success = await registerTeacher(registerData.fullName, registerData.email, registerData.password, registerData.secretCode)
      setSubmitting(false)
      if (success) navigate('/teacher-dashboard', { replace: true })
      return
    }

    const success = await registerStudent(registerData.fullName, registerData.email, registerData.password)

    if (success && registerData.courseId) {
      const selectedCourse = courses.find((c) => String(c.id) === String(registerData.courseId))
      await enrollStudent(registerData.email, registerData.fullName, registerData.courseId, selectedCourse?.name)
    }

    setSubmitting(false)
    if (success) navigate('/student-dashboard', { replace: true })
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide">DevsClub.uz</h1>
          <p className="text-sm sm:text-base text-slate-400">A New Step Towards Knowledge</p>
        </div>

        <div className="bg-indigo-950/90 backdrop-blur-sm shadow-2xl shadow-indigo-900/50 w-full rounded-2xl p-6 sm:p-8 pb-6 border border-indigo-900/50">
          <h1 className="text-white text-2xl sm:text-3xl font-bold pb-4">Register</h1>

          <div className="flex flex-col gap-5">
            <div>
              <RoleToggle activeRole={registerData.role} onChange={handleRoleChange} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">FullName</label>
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
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
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
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
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
              <p className="text-[11px] text-slate-500">At least 8 characters</p>
            </div>

            {registerData.role === "teacher" ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-red-400 uppercase tracking-wider">Secret Code</label>
                <div className="relative flex items-center">
                  <FaKey className="absolute left-4 text-red-400 text-sm" />
                  <input
                    type="password"
                    name="secretCode"
                    value={registerData.secretCode}
                    onChange={handleChange}
                    placeholder="Secret Code"
                    className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-red-900/50 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course / Group</label>
                <div className="relative flex items-center">
                  <HiOutlineAcademicCap className="absolute left-4 text-slate-500 text-base pointer-events-none" />
                  <select
                    name="courseId"
                    value={registerData.courseId}
                    onChange={handleChange}
                    className="w-full appearance-none bg-[#030712] text-slate-300 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-slate-900 focus:outline-none focus:border-purple-600 transition-colors cursor-pointer"
                  >
                    <option value="">No course selected</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} — {course.teacherName}
                      </option>
                    ))}
                  </select>
                </div>
                {courses.length === 0 && (
                  <p className="text-[11px] text-slate-500">No courses yet — your teacher hasn't created one, you can register without picking one.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1 mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-900 hover:bg-indigo-800 transition-colors p-3.5 rounded-xl text-lg text-white cursor-pointer font-bold tracking-wide shadow-lg shadow-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Registering..." : "Register"}
              </button>
              <h1 className="text-slate-400 text-center text-sm mt-3">
                Have an account?{" "}
                <Link className="text-indigo-400 font-medium underline hover:text-indigo-300 transition-colors" to='/login'>Login</Link>
              </h1>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Register