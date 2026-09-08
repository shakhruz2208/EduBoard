import { useState, useRef, useEffect } from 'react'
import {
  IconPencil, IconCrown, IconMail,
  IconLock, IconLogout, IconX, IconCheck, IconKey, IconCopy
  , IconTrash
} from '@tabler/icons-react'
import { CgSpinner } from 'react-icons/cg'
import { toast } from 'react-toastify'
import { useAuth, resolveAvatarUrl } from '../Providers/AuthProvider'
import { useLanguage } from '../Providers/LanguageProvider'

const ProfileCard = () => {
  const fileInputRef = useRef()
  const { user, logout, uploadAvatar, avatarUploading, updateProfile, profileUpdating, changePassword, passwordUpdating, deleteAccount } = useAuth()
  const { t } = useLanguage()

  const role = user?.teacher ? 'teacher' : 'student'

  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  const [draftName, setDraftName] = useState('')
  const [draftEmail, setDraftEmail] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      setDraftName(user.full_name || '')
      setDraftEmail(user.email || '')
    }
  }, [user])

  const handleAvatarClick = () => {
    fileInputRef.current.click()
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      await uploadAvatar(file)
    }
    e.target.value = ''
  }

  const openEdit = () => {
    setDraftName(user?.full_name || '')
    setDraftEmail(user?.email || '')
    setIsEditing(true)
    setIsChangingPassword(false)
  }

  const openChangePassword = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setIsChangingPassword(true)
    setIsEditing(false)
  }

  const saveEdit = async () => {
    const success = await updateProfile(draftName.trim(), draftEmail.trim())
    if (success) setIsEditing(false)
  }

  const savePassword = async () => {
    if (newPassword !== confirmPassword) return
    const success = await changePassword(currentPassword, newPassword)
    if (success) setIsChangingPassword(false)
  }

  const handleLogOut = () => {
    logout()
    // ProtectedRoute redirects to /login automatically once isAuth flips.
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) return
    setDeletingAccount(true)
    await deleteAccount(deletePassword)
    setDeletingAccount(false)
  }

  if (!user) return <p className="text-white text-center mt-10">{t('loading')}</p>

  const avatarUrl = resolveAvatarUrl(user.profile_pic)
  const avatarLetter = user.full_name?.[0] || user.email?.[0] || (role === 'teacher' ? 'T' : 'S')
  const isSaveDisabled = !draftName.trim() || !draftEmail.trim()
  const isPasswordMismatch = newPassword && confirmPassword && newPassword !== confirmPassword
  const isPasswordSaveDisabled = !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword

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
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl sm:text-4xl font-bold">{avatarLetter}</span>
            )}
          </div>

          <button
            onClick={handleAvatarClick}
            disabled={avatarUploading}
            className="absolute bottom-0 right-0 w-8 h-8 sm:w-9 sm:h-9 bg-indigo-700 rounded-full flex items-center justify-center border-2 border-[#14193A] cursor-pointer hover:bg-indigo-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {avatarUploading ? (
              <CgSpinner className="animate-spin text-white text-sm" />
            ) : (
              <>
                <IconPencil size={14} className="text-white sm:hidden" />
                <IconPencil size={16} className="text-white hidden sm:block" />
              </>
            )}
          </button>
        </div>

        <h2 className="text-white text-xl sm:text-2xl font-medium text-center break-words px-2">{user.full_name}</h2>

        <div className="inline-flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/40 rounded-full px-3.5 sm:px-4 py-1.5">
          <IconCrown size={16} className="text-indigo-300" />
          <span className="text-xs sm:text-sm font-medium text-indigo-300">
            {role === 'teacher' ? t('teacher_role') : t('student_role')}
          </span>
        </div>

        {role === 'student' && (() => {
          // Show the FULL student_code exactly as backend stores it
          const displayId = user.student_code || String(user.id)
          return (
            <div className="flex items-center gap-2 bg-[#0e1442] border border-indigo-900/40 rounded-xl px-3.5 py-2 mt-1">
              <span className="text-slate-400 text-xs">{t('student_id_label')}:</span>
              <span className="text-white font-bold text-sm font-mono tracking-widest">{displayId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(String(displayId))
                  toast.success('Copied!')
                }}
                className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
                title="Copy ID"
              >
                <IconCopy size={15} />
              </button>
            </div>
          )
        })()}
        {role === 'student' && (
          <p className="text-[11px] text-slate-500 text-center max-w-[260px]">{t('share_id_hint')}</p>
        )}

        <div className="flex items-center gap-4 mt-1">
          <button
            onClick={openEdit}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          >
            {t('edit_profile')}
          </button>
          <button
            onClick={openChangePassword}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          >
            {t('change_password')}
          </button>
        </div>
      </div>

      {!isEditing && !isChangingPassword && (
        <div className="mt-6 sm:mt-7 flex flex-col gap-4 sm:gap-5">
          <div className="flex items-start gap-3">
            <IconMail size={20} className="text-indigo-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{t('email_label')}</p>
              <p className="text-sm sm:text-base text-white break-all">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <IconLock size={20} className="text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{t('password_label')}</p>
              <p className="text-sm sm:text-base text-white">••••••••</p>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="mt-6 sm:mt-7 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('fullname_label')}</label>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full bg-[#030712] text-slate-300 text-sm px-4 py-2.5 sm:py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('email_label')}</label>
            <input
              type="email"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              className="w-full bg-[#030712] text-slate-300 text-sm px-4 py-2.5 sm:py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex gap-3 mt-1">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-xl py-2.5 text-sm text-white transition-colors cursor-pointer"
            >
              <IconX size={16} /> {t('cancel')}
            </button>
            <button
              onClick={saveEdit}
              disabled={isSaveDisabled || profileUpdating}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-2.5 text-sm text-white transition-colors cursor-pointer"
            >
              {profileUpdating ? <CgSpinner className="animate-spin" size={16} /> : <IconCheck size={16} />} {t('save')}
            </button>
          </div>
        </div>
      )}

      {isChangingPassword && (
        <div className="mt-6 sm:mt-7 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('current_password')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#030712] text-slate-300 text-sm px-4 py-2.5 sm:py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('new_password')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              maxLength={128}
              className="w-full bg-[#030712] text-slate-300 text-sm px-4 py-2.5 sm:py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
            />
            <p className="text-[11px] text-slate-500">{t('password_hint')}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('confirm_new_password')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#030712] text-slate-300 text-sm px-4 py-2.5 sm:py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
            />
            {isPasswordMismatch && (
              <p className="text-[11px] text-red-400">{t('passwords_no_match')}</p>
            )}
          </div>

          <div className="flex gap-3 mt-1">
            <button
              onClick={() => setIsChangingPassword(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-xl py-2.5 text-sm text-white transition-colors cursor-pointer"
            >
              <IconX size={16} /> {t('cancel')}
            </button>
            <button
              onClick={savePassword}
              disabled={isPasswordSaveDisabled || passwordUpdating}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-2.5 text-sm text-white transition-colors cursor-pointer"
            >
              {passwordUpdating ? <CgSpinner className="animate-spin" size={16} /> : <IconKey size={16} />} {t('save')}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full mt-6 sm:mt-7 bg-red-700 hover:bg-red-600 rounded-xl py-3 sm:py-3.5 flex items-center justify-center gap-2 cursor-pointer transition-colors"
      >
        <IconLogout size={18} className="text-white" />
        <span className="text-sm sm:text-base font-medium text-white">{t('logout')}</span>
      </button>

      <button
        onClick={() => { setDeletePassword(''); setShowDeleteConfirm(true) }}
        className="w-full mt-3 border border-red-500/30 bg-red-950/30 hover:bg-red-900/50 rounded-xl py-2.5 flex items-center justify-center gap-2 cursor-pointer transition-colors"
      >
        <IconTrash size={17} className="text-red-300" />
        <span className="text-sm font-medium text-red-200">{t('delete_account')}</span>
      </button>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#14193A] border border-indigo-700/30 rounded-2xl p-5 sm:p-6 max-w-sm w-full">
            <h3 className="text-white text-base sm:text-lg font-medium mb-2">{t('confirm_logout_title')}</h3>
            <p className="text-slate-400 text-sm mb-5">{t('confirm_logout_text')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl py-2.5 text-sm text-white transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleLogOut}
                className="flex-1 bg-red-700 hover:bg-red-600 rounded-xl py-2.5 text-sm text-white transition-colors cursor-pointer"
              >
                {t('yes_logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#14193A] border border-red-500/30 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-red-300">{t('delete_account')}</p>
                <h3 className="text-white text-lg font-semibold mt-2">{t('delete_account_title')}</h3>
              </div>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-400 hover:text-white cursor-pointer"><IconX size={20} /></button>
            </div>
            <p className="text-slate-400 text-sm leading-6 mt-3">{t('delete_account_text')}</p>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mt-5 mb-2">{t('enter_password_delete')}</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              autoFocus
              className="w-full bg-[#030712] text-white text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deletingAccount} className="flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl py-2.5 text-sm text-white cursor-pointer disabled:opacity-50">{t('cancel')}</button>
              <button onClick={handleDeleteAccount} disabled={!deletePassword || deletingAccount} className="flex-1 flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 rounded-xl py-2.5 text-sm text-white cursor-pointer disabled:opacity-50">
                {deletingAccount && <CgSpinner className="animate-spin" />}
                {t('confirm_delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileCard