import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router'
import {Toaster} from 'react-hot-toast'
import { SessionContextProvider } from './context/SessionContext'

const container = document.getElementById('root');
if(!container) {
  throw new Error("Root container not found");
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <SessionContextProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            className:
              "bg-base-200 text-base-content border border-base-300 shadow-lg rounded-xl",
          }}
        />
      </BrowserRouter>
    </SessionContextProvider>
  </StrictMode>,
)
