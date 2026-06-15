import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './context/authStore'
import './styles/global.css'

import { Landing }    from './pages/OtherPages'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import Lobby          from './pages/Lobby'
import Game           from './pages/Game'
import Results        from './pages/Results'
import Tournaments    from './pages/Tournaments'
import Leaderboard    from './pages/Leaderboard'
import Wallet         from './pages/Wallet'
import Vip            from './pages/Vip'
import { Referral, Coins, Practice, NotFound } from './pages/OtherPages'
import AppLayout      from './components/layout/AppLayout'

const Protected = ({ children }) => {
  const user    = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)
  if (loading) return <div className="loading-screen"><div className="spinner"/></div>
  if (!user)   return <Navigate to="/login" replace />
  return children
}

const Guest = ({ children }) => {
  const user    = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)
  if (loading) return <div className="loading-screen"><div className="spinner"/></div>
  if (user)    return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1A1A24', color: '#F1F1F5',
            border: '1px solid #252532', borderRadius: '8px',
            fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#0A0A0F' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#0A0A0F' } },
        }}
      />
      <Routes>
        <Route path="/"         element={<Guest><Landing/></Guest>} />
        <Route path="/login"    element={<Guest><Login/></Guest>} />
        <Route path="/register" element={<Guest><Register/></Guest>} />

        <Route element={<Protected><AppLayout/></Protected>}>
          <Route path="/dashboard"   element={<Dashboard/>} />
          <Route path="/lobby"       element={<Lobby/>} />
          <Route path="/tournaments" element={<Tournaments/>} />
          <Route path="/leaderboard" element={<Leaderboard/>} />
          <Route path="/wallet"      element={<Wallet/>} />
          <Route path="/vip"         element={<Vip/>} />
          <Route path="/referral"    element={<Referral/>} />
          <Route path="/coins"       element={<Coins/>} />
          <Route path="/practice"    element={<Practice/>} />
        </Route>

        <Route path="/game/:roomId" element={<Protected><Game/></Protected>} />
        <Route path="/results"      element={<Protected><Results/></Protected>} />
        <Route path="*"             element={<NotFound/>} />
      </Routes>
    </BrowserRouter>
  )
}
