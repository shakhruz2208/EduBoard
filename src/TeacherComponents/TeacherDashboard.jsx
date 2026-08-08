import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import IconsBg from "../SmallComponents/IconsBg"
import { MdAssignment, MdPendingActions } from "react-icons/md"
import { BiSend, BiCalendar } from "react-icons/bi"
import { BsPeople } from "react-icons/bs"
import { IoCreate, IoChevronForward, IoSchoolOutline } from "react-icons/io5"
import { FiTrash2, FiPlus } from "react-icons/fi"
import { CgSpinner } from "react-icons/cg"
import { useAssignments } from "../Providers/AssignmentProvider"
import { useAuth } from "../Providers/AuthProvider"
import { useLanguage } from "../Providers/LanguageProvider"
import { useCourses } from "../Providers/CourseProvider"

const isGradedValue = (grade) => grade !== undefined && grade !== null && grade !== ""

const TeacherDashboard = () => {
  const { assignmentsList, fetching, creating, deletingId, addAssignment, deleteAssignment } = useAssignments()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { courses, creating: courseCreating, deletingId: courseDeletingId, addCourse, deleteCourse, studentsInCourse } = useCourses()

  const [assignment, setAssignment] = useState('')
  const [deadline, setDeadline] = useState('')
  const [assignmentCourseId, setAssignmentCourseId] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [newCourseName, setNewCourseName] = useState('')

  // Only this teacher's own courses
  const myCourses = useMemo(
    () => courses.filter((c) => c.teacherName === user?.full_name),
    [courses, user]
  )

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    const success = await addCourse(newCourseName, user?.full_name)
    if (success) setNewCourseName('')
  }

  // Only this teacher's own assignments — not everyone else's
  const myAssignments = useMemo(
    () => assignmentsList.filter((a) => a.teacherName === user?.full_name),
    [assignmentsList, user]
  )

  const { pendingReview, activeStudents } = useMemo(() => {
    let pending = 0
    const studentSet = new Set()
    myAssignments.forEach((a) => {
      const subs = Array.isArray(a.submissions) ? a.submissions : []
      subs.forEach((s) => {
        studentSet.add(s.studentName)
        if (!isGradedValue(s.grade)) pending += 1
      })
    })
    return { pendingReview: pending, activeStudents: studentSet.size }
  }, [myAssignments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const teacherName = user?.full_name || "Unknown Teacher"
    const selectedCourse = myCourses.find((c) => String(c.id) === String(assignmentCourseId))

    const success = await addAssignment(assignment, deadline, teacherName, assignmentCourseId || null, selectedCourse?.name || null)
    if (success) {
      setAssignment('')
      setDeadline('')
      setAssignmentCourseId('')
    }
  }

  const displayedAssignments = showAll ? myAssignments : myAssignments.slice(0, 3)

  return (
    <div className="relative w-full min-h-screen bg-[#03071e] pb-20">
      <IconsBg />
      <div className="relative z-10 p-6 sm:p-10 flex flex-col">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-white text-4xl sm:text-6xl">{t('hello_teacher')}</h1>
          <h1 className="font-bold text-indigo-300 text-base sm:text-xl">{t('teacher_subtitle')}</h1>
        </div>

        <div className="flex flex-wrap gap-6 sm:gap-10 pt-10">
          <div className="w-full sm:w-96 h-40 sm:h-44 hover:scale-[1.02] hover:shadow-2xl rounded-2xl shadow-lg shadow-indigo-900/60 transition-all duration-200 ease-in-out p-6 sm:p-7 bg-gradient-to-br from-[#0c1650] to-[#08133d] border border-indigo-900/40">
            <div className="flex justify-between">
              <MdAssignment className="text-indigo-400 text-3xl" />
              <h1 className="text-indigo-400 text-xs font-bold tracking-wider">{t('total_label')}</h1>
            </div>
            <h1 className="text-4xl text-white pt-3 font-bold">{myAssignments.length}</h1>
            <h1 className="text-indigo-400 text-sm pt-2 font-semibold">{t('stat_total_assignments')}</h1>
          </div>

          <div className="w-full sm:w-96 h-40 sm:h-44 hover:scale-[1.02] hover:shadow-2xl rounded-2xl shadow-lg shadow-amber-900/40 transition-all duration-200 ease-in-out p-6 sm:p-7 bg-gradient-to-br from-[#3a2a0c] to-[#241a08] border border-amber-900/30">
            <div className="flex justify-between">
              <MdPendingActions className="text-amber-400 text-3xl" />
              <h1 className="text-amber-400 text-xs font-bold tracking-wider">{t('total_label')}</h1>
            </div>
            <h1 className="text-4xl text-white pt-3 font-bold">{pendingReview}</h1>
            <h1 className="text-amber-400 text-sm pt-2 font-semibold">{t('stat_pending_review')}</h1>
          </div>

          <div className="w-full sm:w-96 h-40 sm:h-44 hover:scale-[1.02] hover:shadow-2xl rounded-2xl shadow-lg shadow-emerald-900/40 transition-all duration-200 ease-in-out p-6 sm:p-7 bg-gradient-to-br from-[#0c3a2a] to-[#08241a] border border-emerald-900/30">
            <div className="flex justify-between">
              <BsPeople className="text-emerald-400 text-3xl" />
              <h1 className="text-emerald-400 text-xs font-bold tracking-wider">{t('total_label')}</h1>
            </div>
            <h1 className="text-4xl text-white pt-3 font-bold">{activeStudents}</h1>
            <h1 className="text-emerald-400 text-sm pt-2 font-semibold">{t('stat_active_students')}</h1>
          </div>
        </div>

        <div className="bg-[#08133d] border border-indigo-900/40 rounded-2xl p-6 sm:p-7 mt-8">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <IoSchoolOutline className="text-indigo-400 text-xl" /> My Courses
            </h2>
            <form onSubmit={handleCreateCourse} className="flex items-center gap-2">
              <input
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="New course name"
                className="bg-[#090b79] text-white text-sm px-4 py-2 rounded-xl outline-none focus:shadow-md focus:shadow-blue-800 transition-all w-48 sm:w-56"
              />
              <button
                type="submit"
                disabled={courseCreating || !newCourseName.trim()}
                className="w-9 h-9 rounded-xl bg-[#8fd125] text-black flex items-center justify-center hover:shadow-lg hover:shadow-[#78af1f] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                title="Create course"
              >
                {courseCreating ? <CgSpinner className="animate-spin" /> : <FiPlus />}
              </button>
            </form>
          </div>

          {myCourses.length === 0 ? (
            <p className="text-slate-500 text-sm">You haven't created any courses yet — add one above so students can pick it during registration.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {myCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-3 bg-[#0e1442] border border-indigo-900/40 rounded-xl px-4 py-2.5"
                >
                  <span className="text-white text-sm font-medium">{course.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300">
                    {studentsInCourse(course.id).length} students
                  </span>
                  <button
                    onClick={() => deleteCourse(course.id)}
                    disabled={courseDeletingId === course.id}
                    className="text-red-400 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete course"
                  >
                    {courseDeletingId === course.id ? <CgSpinner className="animate-spin text-sm" /> : <FiTrash2 className="text-sm" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col xl:flex-row gap-10 mt-10 items-start">

          <form onSubmit={handleSubmit} className="bg-[#08133d] border border-indigo-900/40 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 w-full xl:w-[400px] shrink-0">
            <div className="text-white flex gap-2 items-center">
              <IoCreate className="text-3xl"/>
              <h1 className="text-2xl font-semibold">{t('create_assignment')}</h1>
            </div>
            <div className="flex flex-col text-white gap-1">
              <label htmlFor="topicName">{t('topic_name')}</label>
              <input 
                value={assignment}
                required
                onChange={(e)=> setAssignment(e.target.value)}
                className="rounded-xl p-3 w-full outline-none focus:shadow-md transition-all duration-150 ease-in-out focus:shadow-blue-800 bg-[#090b79]" 
                type="text" 
                id="topicName" 
                placeholder={t('topic_placeholder')}
              />
            </div>
            <div className="flex flex-col text-white gap-1">
              <label htmlFor="assignmentCourse">Course (optional)</label>
              <select
                id="assignmentCourse"
                value={assignmentCourseId}
                onChange={(e) => setAssignmentCourseId(e.target.value)}
                className="rounded-xl p-3 w-full outline-none focus:shadow-md transition-all duration-150 ease-in-out focus:shadow-blue-800 bg-[#090b79] cursor-pointer"
              >
                <option value="">All students (no course)</option>
                {myCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {myCourses.length === 0 && (
                <p className="text-[11px] text-indigo-300">Create a course above to target a specific group.</p>
              )}
            </div>
            <div className="flex flex-col text-white gap-1">
              <label htmlFor="deadline">{t('deadline_label')}</label>
              <input
                value={deadline}
                onChange={(e)=>setDeadline(e.target.value)}
                className="rounded-xl p-3 w-full outline-none focus:shadow-md transition-all duration-150 ease-in-out focus:shadow-blue-800 bg-[#090b79] [&::-webkit-calendar-picker-indicator]:invert" 
                type="datetime-local" 
                id="deadline" 
              />
            </div>
            <button
              disabled={creating}
              className="text-black border-none cursor-pointer hover:shadow-lg hover:shadow-[#78af1f] transition-all duration-150 ease-in-out bg-[#8fd125] flex p-3 justify-center items-center gap-1 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed">
              {creating ? <CgSpinner className="animate-spin text-xl"/> : <span className="flex items-center gap-1">{t('submit')} <BiSend className="text-xl"/></span>}
            </button>
          </form>

         <div className="flex flex-col gap-5 flex-1 w-full">
            <div className="flex justify-between items-center text-white px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-green-400">⚡</span> {t('submitted_assignments')}
              </h2>
              <span className="text-indigo-300 font-semibold text-sm">{t('total_label')}: {myAssignments.length}</span>
            </div>

              {
                fetching && myAssignments.length === 0 ? <h1 className="text-2xl text-white text-center pt-28">{t('loading')}</h1> :
                myAssignments.length === 0 ? <h1 className="text-slate-400 text-center pt-28 text-2xl">{t('no_assignments_yet')}</h1> :
            (
              <div className="flex flex-col gap-4">
                <div 
                  id="assignmentContainer" 
                  className={`flex flex-col gap-4 transition-all duration-300 ${showAll ? 'max-h-[460px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                  
                  {displayedAssignments.map((item, index) => (
                    <div 
                      key={item.id} 
                      onClick={() => navigate(`/teacher-assignment/${item.id}`)}
                      className="relative bg-[#08133d] border border-indigo-900/50 p-6 rounded-2xl flex items-center justify-between shadow-xl shrink-0 overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer">
                      
                      <div className={`absolute left-0 top-0 bottom-0 w-2 ${index % 2 === 0 ? 'bg-gradient-to-b from-blue-500 to-indigo-600' : 'bg-gradient-to-b from-purple-500 to-pink-600'}`} />

                      <div className="flex flex-col gap-2 pl-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-bold text-lg truncate">{item.assignment}</h3>
                          {item.courseName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 shrink-0">
                              {item.courseName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-indigo-300 text-sm">
                          <BiCalendar className="text-lg text-indigo-400 shrink-0" />
                          <span>{item.deadline || t('not_set')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] tracking-wider text-indigo-400 font-semibold">{t('submissions_label')}</span>
                          <span className="text-white font-bold">
                            {Array.isArray(item.submissions) ? item.submissions.length : 0}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteAssignment(item.id)
                            }}
                            disabled={deletingId === item.id}
                            className="w-10 h-10 rounded-xl bg-red-950/40 hover:bg-red-600 transition-all flex items-center justify-center text-red-400 hover:text-white shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            title={t('delete')}>
                            {deletingId === item.id ? <CgSpinner className="animate-spin text-lg" /> : <FiTrash2 className="text-lg" />}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/teacher-assignment/${item.id}`)
                            }}
                            className="w-10 h-10 rounded-xl bg-[#0e1b52] hover:bg-indigo-600 transition-all flex items-center justify-center text-white shadow-md cursor-pointer">
                            <IoChevronForward className="text-lg" />
                          </button>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>

                {myAssignments.length > 3 && (
                  <button 
                    onClick={() => setShowAll(!showAll)}
                    className="self-center mt-2 px-6 py-2.5 rounded-xl bg-[#08133d] border border-indigo-900 text-indigo-300 hover:text-white hover:border-indigo-500 transition-all font-semibold text-sm cursor-pointer shadow-md">
                    {showAll ? t('show_less') : `${t('view_all')} (${myAssignments.length})`}
                  </button>
                )}
              </div>
            )}
              

         </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard