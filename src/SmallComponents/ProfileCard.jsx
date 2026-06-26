import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconPencil, IconCrown, IconMail,
  IconLock, IconLogout, IconX, IconCheck,
  IconTrash
} from '@tabler/icons-react'
import { useAvatar } from '../components/AvatarContext'

const ProfileCard = ({ setIsAuth }) => {
  const navigate = useNavigate()
  const fileInputRef = useRef()

  const role = localStorage.getItem('role') || 'student'

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("userProfile")
    return savedUser ? JSON.parse(savedUser) : null
  })

  const { avatar, setAvatar } = useAvatar()
  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const [draftName, setDraftName] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftPassword, setDraftPassword] = useState('')

  const handleAvatarClick = () => {
    fileInputRef.current.click()
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setAvatar(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatar(null)
    localStorage.removeItem('avatar')
  }

  const openEdit = () => {
    setDraftName(user.fullName || '')
    setDraftEmail(user.email || '')
    setDraftPassword('')
    setIsEditing(true)
  }

  const saveEdit = () => {
    const updatedUser = {
      ...user,
      fullName: draftName,
      email: draftEmail,
      ...(draftPassword.trim() && { password: draftPassword })
    }
    setUser(updatedUser)
    localStorage.setItem('userProfile', JSON.stringify(updatedUser))
    setIsEditing(false)
  }

  const handleLogOut = () => {
    setIsAuth(false)
    localStorage.removeItem('auth')
    navigate('/register', { replace: true })
  }

  if (!user) return <p className="text-white text-center mt-10">Loading...</p>

  const avatarLetter = role === 'teacher' ? user.fullName?.[0] : user.email?.[0]

  return (
    <div className="z-10 mx-auto max-w-md w-full bg-[#14193A] rounded-2xl p-5 sm:p-8 border border-indigo-700/20 relative">

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-700 to-purple-700 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl sm:text-4xl font-bold">{avatarLetter}</span>
            )}
          </div>

          <button
            onClick={handleAvatarClick}
            className="absolute bottom-0 right-0 w-8 h-8 sm:w-9 sm:h-9 bg-indigo-700 rounded-full flex items-center justify-center border-2 border-[#14193A] cursor-pointer hover:bg-indigo-600 transition-colors"
          >
            <IconPencil size={14} className="text-white sm:hidden" />
            <IconPencil size={16} className="text-white hidden sm:block" />
          </button>

          {avatar && (
            <button
              onClick={handleRemoveAvatar}
              className="absolute top-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-red-700 rounded-full flex items-center justify-center border-2 border-[#14193A] cursor-pointer hover:bg-red-600 transition-colors"
            >
              <IconTrash size={11} className="text-white sm:hidden" />
              <IconTrash size={13} className="text-white hidden sm:block" />
            </button>
          )}
        </div>

        <h2 className="text-white text-xl sm:text-2xl font-medium text-center break-words px-2">{user.fullName}</h2>

        <div className="inline-flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/40 rounded-full px-3.5 sm:px-4 py-1.5">
          <IconCrown size={16} className="text-indigo-300" />
          <span className="text-xs sm:text-sm font-medium text-indigo-300">
            {role === 'teacher' ? 'Teacher' : 'Student'}
          </span>
        </div>

        <button
          onClick={openEdit}
          className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer mt-1"
        >
          Edit Profile
        </button>
      </div>

      {!isEditing ? (
        <div className="mt-6 sm:mt-7 flex flex-col gap-4 sm:gap-5">
          <div className="flex items-start gap-3">
            <IconMail size={20} className="text-indigo-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Email</p>
              <p className="text-sm sm:text-base text-white break-all">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <IconLock size={20} className="text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Password</p>
              <p className="text-sm sm:text-base text-white">••••••••</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 sm:mt-7 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">FullName</label>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full bg-[#030712] text-slate-300 text-sm px-4 py-2.5 sm:py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              className="w-full bg-[#030712] text-slate-300 text-sm px-4 py-2.5 sm:py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New password</label>
            <input
              type="password"
              placeholder="Leave blank if you don't change it."
              value={draftPassword}
              onChange={(e) => setDraftPassword(e.target.value)}
              className="w-full bg-[#030712] text-slate-300 placeholder-slate-600 text-sm px-4 py-2.5 sm:py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex gap-3 mt-1">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-xl py-2.5 text-sm text-white transition-colors"
            >
              <IconX size={16} /> Cancel
            </button>
            <button
              onClick={saveEdit}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-600 rounded-xl py-2.5 text-sm text-white transition-colors"
            >
              <IconCheck size={16} /> Save
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full mt-6 sm:mt-7 bg-red-700 hover:bg-red-600 rounded-xl py-3 sm:py-3.5 flex items-center justify-center gap-2 cursor-pointer transition-colors"
      >
        <IconLogout size={18} className="text-white" />
        <span className="text-sm sm:text-base font-medium text-white">LogOut</span>
      </button>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#14193A] border border-indigo-700/30 rounded-2xl p-5 sm:p-6 max-w-sm w-full">
            <h3 className="text-white text-base sm:text-lg font-medium mb-2">Are you sure you want to LogOut?</h3>
            <p className="text-slate-400 text-sm mb-5">You will be logged out and will need to log in again.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl py-2.5 text-sm text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogOut}
                className="flex-1 bg-red-700 hover:bg-red-600 rounded-xl py-2.5 text-sm text-white transition-colors"
              >
                Yes, LogOut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileCard