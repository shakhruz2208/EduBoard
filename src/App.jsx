import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import TeacherProfile from './TeacherComponents/TeacherProfile'
import StudentProfile from './StudentComponents/StudentProfile'
import { AuthProvider } from './Providers/AuthProvider'
import { AssignmentProvider } from './Providers/AssignmentProvider'
import { NotificationProvider } from './Providers/NotificationProvider'
import { LanguageProvider } from './Providers/LanguageProvider'
import AssignmentDetail from './SmallComponents/AssignmentDetail'
import TeacherAssignmentDetail from './SmallComponents/TeacherAssignmentDetail'
import { CourseProvider } from './Providers/CourseProvider'

const Register = lazy(() => import('./components/Register'))
const Login = lazy(() => import('./components/Login'))
const TeacherDashboard = lazy(() => import('./TeacherComponents/TeacherDashboard'))
const StudentDashboard = lazy(() => import('./StudentComponents/StudentDashboard'))
const StudentRating = lazy(() => import('./StudentComponents/StudentRating'))
const TeacherStudents = lazy(() => import('./TeacherComponents/TeacherStudents'))

const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CourseProvider>
        <AssignmentProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Suspense fallback={<div className='text-5xl text-center font-bold pt-55'>Loading...</div>}>
                <Routes>
                  <Route path='/' element={<Navigate to='/register' />} />
                  <Route path='/register' element={<Register />} />
                  <Route path='/login' element={<Login />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path='/teacher-profile' element={<TeacherProfile />} />
                    <Route path='/student-profile' element={<StudentProfile />} />
                    <Route path='/teacher-dashboard' element={<TeacherDashboard />} />
                    <Route path='/student-dashboard' element={<StudentDashboard />} />
                    <Route path='/students-rating' element={<StudentRating />} />
                    <Route path='/teacher-students' element={<TeacherStudents />} />
                    <Route path="/assignment/:id" element={<AssignmentDetail />} />
                    <Route path="/teacher-assignment/:id" element={<TeacherAssignmentDetail />} />
                  </Route>

                  <Route path='*' element={<Navigate to='/' replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </NotificationProvider>
        </AssignmentProvider>
        </CourseProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App