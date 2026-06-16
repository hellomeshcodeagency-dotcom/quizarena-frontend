import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/dashboard',   icon: '⌂',  label: 'Home'    },
  { path: '/lobby',       icon: '▶',  label: 'Play'    },
  { path: '/tournaments', icon: '🏆', label: 'Compete' },
  { path: '/leaderboard', icon: '≡',  label: 'Ranks'   },
  { path: '/vip',         icon: '◈',  label: 'VIP'     },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ paddingBottom: 64 }}>
        <Outlet />
      </div>
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              className={`nav-btn ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
