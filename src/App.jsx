import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './context/authStore'
import './styles/global.css'

// Pages
import { Landing, Referral, Coins, Practice, NotFound } from './pages/OtherPages'
import Login       from './pages/Login'
import Register    from './pages/Register'
import Dashboard   from './pages/Dashboard'
import Lobby       from './pages/Lobby'
import Game        from './pages/Game'
import Results     from './pages/Results'
import Tournaments from './pages/Tournaments'
import Leaderboard from './pages/Leaderboard'
import Wallet      from './pages/Wallet'
import Vip         from './pages/Vip'
import GamesHub    from './pages/GamesHub'

// Game pages
import TicTacToe   from './pages/games/TicTacToe'
import WordScramble from './pages/games/WordScramble'
import { MemoryMatch, SpeedMath } from './pages/games/MemoryAndMath'
import Chess        from './pages/games/Chess'

// Layout
import AppLayout   from './components/layout/AppLayout'

const Protected = ({ children }) => {
  const user    = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user)   return <Navigate to="/login" replace />
  return children
}

const Guest = ({ children }) => {
  const user    = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
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
            background: '#181830', color: '#F0F0FF',
            border: '1px solid #2A2A50', borderRadius: '10px',
            fontSize: '14px', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          },
          success: { iconTheme: { primary: '#00D4AA', secondary: '#080810' } },
          error:   { iconTheme: { primary: '#FF4757', secondary: '#080810' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Guest><Landing /></Guest>} />
        <Route path="/login"    element={<Guest><Login /></Guest>} />
        <Route path="/register" element={<Guest><Register /></Guest>} />

        {/* Protected with nav */}
        <Route element={<Protected><AppLayout /></Protected>}>
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/games"       element={<GamesHub />} />
          <Route path="/lobby"       element={<Lobby />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/wallet"      element={<Wallet />} />
          <Route path="/vip"         element={<Vip />} />
          <Route path="/referral"    element={<Referral />} />
          <Route path="/coins"       element={<Coins />} />
          <Route path="/practice"    element={<Practice />} />
        </Route>

        {/* Game screens — no nav */}
        <Route path="/game/:roomId"           element={<Protected><Game /></Protected>} />
        <Route path="/games/tictactoe/:roomId" element={<Protected><TicTacToe /></Protected>} />
        <Route path="/games/word/:roomId"      element={<Protected><WordScramble /></Protected>} />
        <Route path="/games/memory/:roomId"    element={<Protected><MemoryMatch /></Protected>} />
        <Route path="/games/speedmath/:roomId" element={<Protected><SpeedMath /></Protected>} />
        <Route path="/games/chess/:roomId"     element={<Protected><Chess /></Protected>} />
        <Route path="/results"                 element={<Protected><Results /></Protected>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
