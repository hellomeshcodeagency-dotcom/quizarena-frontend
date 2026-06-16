import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'
import { gameAPI, adsAPI, walletAPI } from '../services/api'
import { Brand, WalletChip, StatChip, SectionHead, TxRow, Button, Tag } from '../components/ui'
import DepositModal from '../components/game/DepositModal'

const CATEGORIES = [
  { name: 'Sports',            emoji: '⚽', hot: true  },
  { name: 'Science',           emoji: '🔬'             },
  { name: 'Geography',         emoji: '🌍'             },
  { name: 'Nollywood',         emoji: '🎬', hot: true  },
  { name: 'General Knowledge', emoji: '💡'             },
  { name: 'Technology',        emoji: '💻'             },
]

// Animated counter
function Counter({ target, prefix = '', duration = 1200 }) {
  const [val, setVal] = useState(0)
  const rafRef = useRef(null)
  useEffect(() => {
    const start = Date.now()
    const from = val
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(from + (target - from) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])
  return <span>{prefix}{val.toLocaleString()}</span>
}

export default function Dashboard() {
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [stats,       setStats]       = useState(null)
  const [txns,        setTxns]        = useState([])
  const [ad,          setAd]          = useState(null)
  const [showDeposit, setShowDeposit] = useState(false)
  const [livePool,    setLivePool]    = useState(2847500)
  const [livePlayers, setLivePlayers] = useState(4291)

  useEffect(() => {
    gameAPI.stats().then(r => setStats(r.data.stats)).catch(() => {})
    walletAPI.transactions({ limit: 5 }).then(r => setTxns(r.data.transactions)).catch(() => {})
    adsAPI.get('banner').then(r => setAd(r.data.ads?.[0])).catch(() => {})

    // Live pool counter
    const iv = setInterval(() => {
      setLivePool(p => p + Math.floor(Math.random() * 1200) + 300)
      setLivePlayers(p => Math.max(0, p + Math.floor(Math.random() * 5) - 2))
    }, 1800)
    return () => clearInterval(iv)
  }, [])

  const balance = user?.balance || 0
  const coins   = user?.coins || 0

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <>
      <div className="topbar">
        <Brand />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            onClick={() => navigate('/coins')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--gold-dim)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 100, padding: '5px 12px', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 12, color: 'var(--gold)', fontFamily: 'var(--mono)', fontWeight: 700 }}>◈ {coins}</span>
          </div>
          <WalletChip balance={balance} onClick={() => setShowDeposit(true)} />
        </div>
      </div>

      <div className="page-in" style={{ paddingBottom: 80 }}>

        {/* ── HERO ── */}
        <div className="hero-gradient" style={{ padding: '28px 20px 24px', borderBottom: '1px solid var(--line2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 4 }}>{greeting()}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800 }}>{user?.username}</div>
              {stats?.win_streak > 0 && (
                <div style={{ marginTop: 4 }}>
                  <Tag variant="gold">🔥 {stats.win_streak} win streak</Tag>
                </div>
              )}
            </div>
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--indigo), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--display)', fontSize: 16, fontWeight: 800, color: '#fff',
              boxShadow: '0 0 20px var(--indigo-glow)',
            }}>
              {user?.avatarInitials || user?.username?.substring(0,2).toUpperCase()}
            </div>
          </div>

          {/* BALANCE CARD */}
          <div style={{
            background: 'linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%)',
            border: '1px solid var(--line2)', borderRadius: 16,
            padding: '20px', marginBottom: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <div className="amount-label">Available balance</div>
            <div className="amount-display" style={{ fontSize: 42, marginBottom: 18 }}>
              ₦{(balance / 100).toLocaleString()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Button variant="primary" full onClick={() => setShowDeposit(true)}>+ Deposit</Button>
              <Button variant="outline" full onClick={() => navigate('/wallet')}>Withdraw</Button>
            </div>
          </div>

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            <StatChip label="Wins"      value={stats?.total_wins   || 0} color="var(--teal)"   />
            <StatChip label="Losses"    value={stats?.total_losses || 0} color="var(--red)"    />
            <StatChip label="Earned"    value={stats ? '₦' + Math.round((stats.total_earned_kobo||0)/100).toLocaleString() : '₦0'} color="var(--gold)" />
          </div>
        </div>

        {/* ── LIVE POOL TICKER ── */}
        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Live prize pool
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--gold)', textShadow: '0 0 20px var(--gold-glow)' }}>
              ₦<Counter target={livePool} duration={1500} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Online now
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--teal)' }}>
              <Counter target={livePlayers} duration={1000} />
            </div>
          </div>
        </div>

        {/* ── LIVE TOURNAMENT BANNER ── */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line2)' }}>
          <div
            onClick={() => navigate('/tournaments')}
            style={{
              background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(0,212,170,0.05))',
              border: '1px solid var(--indigo-mid)',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 24px var(--indigo-dim)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <span className="live-dot" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                Grand Saturday Showdown
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted2)' }}>2,847 players · ₦500,000 prize</div>
            </div>
            <Button variant="danger" size="sm" onClick={e => { e.stopPropagation(); navigate('/tournaments') }}>
              Join
            </Button>
          </div>
        </div>

        {/* ── QUICK PLAY ── */}
        <div style={{ padding: '20px 20px 0' }}>
          <SectionHead title="Quick play" />
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 20px 20px', scrollbarWidth: 'none' }}>
          {[
            { icon: '⚔️', name: '1 vs 1',    stake: 'from ₦100', hot: true  },
            { icon: '👥', name: 'Group',      stake: 'from ₦200'             },
            { icon: '🏆', name: 'Tournament', stake: 'from ₦500', path: '/tournaments' },
            { icon: '🎯', name: 'Practice',   stake: '5 free/day', path: '/practice'   },
            { icon: '🔗', name: 'Refer',      stake: '+100 coins', path: '/referral'   },
          ].map(m => (
            <div
              key={m.name}
              onClick={() => navigate(m.path || '/lobby')}
              style={{
                flexShrink: 0, minWidth: 108,
                background: m.hot ? 'linear-gradient(135deg, var(--indigo-dim), rgba(108,99,255,0.05))' : 'var(--surface2)',
                border: `1px solid ${m.hot ? 'var(--indigo-mid)' : 'var(--line2)'}`,
                borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(108,99,255,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--gold)' }}>{m.stake}</div>
            </div>
          ))}
        </div>

        {/* ── CATEGORIES ── */}
        <div style={{ padding: '0 20px 20px' }}>
          <SectionHead title="Categories" action="Play now" onAction={() => navigate('/lobby')} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {CATEGORIES.map((c, i) => (
              <div
                key={c.name}
                onClick={() => navigate('/lobby', { state: { category: c.name } })}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--line2)',
                  borderRadius: 12, padding: '14px 8px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.25s',
                  animation: `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.05}s both`,
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--indigo-mid)'; e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 20px var(--indigo-dim)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {c.hot && <div style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 6px var(--red)' }} />}
                <div style={{ fontSize: 24, marginBottom: 6 }}>{c.emoji}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{c.name}</div>
              </div>
            ))}
            <div
              onClick={() => navigate('/vip')}
              style={{ background: 'var(--surface2)', border: '1px solid var(--line2)', borderRadius: 12, padding: '14px 8px', textAlign: 'center', cursor: 'pointer', opacity: 0.7 }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>🔒</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700, color: 'var(--indigo-lt)' }}>VIP Only</div>
            </div>
          </div>
        </div>

        {/* ── AD BANNER ── */}
        {ad && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--line2)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Sponsored</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{ad.title}</div>
              </div>
              <a href={ad.cta_url} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm">{ad.cta_text || 'Open'}</Button>
              </a>
            </div>
          </div>
        )}

        {/* ── EARN MORE ── */}
        <div style={{ padding: '0 20px 20px' }}>
          <SectionHead title="Ways to earn" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '🔗', name: 'Refer friends',  sub: '100 coins per referral', path: '/referral', color: 'var(--teal)' },
              { icon: '⭐', name: 'Go VIP',          sub: '+10% on every win',      path: '/vip',      color: 'var(--gold)' },
              { icon: '◈',  name: 'Buy coins',       sub: 'Unlock power-ups',       path: '/coins',    color: 'var(--indigo-lt)' },
              { icon: '🏆', name: 'Tournaments',     sub: 'Biggest prize pools',    path: '/tournaments', color: 'var(--purple)' },
            ].map(item => (
              <div
                key={item.name}
                onClick={() => navigate(item.path)}
                style={{ background: 'var(--surface2)', border: '1px solid var(--line2)', borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--line3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: 22, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: item.color, fontFamily: 'var(--display)', fontWeight: 600 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RECENT ACTIVITY ── */}
        {txns.length > 0 && (
          <div style={{ padding: '0 20px 20px' }}>
            <SectionHead title="Recent activity" action="View all" onAction={() => navigate('/wallet')} />
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line2)', borderRadius: 14, padding: '0 16px', overflow: 'hidden' }}>
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
          </div>
        )}
      </div>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </>
  )
}
