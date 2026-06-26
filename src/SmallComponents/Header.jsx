import { MdOutlineNotifications } from "react-icons/md"
import { NavLink } from "react-router-dom"
import { useState } from "react"
import { IconMenu2, IconX } from "@tabler/icons-react"
import { useAvatar } from "../components/AvatarContext"

const AvatarCircle = ({ avatar, avatarLetter, role }) => (
    <NavLink
        to={role === 'teacher' ? '/teacher-profile' : '/student-profile'}
        className="w-11 h-11 lg:w-12 lg:h-12 rounded-full shadow-[0_0_0_3px_rgba(99,102,241,0.25)] flex items-center justify-center overflow-hidden transition-transform hover:scale-105 shrink-0 bg-gradient-to-br from-indigo-700 to-purple-700"
    >
        {avatar ? (
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
        ) : (
            <span className="text-white text-sm font-bold">{avatarLetter}</span>
        )}
    </NavLink>
)

const Header = () => {
    const role = localStorage.getItem('role') || 'student'
    const { avatar } = useAvatar()
    const [menuOpen, setMenuOpen] = useState(false)

    const teacherLinks = [
        { name: 'Assignments', path: '/teacher-dashboard' },
        { name: 'Students', path: '/teacher-students' },
        { name: 'Grades', path: '/teacher-grades' }
    ]
    const studentLinks = [
        { name: 'Assignments', path: '/student-dashboard' },
        { name: 'Rating', path: '/students-rating' },
        { name: 'Grades', path: '/student-grades' }
    ]

    const currentLinks = role === 'teacher' ? teacherLinks : studentLinks

    const [user] = useState(() => {
        const savedUser = localStorage.getItem("userProfile")
        return savedUser ? JSON.parse(savedUser) : null
    })

    const avatarLetter = user
        ? (role === 'teacher' ? user.fullName?.[0] : user.email?.[0])
        : (role === 'teacher' ? 'T' : 'S')

    const linkClass = ({ isActive }) =>
        `text-base lg:text-xl font-bold text-white transition-all duration-300 ease-in-out relative pb-1
        ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
        after:content-[""] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:bg-white after:transition-all after:duration-300`

    return (
        <div className='w-full h-18 bg-blue-950 relative z-50 px-4 sm:px-6'>
            <div className='grid grid-cols-[auto_1fr_auto] items-center h-full w-full'>

                <h1 className='font-bold text-xl sm:text-2xl text-white shrink-0'>DevsClub.uz</h1>

                {/* Markazdagi linklar — faqat lg dan boshlab */}
                <div className="hidden lg:flex justify-center gap-10">
                    {currentLinks.map((link, index) => (
                        <NavLink key={index} className={linkClass} to={link.path}>
                            {link.name}
                        </NavLink>
                    ))}
                </div>

                {/* O'ng tomon — desktop */}
                <div className="hidden lg:flex items-center gap-5 justify-self-end">
                    <MdOutlineNotifications className="text-white text-3xl cursor-pointer hover:scale-110 transition-transform" />
                    <AvatarCircle avatar={avatar} avatarLetter={avatarLetter} role={role} />
                </div>

                {/* Mobil/tablet — burger menu, h1 o'ng tomonidan boshlab */}
                <div className="flex lg:hidden items-center gap-3 sm:gap-4 col-start-3 justify-self-end">
                    <MdOutlineNotifications className="text-white text-2xl cursor-pointer hover:scale-110 transition-transform" />
                    <AvatarCircle avatar={avatar} avatarLetter={avatarLetter} role={role} />
                    <button onClick={() => setMenuOpen(!menuOpen)} className="text-white">
                        {menuOpen ? <IconX size={26} /> : <IconMenu2 size={26} />}
                    </button>
                </div>
            </div>

            {/* Mobil dropdown menu */}
            {menuOpen && (
                <div className="lg:hidden absolute top-18 left-0 w-full bg-blue-950 border-t border-blue-800 flex flex-col px-4 py-4 gap-4 shadow-lg">
                    {currentLinks.map((link, index) => (
                        <NavLink
                            key={index}
                            onClick={() => setMenuOpen(false)}
                            className={({ isActive }) =>
                                `text-base font-bold transition-colors ${isActive ? 'text-white' : 'text-slate-400'} hover:text-white`
                            }
                            to={link.path}
                        >
                            {link.name}
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Header