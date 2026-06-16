
const StudentDashboard = ({setIsAuth}) => {
      const handleLogOut = () => {
        setIsAuth(false)
        localStorage.removeItem('auth')
    }
  return (
    <div>
      Hello my Student
      <button onClick={handleLogOut}>logout</button>
    </div>
  )
}

export default StudentDashboard
