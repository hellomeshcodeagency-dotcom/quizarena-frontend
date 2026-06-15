import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'
import { gameAPI, adsAPI, walletAPI } from '../services/api'
import { Brand, WalletChip, StatChip, SectionHead, TxRow, Alert, Button } from '../components/ui'
import DepositModal from '../components/game/DepositModal'

const CATEGORIES = [
  { name: 'Sports',           emoji: '⚽' },
  { name: 'Science',          emoji: '🔬' },
  { name: 'Geography',        emoji: '🌍' },
  { name: 'Nollywood',        emoji: '🎬' },
  { name: 'General Knowledge',emoji: '💡' },
  { name: 'Technology',       emoji: '💻' },
]

export default function Dashboard() {
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [stats, setStats]   = useState(null)
  const [txns,  setTxns]    = useState([])
  const [ad,    setAd]      = useState(null)
  const [showDeposit, setShowDeposit] = useState(false)

  useEffect(() => {
    gameAPI.stats().then(r => setStats(r.data.stats)).catch(() => {})
    walletAPI.transactions({ limit: 4 }).then(r => setTxns(r.data.transactions)).catch(() => {})
    adsAPI.get('banner').then(r => setAd(r.data.ads?.[0])).catch(() => {})
  }, [])

  const balanceKobo = user?.balance || 0
  const coins       = user?.coins   || 0

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return  'Good evening'
  }

  return (
    <>
      {/* TOPBAR */}
      <div className="topbar">
        <Brand />
        <div className="flex gap-8">
          <div
            className="tag tag-amber"
            style={{ cursor: 'pointer', fontFamily: 'var(--mono)' }}
            onClick={() => navigate('/coins')}
          >
            ◈ {coins}
          </div>
          <WalletChip balance={balanceKobo} onClick={() => setShowDeposit(true)} />
        </div>
      </div>

      <div className="page">
        {/* HERO */}
        <div style={{ padding: '20px 20px 0', background: 'var(--surface)', borderBottom: '1px solid var(--line)', marginBottom: 0 }}>
          <div className="flex-between" style={{ marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{greeting()}, {user?.username}</div>
              {stats?.win_streak > 0 && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                  Win streak: <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{stats.win_streak} in a row</span>
                </div>
              )}
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--blue)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, fontWeight: 700,
            }}>
              {user?.avatarInitials || user?.username?.substring(0,2).toUpperCase()}
            </div>
          </div>

          {/* BALANCE CARD */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 16, marginBottom: 14 }}>
            <div className="amount-label">Available balance</div>
            <div className="amount-display" style={{ marginBottom: 14 }}>
              ₦{(balanceKobo / 100).toLocaleString()}
            </div>
            <div className="grid2">
              <Button variant="primary" full onClick={() => setShowDeposit(true)}>Deposit</Button>
              <Button variant="outline" full onClick={() => navigate('/wallet')}>Withdraw</Button>
            </div>
          </div>

          {/* MINI STATS */}
          <div className="grid3" style={{ marginBottom: 20 }}>
            <StatChip label="Wins"      value={stats?.total_wins   || 0} color="var(--green)" />
            <StatChip label="Losses"    value={stats?.total_losses || 0} color="var(--red)"   />
            <StatChip label="Total won" value={stats ? '₦' + ((stats.total_earned_kobo||0)/100).toLocaleString() : '₦0'} color="var(--amber)" />
          </div>
        </div>

        {/* LIVE TOURNAMENT ALERT */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
          <div
            className="card2"
            style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => navigate('/tournaments')}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red)', animation: 'blink 1.4s ease infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Grand Saturday Showdown — ₦500,000 prize
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>2,847 players joined · 153 spots left</div>
            </div>
            <Button variant="danger" size="sm" onClick={e => { e.stopPropagation(); navigate('/tournaments') }}>
              Join
            </Button>
          </div>
        </div>

        {/* QUICK PLAY */}
        <div style={{ padding: '20px 20px 0' }}>
          <SectionHead title="Quick play" />
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 20px 16px', scrollbarWidth: 'none' }}>
          {[
            { icon: '⚔', name: '1 vs 1',     stake: 'from ₦100', hot: true  },
            { icon: '⊞', name: 'Group',       stake: 'from ₦200'             },
            { icon: '◉', name: 'Tournament',  stake: 'from ₦500', path: '/tournaments' },
            { icon: '◎', name: 'Practice',    stake: 'free · 5/day', path: '/practice' },
            { icon: '↗', name: 'Refer',       stake: '+100 coins', path: '/referral'  },
          ].map(m => (
            <div
              key={m.name}
              onClick={() => navigate(m.path || '/lobby')}
              style={{
                flexShrink: 0, background: m.hot ? 'var(--blue-dim)' : 'var(--surface)',
                border: `1px solid ${m.hot ? 'var(--blue-mid)' : 'var(--line)'}`,
                borderRadius: 'var(--r)', padding: '12px 16px', cursor: 'pointer',
                minWidth: 110, transition: 'border-color .15s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{m.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)' }}>{m.stake}</div>
            </div>
          ))}
        </div>

        {/* CATEGORIES */}
        <div style={{ padding: '0 20px 16px' }}>
          <SectionHead title="Categories" action="Play" onAction={() => navigate('/lobby')} />
          <div className="grid3">
            {CATEGORIES.map(c => (
              <div
                key={c.name}
                onClick={() => navigate('/lobby', { state: { category: c.name } })}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  borderRadius: 'var(--r)', padding: '12px 8px', textAlign: 'center',
                  cursor: 'pointer', transition: 'border-color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <div style={{ fontSize: 22, marginBottom: 5 }}>{c.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted2)' }}>{c.name}</div>
              </div>
            ))}
            <div
              onClick={() => navigate('/vip')}
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '12px 8px', textAlign: 'center', cursor: 'pointer', opacity: 0.6 }}
            >
              <div style={{ fontSize: 22, marginBottom: 5 }}>🔒</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)' }}>VIP only</div>
            </div>
          </div>
        </div>

        {/* AD BANNER */}
        {ad && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Sponsored by {ad.sponsor}
              </div>
              <div className="flex-between">
                <div style={{ fontSize: 13, fontWeight: 500 }}>{ad.title}</div>
                <a href={ad.cta_url} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="sm">{ad.cta_text || 'Open'}</Button>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* EARN MORE */}
        <div style={{ padding: '0 20px 16px' }}>
          <SectionHead title="All ways to earn" />
          <div className="grid2">
            {[
              { icon: '↗', name: 'Refer friends',  sub: '100 coins per friend who deposits', path: '/referral' },
              { icon: '◈', name: 'Go VIP',          sub: '+10% bonus on every win',           path: '/vip'      },
              { icon: '◎', name: 'Buy coins',        sub: 'Use power-ups to win more',         path: '/coins'    },
              { icon: '◉', name: 'Tournaments',      sub: 'Bigger pools, bigger wins',         path: '/tournaments' },
            ].map(item => (
              <div
                key={item.name}
                onClick={() => navigate(item.path)}
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 14, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--line2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        {txns.length > 0 && (
          <div style={{ padding: '0 20px 16px' }}>
            <SectionHead title="Recent activity" action="See all" onAction={() => navigate('/wallet')} />
            {txns.map(tx => (
              <TxRow
                key={tx.id}
                type={tx.type}
                name={tx.description}
                date={new Date(tx.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                amount={tx.amount}
                currency={tx.currency}
              />
            ))}
          </div>
        )}
      </div>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </>
  )
}
