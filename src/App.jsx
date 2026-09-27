import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import ProtectedRoute from './components/ProtectedRoute'
import TeacherProfile from './TeacherComponents/TeacherProfile'
import StudentProfile from './StudentComponents/StudentProfile'
import { AuthProvider } from './Providers/AuthProvider'
import { AssignmentProvider } from './Providers/AssignmentProvider'
import { NotificationProvider } from './Providers/NotificationProvider'
import { LanguageProvider } from './Providers/LanguageProvider'
import { ThemeProvider } from './Providers/ThemeProvider'
import { CourseProvider } from './Providers/CourseProvider'
import { ArchiveProvider } from './Providers/ArchiveProvider'
import AssignmentDetail from './SmallComponents/AssignmentDetail'
import TeacherAssignmentDetail from './SmallComponents/TeacherAssignmentDetail'

const Register = lazy(() => import('./components/Register'))
const Login = lazy(() => import('./components/Login'))
const TeacherDashboard = lazy(() => import('./TeacherComponents/TeacherDashboard'))
const StudentDashboard = lazy(() => import('./StudentComponents/StudentDashboard'))
const StudentRating = lazy(() => import('./StudentComponents/StudentRating'))
const StudentLessons = lazy(() => import('./StudentComponents/StudentLessons'))
const TeacherStudents = lazy(() => import('./TeacherComponents/TeacherStudents'))
const TeacherRating = lazy(() => import('./TeacherComponents/TeacherRating'))
const TeacherArchive = lazy(() => import('./TeacherComponents/TeacherArchive'))
const TeacherCourse = lazy(() => import('./TeacherComponents/TeacherCourse'))
const TeacherGrades = lazy(() => import('./TeacherComponents/TeacherGrades'))
const StudentGrades = lazy(() => import('./StudentComponents/StudentGrades'))

// Fades+rises the whole page in on every route change.
// Keying by pathname remounts the wrapper so each navigation re-animates.
const PageFade = ({ children }) => {
  const location = useLocation()
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
        <CourseProvider>
          <ArchiveProvider>
          <AssignmentProvider>
            <NotificationProvider>
              <BrowserRouter>
                <Suspense fallback={<div className='min-h-screen w-full bg-[#03071e] flex items-center justify-center'><div className='flex flex-col items-center gap-4'><div className='w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin'></div><p className='text-indigo-300 text-sm font-semibold tracking-wide'>Loading...</p></div></div>}>
                  <PageFade>
                    <Routes>
                    <Route path='/' element={<Navigate to='/register' />} />
                    <Route path='/register' element={<Register />} />
                    <Route path='/login' element={<Login />} />

                    <Route element={<ProtectedRoute />}>
                      <Route path='/teacher-course' element={<TeacherCourse />} />
                      <Route path='/teacher-profile' element={<TeacherProfile />} />
                      <Route path='/student-profile' element={<StudentProfile />} />
                      <Route path='/teacher-dashboard' element={<TeacherDashboard />} />
                      <Route path='/student-dashboard' element={<StudentDashboard />} />
                      <Route path='/student-lessons' element={<StudentLessons />} />
                      <Route path='/students-rating' element={<StudentRating />} />
                      <Route path='/teacher-students' element={<TeacherStudents />} />
                      <Route path='/teacher-rating' element={<TeacherRating />} />
                      <Route path='/teacher-archive' element={<TeacherArchive />} />
                      <Route path="/assignment/:id" element={<AssignmentDetail />} />
                      <Route path="/teacher-assignment/:id" element={<TeacherAssignmentDetail />} />
                      <Route path="/teacher-grades" element={<TeacherGrades />} />
                      <Route path="/student-grades" element={<StudentGrades />} />
                    </Route>

                    <Route path='*' element={<Navigate to='/' replace />} />
                    </Routes>
                  </PageFade>
                </Suspense>
              </BrowserRouter>
            </NotificationProvider>
          </AssignmentProvider>
          </ArchiveProvider>
        </CourseProvider>
      </AuthProvider>
    </LanguageProvider>
    </ThemeProvider>
  )
}

export default App