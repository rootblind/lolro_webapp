import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router'
import {Toaster} from 'react-hot-toast'
import { SessionContextProvider } from './context/SessionContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <SessionContextProvider>
      <App />
    </SessionContextProvider>
      <Toaster/>
    </BrowserRouter>
  </StrictMode>,
)
