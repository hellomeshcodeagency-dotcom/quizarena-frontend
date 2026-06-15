import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/dashboard',   icon: '⌂',  label: 'Home'    },
  { path: '/lobby',       icon: '▷',  label: 'Play'    },
  { path: '/tournaments', icon: '◉',  label: 'Compete' },
  { path: '/leaderboard', icon: '≡',  label: 'Ranks'   },
  { path: '/vip',         icon: '◈',  label: 'VIP'     },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, paddingBottom: 60 }}>
        <Outlet />
      </div>
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-btn-icon">{item.icon}</span>
            <span>{item.label}</span>
            <span className="nav-btn-dot" />
          </button>
        ))}
      </nav>
    </div>
  )
}
