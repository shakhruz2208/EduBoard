import { useEffect, useState } from "react"
import Header from "../SmallComponents/Header"
import IconsBg from "../SmallComponents/IconsBg"

const TeacherDashboard = ({ setIsAuth }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("userProfile")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogOut = () => {
    setIsAuth(false)
    localStorage.removeItem('auth')
  }

  if (!user) return <p>Loading...</p>

  return (
    <div className="relative w-full h-screen">
      <IconsBg />
      <div className="relative z-10">
        <h1 className="text-white text-xl">{user.fullName}</h1>
        <button onClick={handleLogOut}>logout</button>
      </div>
    </div>
  )
}

export default TeacherDashboard