import { NavLink } from "react-router-dom"
import { useState } from "react"
import { IconMenu2, IconX } from "@tabler/icons-react"
import { useAuth, resolveAvatarUrl } from "../Providers/AuthProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import NotificationBell from "./NotificationBell"
import LanguageSwitcher from "../components/LanguageSwitcher"

const AvatarCircle = ({ avatarUrl, avatarLetter, role }) => (
    <NavLink
        to={role === 'teacher' ? '/teacher-profile' : '/student-profile'}
        className="w-11 h-11 lg:w-12 lg:h-12 rounded-full shadow-[0_0_0_3px_rgba(99,102,241,0.25)] flex items-center justify-center overflow-hidden transition-transform hover:scale-105 shrink-0 bg-gradient-to-br from-indigo-700 to-purple-700"
    >
        {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
            <span className="text-white text-xl pb-1 font-bold">{avatarLetter}</span>
        )}
    </NavLink>
)

const Header = () => {
    const { user } = useAuth()
    const { t } = useLanguage()
    const [menuOpen, setMenuOpen] = useState(false)

    const role = user?.teacher ? 'teacher' : 'student'
    const avatarUrl = resolveAvatarUrl(user?.profile_pic)

    const teacherLinks = [
        { name: t('nav_assignments'), path: '/teacher-dashboard' },
        { name: t('nav_students'), path: '/teacher-students' },
        { name: t('nav_grades'), path: '/teacher-grades' }
    ]
    const studentLinks = [
        { name: t('nav_assignments'), path: '/student-dashboard' },
        { name: t('nav_rating'), path: '/students-rating' },
        { name: t('nav_grades'), path: '/student-grades' }
    ]

    const currentLinks = role === 'teacher' ? teacherLinks : studentLinks

    const avatarLetter = user?.full_name?.[0] || (role === 'teacher' ? 'T' : 'S')

    const linkClass = ({ isActive }) =>
        `text-base lg:text-xl font-bold text-white transition-all duration-300 ease-in-out relative pb-1
        ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
        after:content-[""] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:bg-white after:transition-all after:duration-300`

    return (
        <div className='w-full h-18 bg-blue-950 relative z-50 px-4 sm:px-6'>
            <div className='grid grid-cols-[auto_1fr_auto] items-center h-full w-full'>

                <h1 className='font-bold text-xl sm:text-2xl text-white shrink-0'>{t('brand')}</h1>

                {/* Markazdagi linklar — faqat lg dan boshlab */}
                <div className="hidden lg:flex justify-center gap-10">
                    {currentLinks.map((link, index) => (
                        <NavLink key={index} className={linkClass} to={link.path}>
                            {link.name}
                        </NavLink>
                    ))}
                </div>

                {/* O'ng tomon — desktop */}
                <div className="hidden lg:flex items-center gap-4 justify-self-end">
                    <LanguageSwitcher />
                    <NotificationBell />
                    <AvatarCircle avatarUrl={avatarUrl} avatarLetter={avatarLetter} role={role} />
                </div>

                <div className="flex lg:hidden items-center gap-3 sm:gap-4 col-start-3 justify-self-end">
                    <NotificationBell />
                    <AvatarCircle avatarUrl={avatarUrl} avatarLetter={avatarLetter} role={role} />
                    <button onClick={() => setMenuOpen(!menuOpen)} className="text-white">
                        {menuOpen ? <IconX size={26} /> : <IconMenu2 size={26} />}
                    </button>
                </div>
            </div>

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
                    <div className="pt-2 border-t border-blue-800">
                        <LanguageSwitcher />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Header