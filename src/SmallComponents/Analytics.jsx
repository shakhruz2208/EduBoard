import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { useLanguage } from '../Providers/LanguageProvider'
import { parseServerDate } from '../utils/datetime'

/* Theme-aware tokens — follow the CSS variables so charts
   automatically match dark / light mode. */
const AXIS = 'var(--c-muted)'
const GRID = 'var(--c-border)'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--c-input)',
  border: '1px solid var(--c-border)',
  borderRadius: 12,
  fontSize: 12,
  padding: '8px 12px',
}

const ACCENTS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#84cc16']

const bucketColor = (bucket) => {
  if (bucket === '90+') return '#10b981'
  if (bucket === '70-89') return '#84cc16'
  if (bucket === '50-69') return '#f59e0b'
  return '#ef4444'
}

const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`bg-[#0b153f] border border-indigo-800/50 rounded-2xl p-5 ${className}`}>
    <div className='mb-4'>
      <h3 className='text-white font-bold text-sm sm:text-base'>{title}</h3>
      {subtitle && <p className='text-indigo-300/60 text-[11px] mt-0.5'>{subtitle}</p>}
    </div>
    {children}
  </div>
)

const EmptyChart = ({ height = 220 }) => (
  <div className='flex items-center justify-center text-slate-500 text-sm' style={{ height }}>
    {useLanguage().t('chart_empty')}
  </div>
)

/* ═══════════════════════════════════════════════════════════════
   TEACHER — per-course averages + review status donut
   ═══════════════════════════════════════════════════════════════ */
export const TeacherAnalytics = ({ courses, assignmentsList, submissions }) => {
  const { t } = useLanguage()

  const avgByCourse = useMemo(() => {
    if (!courses.length || !submissions.length) return []
    const assignmentCourse = new Map()
    assignmentsList.forEach((a) => {
      if (a.group_id != null) assignmentCourse.set(String(a.id), a.group_id)
    })
    return courses.map((course, i) => {
      const subs = submissions.filter(
        (s) => String(assignmentCourse.get(String(s.assignmentId))) === String(course.id)
      )
      const graded = subs.filter((s) => s.grade !== null && s.grade !== undefined && s.grade !== '')
      const avg = graded.length
        ? Math.round(graded.reduce((sum, s) => sum + Number(s.grade), 0) / graded.length)
        : 0
      return {
        name: course.name?.length > 10 ? `${course.name.slice(0, 9)}…` : course.name,
        fullName: course.name,
        avg,
        color: ACCENTS[i % ACCENTS.length],
      }
    })
  }, [courses, assignmentsList, submissions])

  const statusData = useMemo(() => {
    if (!submissions.length) return []
    const graded = submissions.filter((s) => s.grade !== null && s.grade !== undefined && s.grade !== '').length
    return [
      { name: t('graded_word'), value: graded, color: '#10b981' },
      { name: t('awaiting_grade'), value: submissions.length - graded, color: '#f59e0b' },
    ].filter((d) => d.value > 0)
  }, [submissions, t])

  const hasCourseData = avgByCourse.some((c) => c.avg > 0)

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
      <ChartCard
        title={t('avg_grade_by_course')}
        subtitle={t('analytics_subtitle')}
        className='lg:col-span-2'
      >
        {avgByCourse.length === 0 || !hasCourseData ? (
          <EmptyChart height={200} />
        ) : (
          <ResponsiveContainer width='100%' height={200}>
            <BarChart data={avgByCourse} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={GRID} strokeDasharray='3 3' vertical={false} />
              <XAxis
                dataKey='name'
                tick={{ fill: AXIS, fontSize: 11 }}
                axisLine={{ stroke: GRID }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: AXIS, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: 'var(--c-text)', fontWeight: 700, marginBottom: 4 }}
                itemStyle={{ color: 'var(--c-muted)' }}
                formatter={(value) => [`${value} / 100`, t('avg_word')]}
              />
              <Bar dataKey='avg' radius={[8, 8, 0, 0]} maxBarSize={42}>
                {avgByCourse.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('submission_status')}>
        {statusData.length === 0 ? (
          <EmptyChart height={200} />
        ) : (
          <div className='flex flex-col items-center'>
            <ResponsiveContainer width='100%' height={170}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey='value'
                  nameKey='name'
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--c-muted)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className='flex items-center gap-4 mt-1'>
              {statusData.map((d, i) => (
                <div key={i} className='flex items-center gap-1.5'>
                  <span className='w-2.5 h-2.5 rounded-full' style={{ backgroundColor: d.color }} />
                  <span className='text-slate-400 text-xs'>
                    {d.name} · <span className='text-white font-bold'>{d.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ChartCard>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STUDENT — grade trend area + distribution bars
   ═══════════════════════════════════════════════════════════════ */
export const StudentGradeCharts = ({ gradesWithAssignment }) => {
  const { t } = useLanguage()

  const graded = useMemo(
    () =>
      gradesWithAssignment.filter(
        (g) => g.grade !== null && g.grade !== undefined && g.grade !== ''
      ),
    [gradesWithAssignment]
  )

  const trendData = useMemo(() => {
    return [...graded]
      .sort((a, b) => parseServerDate(a.gradedAt || a.submittedAt || 0) - parseServerDate(b.gradedAt || b.submittedAt || 0))
      .map((g, i) => {
        const d = parseServerDate(g.gradedAt || g.submittedAt || 0)
        const label = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
        return { name: `${label} #${i + 1}`, grade: Number(g.grade) }
      })
  }, [graded])

  const distribution = useMemo(() => {
    const buckets = [
      { name: '90+', count: 0 },
      { name: '70-89', count: 0 },
      { name: '50-69', count: 0 },
      { name: '<50', count: 0 },
    ]
    graded.forEach((g) => {
      const v = Number(g.grade)
      if (v >= 90) buckets[0].count += 1
      else if (v >= 70) buckets[1].count += 1
      else if (v >= 50) buckets[2].count += 1
      else buckets[3].count += 1
    })
    return buckets
  }, [graded])

  const hasAny = graded.length > 0

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8'>
      <ChartCard title={t('grade_trend')} className='lg:col-span-2'>
        {!hasAny ? (
          <EmptyChart height={200} />
        ) : (
          <ResponsiveContainer width='100%' height={200}>
            <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id='gradeFill' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='#6366f1' stopOpacity={0.45} />
                  <stop offset='100%' stopColor='#6366f1' stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='name' tick={{ fill: AXIS, fontSize: 10 }} axisLine={{ stroke: GRID }} tickLine={false} interval='preserveStartEnd' />
              <YAxis domain={[0, 100]} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: 'var(--c-text)', fontWeight: 700, marginBottom: 4 }}
                itemStyle={{ color: 'var(--c-muted)' }}
                formatter={(value) => [`${value} / 100`, t('nav_grades')]}
              />
              <Area
                type='monotone'
                dataKey='grade'
                stroke='#6366f1'
                strokeWidth={2.5}
                fill='url(#gradeFill)'
                dot={{ r: 3.5, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('grade_distribution')}>
        {!hasAny ? (
          <EmptyChart height={200} />
        ) : (
          <ResponsiveContainer width='100%' height={200}>
            <BarChart data={distribution} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid stroke={GRID} strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='name' tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: 'var(--c-text)', fontWeight: 700, marginBottom: 4 }}
                itemStyle={{ color: 'var(--c-muted)' }}
              />
              <Bar dataKey='count' radius={[8, 8, 0, 0]} maxBarSize={42}>
                {distribution.map((entry, i) => (
                  <Cell key={i} fill={bucketColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}
