import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.jsx'
import { ToastContainer } from 'react-toastify'
import { AssignmentProvider } from './SmallComponents/AssignmentProvider.jsx'
import { AvatarProvider } from './SmallComponents/AvatarProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AssignmentProvider>
      <AvatarProvider>
        <App />
    <ToastContainer/>
      </AvatarProvider>
    </AssignmentProvider>
  </StrictMode>,
)
