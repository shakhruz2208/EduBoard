import { Navigate, Outlet } from 'react-router-dom'
import Header from '../SmallComponents/Header'
import { useAuth } from '../Providers/AuthProvider'
import { CgSpinner } from 'react-icons/cg'

const ProtectedRoute = () => {
  const { isAuth, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className='min-h-screen w-full bg-[#03071e] flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <CgSpinner className='animate-spin text-indigo-500 text-4xl' />
          <p className='text-indigo-300 text-sm font-semibold tracking-wide'>Loading...</p>
        </div>
      </div>
    )
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