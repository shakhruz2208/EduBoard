import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useState, lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherProfile from './TeacherComponents/TeacherProfile';
import StudentProfile from './StudentComponents/StudentProfile';

const Register = lazy(() => import('./components/Register'));
const Login = lazy(() => import('./components/Login'));
const TeacherDashboard = lazy(() => import('./TeacherComponents/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./StudentComponents/StudentDashboard'));
const StudentRating = lazy(() => import('./StudentComponents/StudentRating'));
const TeacherStudents = lazy(() => import('./TeacherComponents/TeacherStudents'));

const App = () => {
  const [isAuth, setIsAuth] = useState(() => {
    return localStorage.getItem('auth') === 'true'
  })

  return (
    <div>
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path='/' element={<Navigate to='/register' />} />
            <Route path='/register' element={<Register setIsAuth={setIsAuth} isAuth={isAuth} />} />
            <Route path='/login' element={<Login setIsAuth={setIsAuth} isAuth={isAuth} />} />
            <Route element={<ProtectedRoute isAuth={isAuth} />}>
              <Route path='/teacher-profile' element={<TeacherProfile setIsAuth = {setIsAuth}/>}/>
              <Route path='/student-profile' element={<StudentProfile setIsAuth = {setIsAuth}/>}/>
              <Route path='/teacher-dashboard' element={<TeacherDashboard setIsAuth={setIsAuth} />} />
              <Route path='/student-dashboard' element={<StudentDashboard setIsAuth={setIsAuth} />} />
              <Route path='/students-rating' element={<StudentRating setIsAuth={setIsAuth} />} />
              <Route path='/teacher-students' element={<TeacherStudents setIsAuth={setIsAuth} />} />
            </Route >
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  )
}

export default App