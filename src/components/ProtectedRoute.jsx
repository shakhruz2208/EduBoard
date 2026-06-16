
import { Navigate, Outlet } from 'react-router-dom'
import Header from '../SmallComponents/Header'

const ProtectedRoute = ({isAuth}) => {
    if (!isAuth) {
      return  <Navigate to='/register' replace/>
    }
    return (
      <>
       <Header/>
        <main>
          <Outlet/>
        </main>
      </>
    )
}

export default ProtectedRoute
