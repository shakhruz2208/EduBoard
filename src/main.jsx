import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.jsx'
import { ToastContainer } from 'react-toastify'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={3000}
      theme="dark"
      toastClassName="!bg-[#0e1442] !text-white !border !border-indigo-900/40 !rounded-xl !shadow-lg"
      bodyClassName="!text-sm !text-white"
      progressClassName="!bg-indigo-500"
    />
  </StrictMode>,
)
