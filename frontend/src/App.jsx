import { Route, Routes } from 'react-router'
import HomePage from './pages/HomePage'
import toast from 'react-hot-toast'
import NotFound404 from './components/PageNotFound'
import MainLayout from './layouts/MainLayout'
import PrivacyPolicy from "./pages/PrivacyPolicy"
import Tos from './pages/Tos'
import VerifyPage from "./pages/VerifyPage"

const App = () => {
  return (
    <div className="relative h-full w-full bg-slate-950">
      <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]" />
      <Routes>
        <Route path="/" element={<MainLayout> <HomePage /> </MainLayout>} />
        <Route path="/privacy" element={<MainLayout> <PrivacyPolicy /> </MainLayout>}/>
        <Route path="/terms" element={<MainLayout> <Tos /> </MainLayout>} />
        <Route path="/verify" element={<VerifyPage />} />

        <Route path="*" element={<NotFound404 />} />
      </Routes>
    </div>
  )
}

export default App