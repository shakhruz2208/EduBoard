import { useEffect, useState } from 'react'
import { CgSpinner } from 'react-icons/cg'
import { IoBookOutline } from 'react-icons/io5'
import api from '../api'
import { useCourses } from '../Providers/CourseProvider'
import { useLanguage } from '../Providers/LanguageProvider'
import { normalizeActivityList } from '../utils/backend'
import { formatDate } from '../utils/datetime'

const StudentLessons = () => {
  const { courses, myGroup: myGroupObj } = useCourses()
  const { t } = useLanguage()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [lessons, setLessons] = useState([])
  const [activities, setActivities] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedCourse) {
      const first = courses[0] || myGroupObj
      if (first) setSelectedCourse(String(first.id))
    }
  }, [courses, myGroupObj, selectedCourse])

  useEffect(() => {
    if (!selectedCourse) return
    let cancelled = false
    setLoading(true)
    api.get(`/groups/${selectedCourse}/lessons`)
      .then(async (response) => {
        if (cancelled) return
        const items = Array.isArray(response.data) ? response.data : response.data?.items || []
        setLessons(items)
        const results = await Promise.allSettled(items.map((lesson) => api.get(`/lessons/${lesson.id}/activities`)))
        const next = {}
        results.forEach((result, index) => {
          if (result.status !== 'fulfilled') return
          // Backend may return activity_type or kind — normalize in one place
          next[items[index].id] = normalizeActivityList(result.value.data, { lessonId: items[index].id })
        })
        if (!cancelled) setActivities(next)
      })
      .catch(() => { if (!cancelled) { setLessons([]); setActivities({}) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedCourse])

  return (
    <div className="min-h-screen bg-[#03071e] text-white px-5 py-7 sm:px-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8"><p className="text-xs uppercase tracking-[0.25em] text-lime-300 font-bold">{t('nav_lessons')}</p><h1 className="text-3xl sm:text-5xl font-extrabold mt-2">{t('lessons_title')}</h1><p className="text-indigo-300 mt-2">{t('lesson_content_hint')}</p></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"><select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)} className="rounded-xl bg-[#0d174b] border border-indigo-700/60 p-3 text-sm outline-none cursor-pointer"><option value="">{t('select_course')}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></div>
        {loading ? <div className="py-20 flex justify-center"><CgSpinner className="animate-spin text-lime-300 text-3xl" /></div> : lessons.length === 0 ? <div className="rounded-2xl border border-indigo-900/50 bg-[#08133d] py-20 text-center text-slate-400"><IoBookOutline className="text-5xl mx-auto mb-3 text-indigo-500" />{t('no_lessons_for_student')}</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{lessons.map((lesson) => <article key={lesson.id} className="rounded-2xl border border-indigo-900/50 bg-[#08133d] p-5"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0"><IoBookOutline className="text-indigo-300" /></div><div><h2 className="font-bold text-lg">{lesson.title}</h2><p className="text-xs text-slate-400 mt-1">{lesson.description || t('lesson_content_hint')}</p></div></div><div className="mt-5 flex flex-col gap-2">{(activities[lesson.id] || []).length === 0 ? <p className="text-xs text-slate-500">{t('no_activities')}</p> : (activities[lesson.id] || []).map((activity) => <div key={activity.id} className="rounded-xl bg-[#0e1442] border border-indigo-900/50 p-3"><div className="flex justify-between gap-3"><span className="font-semibold text-sm">{activity.title}</span><span className="text-[10px] uppercase text-lime-300">{t(`activity_${activity.kind}`)}</span></div>{activity.description && <p className="text-xs text-slate-400 mt-1">{activity.description}</p>}{activity.deadline && <p className="text-xs text-amber-300 mt-2">{t('activity_deadline')}: {formatDate(activity.deadline)}</p>}{activity.kind === 'materials' && activity.url && <a href={activity.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-300 hover:text-indigo-200 underline mt-2 inline-block">{t('open_link')}</a>}</div>)}</div></article>)}</div>}
      </div>
    </div>
  )
}

export default StudentLessons
