import { FaEnvelope, FaLock, FaUser, FaKey } from "react-icons/fa"
import { Link, useNavigate } from "react-router-dom"
import RoleToggle from "../SmallComponents/RoleToggle"
import MatrixBg from "../SmallComponents/MatrixBg"
import { useEffect, useState } from "react"

const Register = ({ setIsAuth, isAuth }) => {
  const navigate = useNavigate();

  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    secretCode: ""
  });

  const [rememberMe, setRememberMe] = useState(false);
  const TEACHER_SECRET_KEY = "MAKTAB_TECH_2026";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (selectedRole) => {
    setRegisterData((prev) => ({ ...prev, role: selectedRole }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const userData = {
    fullName: registerData.fullName,
    email: registerData.email,
    role: registerData.role
  };

  localStorage.setItem("userProfile", JSON.stringify(userData));
    if (registerData.role === 'teacher' && registerData.secretCode !== TEACHER_SECRET_KEY) {
      alert("Error: Secret code is incorrect");
      return;
    }

    localStorage.setItem("auth", "true");
    localStorage.setItem("role", registerData.role); 
    
    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("savedFullName", registerData.fullName);
      localStorage.setItem("savedEmail", registerData.email);
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("savedFullName");
      localStorage.removeItem("savedEmail");
    }

    setIsAuth(true); 

    if (registerData.role === "teacher") {
      navigate("/teacher-dashboard");
    } else {
      navigate("/student-dashboard");
    }
  };

  useEffect(() => {
    const savedRemember = localStorage.getItem("rememberMe") === "true";
    if (savedRemember) {
      setRememberMe(true);
      setRegisterData(prev => ({
        ...prev,
        fullName: localStorage.getItem("savedFullName") || "",
        email: localStorage.getItem("savedEmail") || ""
      }));
    }

    if (isAuth) {
      const savedRole = localStorage.getItem('role');
      if (savedRole === 'student') {
        navigate('/student-dashboard', { replace: true });
      } else if (savedRole === 'teacher') {
        navigate('/teacher-dashboard', { replace: true });
      }
    }
  }, [isAuth, navigate]);
  localStorage.setItem('fullName' , registerData.fullName)
  localStorage.setItem('email' , registerData.email)
  localStorage.setItem('password' , registerData.password)
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
                  className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-slate-900 focus:outline-none focus:border-purple-600 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Secret Code Input */}
            {registerData.role === "teacher" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-red-400 uppercase tracking-wider">Secret Code *</label>
                <div className="relative flex items-center">
                  <FaKey className="absolute left-4 text-red-400 text-sm" />
                  <input
                    type="password"
                    name="secretCode"
                    value={registerData.secretCode}
                    onChange={handleChange}
                    placeholder="Secret Code"
                    className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-red-900/50 focus:outline-none focus:border-red-500 transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            {/* Remember me */}
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

            {/* Register Button & Login Link */}
            <div className="flex flex-col gap-1 mt-2">
              <button
                type="submit"
                className="w-full bg-indigo-900 hover:bg-indigo-800 transition-colors p-3.5 rounded-xl text-lg text-white cursor-pointer font-bold tracking-wide shadow-lg shadow-indigo-950"
              >
                Register
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