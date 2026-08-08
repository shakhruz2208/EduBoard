import { Navigate, Outlet } from 'react-router-dom'
import Header from '../SmallComponents/Header'
import { useAuth } from '../Providers/AuthProvider'

const ProtectedRoute = () => {
  const { isAuth, authLoading } = useAuth()


  if (authLoading) {
    return <div className='text-3xl text-center font-bold text-white pt-40'>Loading...</div>
  }

  if (!isAuth) {
    return <Navigate to='/login' replace />
  }

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default ProtectedRoute