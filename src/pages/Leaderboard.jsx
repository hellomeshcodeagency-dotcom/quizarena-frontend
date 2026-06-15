// Leaderboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameAPI } from '../services/api'
import useAuthStore from '../context/authStore'
import { Brand, Tag, Button } from '../components/ui'

export default function Leaderboard() {
  const navigate = useNavigate()
  const user     = useAuthStore(s => s.user)
  const [lb,       setLb]       = useState([])
  const [userRank, setUserRank] = useState(null)
  const [period,   setPeriod]   = useState('weekly')

  useEffect(() => {
    gameAPI.leaderboard({ period })
      .then(r => { setLb(r.data.leaderboard); setUserRank(r.data.userRank) })
      .catch(() => {})
  }, [period])

  return (
    <>
      <div className="topbar">
        <Brand />
        <Tag variant="muted">Week 24</Tag>
      </div>

      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: '10px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Weekly rankings</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>Sponsored by PalmPay</div>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {['weekly', 'monthly', 'alltime'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 4,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: period === p ? 'var(--blue)' : 'var(--surface2)',
                color: period === p ? '#fff' : 'var(--muted2)',
                border: `1px solid ${period === p ? 'var(--blue)' : 'var(--line)'}`,
              }}
            >
              {p === 'alltime' ? 'All time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {lb.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>≡</div>
            No rankings yet. Play to appear here.
          </div>
        ) : (
          lb.map((player, i) => (
            <div
              key={player.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px', borderBottom: '1px solid var(--line)',
                background: player.id === user?.id ? 'var(--blue-dim)' : 'transparent',
              }}
            >
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, width: 28, color: i < 3 ? 'var(--amber)' : 'var(--muted)', textAlign: 'right' }}>
                {player.rank || i + 1}
              </span>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-dim)', border: '1px solid var(--blue-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>
                {player.avatar_initials || player.username?.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {player.username} {player.id === user?.id ? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(you)</span> : ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {player.total_wins || 0} wins · {player.accuracy_pct || 0}% accuracy
                </div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--amber)', whiteSpace: 'nowrap' }}>
                ₦{((player.total_earned_kobo || 0) / 100).toLocaleString()}
              </div>
            </div>
          ))
        )}

        {userRank && (
          <div style={{ padding: '16px 20px', textAlign: 'center', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
              You are ranked <span style={{ color: 'var(--text)', fontWeight: 700 }}>#{userRank}</span> globally
            </div>
            <Button variant="primary" size="sm" onClick={() => navigate('/lobby')}>Play to climb</Button>
          </div>
        )}
      </div>
    </>
  )
}
