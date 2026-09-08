import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { IoArrowBack, IoSchoolOutline, IoAdd, IoChevronDown, IoChevronUp, IoPencil, IoCheckmark, IoClose } from "react-icons/io5"
import { HiOutlineUserGroup } from "react-icons/hi2"
import { FiTrash2, FiUserX, FiUserPlus, FiShield, FiUser } from "react-icons/fi"
import { CgSpinner } from "react-icons/cg"
import IconsBg from "../SmallComponents/IconsBg"
import { useCourses } from "../Providers/CourseProvider"
import { useLanguage } from "../Providers/LanguageProvider"

const ACCENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
  "from-cyan-500 to-sky-600",
]

const CourseCard = ({ course, accent, t, expanded, onToggle }) => {
  const {
    groupMembers, fetchGroupMembers, removeMember, removingKey,
    deleteCourse, addStudentToGroup, joiningId,
    updateCourse, updatingId, promoteToAdmin, demoteFromAdmin, adminKey
  } = useCourses()

  const [loadingMembers, setLoadingMembers] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newStudentId, setNewStudentId] = useState('')

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(course.name)
  const [editDescription, setEditDescription] = useState(course.description || '')
  const members = groupMembers[course.id] || []

  const toggleExpand = async () => {
    const next = !expanded
    onToggle(next ? course.id : null)
    if (next && !groupMembers[course.id]) {
      setLoadingMembers(true)
      await fetchGroupMembers(course.id)
      setLoadingMembers(false)
    }
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    setDeleting(true)
    await deleteCourse(course.id)
    setDeleting(false)
  }

  const handleAddStudent = async () => {
    if (!newStudentId.trim()) return
    const success = await addStudentToGroup(course.id, newStudentId.trim())
    if (success) setNewStudentId('')
  }

  const handleSaveEdit = async (e) => {
    e.stopPropagation()
    const success = await updateCourse(course.id, { name: editName, description: editDescription })
    if (success) setEditing(false)
  }

  const startEditing = (e) => {
    e.stopPropagation()
    setEditName(course.name)
    setEditDescription(course.description || '')
    setEditing(true)
  }

  const addingThisStudent = joiningId === `${course.id}:${newStudentId}`

  return (
    <div className="relative bg-[#08133d] border border-indigo-900/40 rounded-2xl p-6 overflow-hidden hover:border-indigo-500/40 transition-colors">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${accent}`} />

      {editing ? (
        <div className="pl-2 flex flex-col gap-3">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="bg-[#030712] text-white text-sm px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-indigo-600"
            placeholder={t('new_course_label')}
          />
          <input
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="bg-[#030712] text-white text-sm px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-indigo-600"
            placeholder={t('description_optional')}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={updatingId === course.id || !editName.trim()}
              className="px-4 py-2 rounded-lg bg-[#8fd125] text-black text-sm font-semibold hover:shadow-lg hover:shadow-[#78af1f] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              {updatingId === course.id ? <CgSpinner className="animate-spin" /> : <IoCheckmark />}
              {t('save_btn')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(false) }}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <IoClose /> {t('cancel_btn')}
            </button>
          </div>
        </div>
      ) : (
        <div className="pl-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 cursor-pointer" onClick={toggleExpand}>
            <h3 className="text-white font-bold text-lg truncate">{course.name}</h3>
            {course.description && (
              <p className="text-slate-400 text-sm mt-1">{course.description}</p>
            )}
            <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-3">
              <HiOutlineUserGroup className="text-indigo-400" />
              {members.length > 0 || groupMembers[course.id] ? members.length : "?"} {t('students_word')}
              {expanded ? <IoChevronUp className="ml-1" /> : <IoChevronDown className="ml-1" />}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={startEditing}
              className="w-9 h-9 rounded-xl bg-indigo-950/60 hover:bg-indigo-700 transition-all flex items-center justify-center text-indigo-300 hover:text-white cursor-pointer"
              title={t('edit')}
            >
              <IoPencil className="text-sm" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-9 h-9 rounded-xl bg-red-950/40 hover:bg-red-600 transition-all flex items-center justify-center text-red-400 hover:text-white cursor-pointer disabled:opacity-50"
              title={t('delete')}
            >
              {deleting ? <CgSpinner className="animate-spin text-sm" /> : <FiTrash2 className="text-sm" />}
            </button>
          </div>
        </div>
      )}

      {expanded && !editing && (
        <div className="pl-2 mt-4 pt-4 border-t border-indigo-900/40">
          {/* Student add section */}
          <div className="mb-4">
            <p className="text-indigo-300 text-xs font-medium mb-2">➕ {t('add_student')}</p>
            <div className="flex items-center gap-2">
              <input
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                placeholder={t('student_email_or_id')}
                className="flex-1 bg-[#030712] text-white text-sm px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-indigo-600"
              />
              <button
                onClick={handleAddStudent}
                disabled={!newStudentId.trim() || addingThisStudent}
                className="px-4 py-2 rounded-lg bg-[#8fd125] text-black text-sm font-semibold hover:shadow-lg hover:shadow-[#78af1f] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                {addingThisStudent ? <CgSpinner className="animate-spin" /> : <IoAdd />}
                {t('add_btn')}
              </button>
            </div>
          </div>
          {loadingMembers ? (
            <p className="text-slate-500 text-sm">{t('loading')}</p>
          ) : members.length === 0 ? (
            <p className="text-slate-500 text-sm">{t('no_students')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-[#0e1442] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {m.full_name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <span className="text-white text-sm truncate">{m.full_name}</span>
                    {m.is_group_admin && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">{t('admin_badge')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => (m.is_group_admin ? demoteFromAdmin(course.id, m.id) : promoteToAdmin(course.id, m.id))}
                      disabled={adminKey === `${course.id}:${m.id}`}
                      className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                      title={m.is_group_admin ? t('delete') : t('edit')}
                    >
                      {adminKey === `${course.id}:${m.id}` ? <CgSpinner className="animate-spin text-sm" /> : (m.is_group_admin ? <FiUser className="text-sm" /> : <FiShield className="text-sm" />)}
                    </button>
                    <button
                      onClick={() => removeMember(course.id, m.id)}
                      disabled={removingKey === `${course.id}:${m.id}`}
                      className="text-red-400 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                      title={t('delete')}
                    >
                      {removingKey === `${course.id}:${m.id}` ? <CgSpinner className="animate-spin text-sm" /> : <FiUserX className="text-sm" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const TeacherCourse = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { courses, creating, addCourse } = useCourses()

  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseDescription, setNewCourseDescription] = useState('')
  const [expandedCourseId, setExpandedCourseId] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    const success = await addCourse(newCourseName, newCourseDescription)
    if (success) {
      setNewCourseName('')
      setNewCourseDescription('')
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-[#03071e] pb-20">
      <IconsBg />
      <div className="relative z-10 p-6 sm:p-10 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/teacher-dashboard')}
          className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors mb-8 cursor-pointer"
        >
          <IoArrowBack /> {t('back')}
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center">
            <IoSchoolOutline className="text-indigo-400 text-2xl" />
          </div>
          <div>
            <h1 className="text-white text-2xl sm:text-3xl font-bold">{t('my_courses')}</h1>
            <p className="text-indigo-300 text-sm">{t('my_courses_subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="mt-8 bg-[#08133d] border border-indigo-900/40 rounded-2xl p-6 sm:p-7 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="newCourse" className="text-white text-sm font-semibold">{t('new_course_label')}</label>
            <input
              id="newCourse"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder={t('new_course_placeholder')}
              className="bg-[#090b79] text-white text-sm px-4 py-3 rounded-xl outline-none focus:shadow-md focus:shadow-blue-800 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="newCourseDesc" className="text-white text-sm font-semibold">{t('description_optional')}</label>
            <input
              id="newCourseDesc"
              value={newCourseDescription}
              onChange={(e) => setNewCourseDescription(e.target.value)}
              placeholder={t('group_evening_hint')}
              className="bg-[#090b79] text-white text-sm px-4 py-3 rounded-xl outline-none focus:shadow-md focus:shadow-blue-800 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newCourseName.trim()}
            className="self-start flex items-center justify-center gap-2 bg-[#8fd125] text-black font-semibold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-[#78af1f] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {creating ? <CgSpinner className="animate-spin" /> : <IoAdd className="text-lg" />}
            {t('create_course')}
          </button>
        </form>

        <div className="mt-8">
          {courses.length === 0 ? (
            <div className="bg-[#08133d] border border-indigo-900/40 rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
              <IoSchoolOutline className="text-5xl text-slate-600" />
              <p className="text-slate-400">{t('no_courses_yet')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-5">
              {courses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  accent={ACCENTS[index % ACCENTS.length]}
                  t={t}
                  expanded={expandedCourseId === course.id}
                  onToggle={setExpandedCourseId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeacherCourse