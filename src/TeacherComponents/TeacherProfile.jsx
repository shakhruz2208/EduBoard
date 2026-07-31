import IconsBg from '../SmallComponents/IconsBg'
import ProfileCard from '../SmallComponents/ProfileCard';

const TeacherProfile = ({setIsAuth}) => {
     
  return (
    <div className='relative p-10'>
        <IconsBg/>
      <ProfileCard setIsAuth={setIsAuth}/>
    </div>
  )
}

export default TeacherProfile
