import IconsBg from '../SmallComponents/IconsBg'
import StudentPrCard from '../SmallComponents/StudentPrCard'

const StudentProfile = ({setIsAuth}) => {
  return (
    <div className='relative p-10'>
      <IconsBg/>
      <StudentPrCard setIsAuth={setIsAuth}/>
    </div>
  )
}

export default StudentProfile
