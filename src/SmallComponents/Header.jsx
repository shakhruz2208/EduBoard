import { NavLink } from "react-router-dom"
import { useState } from "react"
import { IconMenu2, IconX, IconSun, IconMoonStars } from "@tabler/icons-react"
import { useAuth, resolveAvatarUrl } from "../Providers/AuthProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { useTheme } from "../Providers/ThemeProvider"
import NotificationBell from "./NotificationBell"
import LanguageSwitcher from "../components/LanguageSwitcher"

const AvatarCircle = ({ avatarUrl, avatarLetter, role }) => (
    <NavLink
        to={role === 'teacher' ? '/teacher-profile' : '/student-profile'}
        className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full shadow-[0_0_0_3px_rgba(99,102,241,0.25)] flex items-center justify-center overflow-hidden transition-transform hover:scale-105 shrink-0 bg-gradient-to-br from-indigo-700 to-purple-700"
    >
        {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
            <span className="text-white text-lg sm:text-xl pb-1 font-bold">{avatarLetter}</span>
        )}
    </NavLink>
)

const Header = () => {
    const { user } = useAuth()
    const { t } = useLanguage()
    const { isLight, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)

    const role = user?.teacher ? 'teacher' : 'student'
    const avatarUrl = resolveAvatarUrl(user?.profile_pic)

    const teacherLinks = [
        { name: t('nav_assignments'), path: '/teacher-dashboard' },
        { name: t('nav_students'), path: '/teacher-students' },
        { name: t('nav_rating'), path: '/teacher-rating' },
        { name: t('nav_grades'), path: '/teacher-grades' }
    ]
    const studentLinks = [
        { name: t('nav_assignments'), path: '/student-dashboard' },
        { name: t('nav_lessons'), path: '/student-lessons' },
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
        <div className='w-full min-h-18 bg-blue-950 relative z-50 px-3 sm:px-6'>
            <div className='flex items-center justify-between h-full w-full py-3 gap-2'>

                <h1 className='font-bold text-lg sm:text-xl lg:text-2xl text-white shrink-0'>{t('brand')}</h1>

                <div className="hidden lg:flex justify-center gap-10 flex-1">
                    {currentLinks.map((link, index) => (
                        <NavLink key={index} className={linkClass} to={link.path}>
                            {link.name}
                        </NavLink>
                    ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
                    <button
                        onClick={toggleTheme}
                        aria-label={isLight ? 'Dark mode' : 'Light mode'}
                        title={isLight ? 'Dark mode' : 'Light mode'}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                        {isLight ? <IconMoonStars size={19} /> : <IconSun size={19} />}
                    </button>
                    <LanguageSwitcher />
                    <NotificationBell />
                    <AvatarCircle avatarUrl={avatarUrl} avatarLetter={avatarLetter} role={role} />
                    <button onClick={() => setMenuOpen(!menuOpen)} className="text-white lg:hidden">
                        {menuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
                    </button>
                </div>
            </div>

            {menuOpen && (
                <div className="lg:hidden absolute top-full left-0 w-full bg-blue-950 border-t border-blue-800 flex flex-col px-4 py-4 gap-4 shadow-lg">
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