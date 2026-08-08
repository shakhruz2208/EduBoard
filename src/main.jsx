import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.jsx'
import { ToastContainer } from 'react-toastify'
import { AssignmentProvider } from './Providers/AssignmentProvider.jsx'
import { AvatarProvider } from './Providers/AvatarProvider.jsx'
import { AuthProvider } from './Providers/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
<AuthProvider>
      <AssignmentProvider>
      <AvatarProvider>
        <App />
    <ToastContainer/>
      </AvatarProvider>
    </AssignmentProvider>
</AuthProvider>
  </StrictMode>,
)
