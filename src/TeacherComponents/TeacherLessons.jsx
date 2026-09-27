
import { useEffect, useState, useCallback } from 'react'
import { CgSpinner } from 'react-icons/cg'
import { IoAdd, IoBookOutline } from 'react-icons/io5'
import { toast } from 'react-toastify'
import api from '../api'
import { useCourses } from '../Providers/CourseProvider'
import { useLanguage } from '../Providers/LanguageProvider'
import { normalizeActivityList } from '../utils/backend'
import { createActivity, notifyGroupAssignment } from '../utils/activities'

const TeacherLessons = () => {
  const { courses, groupMembers, fetchGroupMembers } = useCourses()
  const { t } = useLanguage()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [lessons, setLessons] = useState([])
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [activities, setActivities] = useState([])
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [activityKind, setActivityKind] = useState('homework')
  const [activityTitle, setActivityTitle] = useState('')
  const [activityDescription, setActivityDescription] = useState('')
  const [activityDeadline, setActivityDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadLessons = useCallback(async (courseId) => {
    if (!courseId) return
    setLoading(true)
    try {
      const response = await api.get(`/groups/${courseId}/lessons`)
      const items = Array.isArray(response.data) ? response.data : response.data?.items || []
      setLessons(items)
      setSelectedLesson(null)
      setActivities([])
      if (!groupMembers[courseId]) fetchGroupMembers(courseId)
    } catch (error) {
      console.error(`❌ Error loading lessons for course ${courseId}:`, error?.response?.data)
      toast.error('Error loading lessons')
    } finally {
      setLoading(false)
    }
  }, [groupMembers, fetchGroupMembers])

  useEffect(() => { 
    if (selectedCourse) {
      loadLessons(selectedCourse)
    }
  }, [selectedCourse, loadLessons])

  const openLesson = async (lesson) => {
    setSelectedLesson(lesson)
    try {
      const response = await api.get(`/lessons/${lesson.id}/activities`)
      // Backend may return activity_type or kind — normalize in one place
      const activities = normalizeActivityList(response.data, { lessonId: lesson.id })
      setActivities(activities)
    } catch (error) {
      console.error(`❌ Error loading activities for lesson ${lesson.id}:`, error?.response?.data)
      setActivities([])
    }
  }

  const createLesson = async (event) => {
    event.preventDefault()
    if (!selectedCourse || !lessonTitle.trim()) return
    try {
      setSaving(true)
      const payload = {
        title: lessonTitle.trim(),
        description: lessonDescription.trim() || null
      }
      const response = await api.post(`/groups/${selectedCourse}/lessons`, payload)
      setLessons((previous) => [response.data, ...previous])
      setLessonTitle(''); setLessonDescription('')
      toast.success(t('lesson_saved'))
    } catch (error) {
      console.error('❌ Error creating lesson:', {
        message: error?.message,
        status: error?.response?.status,
        detail: error?.response?.data?.detail,
        fullResponse: error?.response?.data
      })
      toast.error(error?.response?.data?.detail || 'Error creating lesson')
    }
    finally { setSaving(false) }
  }

  const addActivity = async (event) => {
    event.preventDefault()
    if (!selectedLesson || !activityTitle.trim()) return
    try {
      setSaving(true)
      // Shared service: gradable kinds are mirrored into a real object so
      // students actually receive the assignment and can submit against it.
      const created = await createActivity({
        lessonId: selectedLesson.id,
        kind: activityKind,
        title: activityTitle.trim(),
        description: activityDescription.trim() || null,
        deadline: activityDeadline || null,
        courseName: courses.find((c) => String(c.id) === String(selectedCourse))?.name || '',
        courseId: selectedCourse,
      })
      setActivities((previous) => [...previous, created])
      setActivityTitle(''); setActivityDescription(''); setActivityDeadline('')
      toast.success(t('activity_saved'))
      // Tell the whole course about the new assignment — non-fatal.
      if (created.objectId && selectedCourse) {
        notifyGroupAssignment(selectedCourse, created.title, created.kind)
      }
    } catch (error) {
      console.error('❌ Error adding activity:', {
        message: error?.message,
        status: error?.response?.status,
        detail: error?.response?.data?.detail,
        fullResponse: error?.response?.data
      })
      toast.error(error?.response?.data?.detail || 'Error adding activity')
    }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-[#03071e] text-white px-5 py-7 sm:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8"><p className="text-xs uppercase tracking-[0.25em] text-lime-300 font-bold">{t('nav_lessons')}</p><h1 className="text-3xl sm:text-5xl font-extrabold mt-2">{t('lessons_title')}</h1><p className="text-indigo-300 mt-2">{t('lessons_subtitle')}</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
          <div className="bg-[#08133d] border border-indigo-900/50 rounded-2xl p-5">
            <label className="text-xs text-indigo-300 font-bold">{t('all_courses')}</label>
            <select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)} className="w-full mt-2 rounded-xl bg-[#090b79] border border-indigo-700/60 p-3 text-sm outline-none cursor-pointer"><option value="">{t('select_course')}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
            <form onSubmit={createLesson} className="mt-6 border-t border-indigo-900/50 pt-5 flex flex-col gap-3">
              <h2 className="font-bold text-white flex items-center gap-2"><IoBookOutline className="text-lime-300" /> {t('create_lesson')}</h2>
              <input value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} placeholder={t('lesson_title')} required className="rounded-xl bg-[#030712] border border-slate-800 p-3 text-sm outline-none focus:border-lime-400" />
              <textarea value={lessonDescription} onChange={(event) => setLessonDescription(event.target.value)} placeholder={t('description_optional')} rows={3} className="rounded-xl bg-[#030712] border border-slate-800 p-3 text-sm outline-none focus:border-lime-400 resize-none" />
              <button disabled={saving || !selectedCourse} className="rounded-xl bg-lime-400 text-black p-3 font-bold disabled:opacity-50 cursor-pointer">{saving ? <CgSpinner className="mx-auto animate-spin" /> : <><IoAdd className="inline" /> {t('create_lesson')}</>}</button>
            </form>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <section className="bg-[#08133d] border border-indigo-900/50 rounded-2xl p-5 max-h-96 overflow-y-auto flex flex-col"><h2 className="font-bold text-lg mb-4 shrink-0">{t('recent_lessons')}</h2>{loading ? <CgSpinner className="animate-spin text-lime-300" /> : lessons.length === 0 ? <p className="text-slate-500">{t('no_lessons')}</p> : <div className="flex flex-col gap-2 overflow-y-auto">{lessons.map((lesson) => <button key={lesson.id} onClick={() => openLesson(lesson)} className={`text-left rounded-xl border p-4 cursor-pointer transition-colors shrink-0 ${selectedLesson?.id === lesson.id ? 'border-lime-400 bg-lime-400/10' : 'border-indigo-900/50 bg-[#0e1442] hover:border-indigo-500'}`}><p className="font-semibold">{lesson.title}</p><p className="text-xs text-slate-400 mt-1">{lesson.description || t('lesson_content_hint')}</p></button>)}</div>}</section>
            <section className="bg-[#08133d] border border-indigo-900/50 rounded-2xl p-5 min-h-96">{selectedLesson ? <><h2 className="font-bold text-lg">{selectedLesson.title}</h2><p className="text-indigo-300 text-xs mt-1">{t('lesson_activities')}</p><div className="mt-4 flex flex-col gap-2">{activities.map((activity) => <div key={activity.id} className="rounded-xl bg-[#0e1442] border border-indigo-900/50 p-3"><div className="flex justify-between gap-3"><span className="font-semibold text-sm">{activity.title}</span><span className="text-[10px] uppercase text-lime-300">{t(`activity_${activity.kind}`)}</span></div>{activity.description && <p className="text-xs text-slate-400 mt-1">{activity.description}</p>}</div>)}</div><form onSubmit={addActivity} className="mt-5 border-t border-indigo-900/50 pt-4 flex flex-col gap-3"><select value={activityKind} onChange={(event) => setActivityKind(event.target.value)} className="rounded-xl bg-[#090b79] p-3 text-sm"><option value="homework">{t('activity_homework')}</option><option value="exam">{t('activity_exam')}</option><option value="quiz">{t('activity_quiz')}</option><option value="materials">{t('activity_materials')}</option></select><input value={activityTitle} onChange={(event) => setActivityTitle(event.target.value)} placeholder={t('activity_title')} required className="rounded-xl bg-[#030712] border border-slate-800 p-3 text-sm" /><textarea value={activityDescription} onChange={(event) => setActivityDescription(event.target.value)} placeholder={t('instructions_optional')} rows={2} className="rounded-xl bg-[#030712] border border-slate-800 p-3 text-sm resize-none" /><input type="datetime-local" value={activityDeadline} onChange={(event) => setActivityDeadline(event.target.value)} className="rounded-xl bg-[#030712] border border-slate-800 p-3 text-sm scheme-dark" /><button disabled={saving} className="rounded-xl bg-indigo-600 p-3 font-bold cursor-pointer disabled:opacity-50">{saving ? <CgSpinner className="mx-auto animate-spin" /> : t('add_activity')}</button></form></> : <div className="h-full flex flex-col items-center justify-center text-center text-slate-500"><IoBookOutline className="text-5xl text-indigo-500 mb-3" /><p>{t('select_lesson')}</p></div>}</section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherLessons
