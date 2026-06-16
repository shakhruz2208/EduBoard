import { useEffect, useState } from "react"
import { MdOutlineNotifications } from "react-icons/md"
import { NavLink } from "react-router-dom"

const Header = () => {
    const role = localStorage.getItem('role') || 'student'

    const teacherLinks = [
        {name: 'Assignments' , path: '/teacher-dashboard'},
        {name: 'Students' , path: '/teacher-students'},
        {name: 'Grades' , path:'/teacher-grades'}
    ]
    const studentLinks = [
        {name: 'Assignments' , path: '/student-dashboard'},
        {name: 'Rating' , path: '/students-rating'},
        {name: 'Grades' , path:'/student-grades'}
    ]

    const currentLinks = role === 'teacher' ? teacherLinks : studentLinks

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("userProfile");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const avatarLetter = user 
        ? (role === 'teacher' ? user.fullName?.[0] : user.email?.[0]) 
        : (role === 'teacher' ? 'T' : 'S');

  return (
    <div className='w-full h-18 bg-blue-950 relative z-50 px-6'>
      <div className='flex items-center h-full w-full gap-80'>
        <div>
            <h1 className='font-bold text-2xl text-white'>DevsClub.uz</h1>
        </div>

        <div className="flex items-center gap-90">
            <div className="flex gap-10">
                {currentLinks.map((link , index)=>(
                <NavLink key={index} className={({isActive})=>`text-xl font-bold text-white transition-all duration-300 ease-in-out relative pb-1 
                    ${isActive 
                      ? 'after:w-full' 
                      : 'after:w-0 hover:after:w-full'
                    } 
                    after:content-[""] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:bg-white after:transition-all after:duration-300`} to={link.path}>
                    {link.name}
                </NavLink>
                ))}
            </div>
            <div className="flex items-center gap-5">
                <MdOutlineNotifications className="text-white text-3xl cursor-pointer hover:scale-110 transition-transform"/>
                <NavLink 
                  to={role === 'teacher' ? '/teacher-profile' : '/student-profile'}
                  className="w-12 h-12 rounded-full border border-white flex items-center justify-center overflow-hidden transition-transform hover:scale-105"
                >
                  <span className="text-white text-sm font-bold">
                    {avatarLetter}
                  </span>
                </NavLink>
            </div>
        </div>
      </div>
    </div>
  )
}

export default Header