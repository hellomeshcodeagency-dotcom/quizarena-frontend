import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { gameAPI } from '../services/api'
import useAuthStore from '../context/authStore'
import { Button, WalletChip, Alert, Tag } from '../components/ui'
import DepositModal from '../components/game/DepositModal'

const CATEGORIES = [
  { name: 'Sports',            emoji: '⚽' },
  { name: 'Science',           emoji: '🔬' },
  { name: 'Geography',         emoji: '🌍' },
  { name: 'Nollywood',         emoji: '🎬' },
  { name: 'General Knowledge', emoji: '💡' },
  { name: 'Technology',        emoji: '💻' },
]

const STAKES = [
  { naira: 100,   win: 180   },
  { naira: 500,   win: 900   },
  { naira: 1000,  win: 1800  },
  { naira: 2000,  win: 3600  },
  { naira: 5000,  win: 9000  },
  { naira: 10000, win: 18000 },
]

const PLAYER_SIZES = [
  { label: '1v1', value: 2,  desc: '2 players' },
  { label: '10',  value: 10, desc: '10 players' },
  { label: '20',  value: 20, desc: '20 players' },
  { label: '50',  value: 50, desc: '50 players' },
]

const MODES = [
  { id: '1v1',      label: '1 vs 1'    },
  { id: 'group',    label: 'Group'     },
  { id: 'practice', label: 'Practice'  },
]

export default function Lobby() {
  const navigate      = useNavigate()
  const location      = useLocation()
  const user          = useAuthStore(s => s.user)

  const [mode,        setMode]        = useState(location.state?.mode === 'practice' ? 'practice' : '1v1')
  const [category,    setCategory]    = useState(location.state?.category || 'Sports')
  const [stakeNaira,  setStakeNaira]  = useState(500)
  const [playerCount, setPlayerCount] = useState(2)
  const [loading,     setLoading]     = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)

  const balanceNaira = (user?.balance || 0) / 100
  const actualPlayers = mode === '1v1' ? 2 : playerCount
  const prizePool    = stakeNaira * actualPlayers
  const prize        = Math.round(prizePool * 0.9)

  // ── FIND MATCH ─────────────────────────────────────────
  const findMatch = async () => {
    if (balanceNaira < stakeNaira) {
      toast.error('Insufficient balance')
      setShowDeposit(true)
      return
    }
    setLoading(true)
    try {
      const { data } = await gameAPI.findMatch({
        category,
        stakeNaira,
        playerCount: actualPlayers,
      })
      toast.success('Match found!')
      navigate(`/game/${data.roomId}`, { state: { stakeNaira, category, playerCount: actualPlayers } })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to find match')
    } finally {
      setLoading(false)
    }
  }

  // ── START PRACTICE ─────────────────────────────────────
  const startPractice = () => {
    navigate(`/game/practice-${Date.now()}`, {
      state: { category, stakeNaira: 0, playerCount: 1, isPractice: true }
    })
  }

  const selCard = (active) => ({
    background: active ? 'var(--indigo-dim)' : 'var(--surface2)',
    border: `1px solid ${active ? 'var(--indigo)' : 'var(--line2)'}`,
    borderRadius: 'var(--r)',
    padding: '12px 8px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    transform: active ? 'scale(1.03)' : 'scale(1)',
    boxShadow: active ? '0 0 12px var(--indigo-dim)' : 'none',
  })

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700 }}>Quiz Lobby</div>
            <div style={{ fontSize: 11, color: 'var(--muted2)' }}>Set up your match</div>
          </div>
        </div>
        <WalletChip balance={user?.balance || 0} onClick={() => setShowDeposit(true)} />
      </div>

      {/* MODE TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line2)', background: 'var(--surface)' }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id)
              if (m.id === '1v1') setPlayerCount(2)
              if (m.id === 'group') setPlayerCount(10)
            }}
            style={{
              flex: 1, height: 46,
              borderBottom: `2px solid ${mode === m.id ? 'var(--indigo)' : 'transparent'}`,
              color: mode === m.id ? 'var(--indigo-lt)' : 'var(--muted2)',
              fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13,
              background: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── PRACTICE MODE ── */}
      {mode === 'practice' && (
        <div className="page-in" style={{ padding: 20, paddingBottom: 100 }}>
          <div style={{ background: 'var(--indigo-dim)', border: '1px solid var(--indigo-mid)', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--indigo-lt)', marginBottom: 4 }}>
              Practice mode — no stake required
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              Play against the clock. No entry fee, no prize. Free users get 5 sessions per day.
              {user?.is_vip ? ' You have unlimited practice as a VIP member.' : ''}
            </div>
          </div>

          <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
            Choose category
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 28 }}>
            {CATEGORIES.map(c => (
              <div key={c.name} onClick={() => setCategory(c.name)} style={selCard(category === c.name)}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{c.emoji}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{c.name}</div>
              </div>
            ))}
          </div>

          <Button variant="primary" full size="lg" onClick={startPractice}>
            Start practice — {category}
          </Button>
        </div>
      )}

      {/* ── 1v1 / GROUP MODE ── */}
      {mode !== 'practice' && (
        <>
          <div className="page-in" style={{ padding: '20px 20px 0' }}>

            {/* CATEGORY */}
            <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Category</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 24 }}>
              {CATEGORIES.map(c => (
                <div key={c.name} onClick={() => setCategory(c.name)} style={selCard(category === c.name)}>
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{c.emoji}</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700, color: category === c.name ? 'var(--indigo-lt)' : 'var(--text2)' }}>{c.name}</div>
                </div>
              ))}
            </div>

            {/* STAKE */}
            <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Stake amount</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 24 }}>
              {STAKES.map(s => (
                <div key={s.naira} onClick={() => setStakeNaira(s.naira)} style={selCard(stakeNaira === s.naira)}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: stakeNaira === s.naira ? 'var(--gold)' : 'var(--text)', marginBottom: 2 }}>
                    ₦{s.naira.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--display)' }}>
                    win ₦{(s.naira * (mode === '1v1' ? 2 : playerCount) * 0.9).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* GROUP SIZE */}
            {mode === 'group' && (
              <>
                <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                  Players per room
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 24 }}>
                  {PLAYER_SIZES.filter(p => p.value > 2).map(p => (
                    <div key={p.value} onClick={() => setPlayerCount(p.value)} style={selCard(playerCount === p.value)}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 800, color: playerCount === p.value ? 'var(--gold)' : 'var(--text)', marginBottom: 2 }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>players</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* STICKY FOOTER */}
          <div style={{
            position: 'sticky', bottom: 0,
            padding: '14px 20px 20px',
            background: 'rgba(8,8,16,0.97)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--line2)',
          }}>
            {/* MATCH SUMMARY */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
              background: 'var(--surface)',
              border: '1px solid var(--line2)',
              borderRadius: 10, overflow: 'hidden',
              marginBottom: 12,
            }}>
              {[
                { l: 'Game',    v: category.split(' ')[0]                          },
                { l: 'Stake',   v: `₦${stakeNaira.toLocaleString()}`,  c: 'var(--gold)'      },
                { l: 'Prize',   v: `₦${prize.toLocaleString()}`,        c: 'var(--teal)'      },
                { l: 'Cut',     v: '10%',                                c: 'var(--muted2)'    },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: 'center', padding: '10px 4px',
                    borderRight: i < 3 ? '1px solid var(--line2)' : 'none',
                  }}
                >
                  <div style={{ fontFamily: 'var(--display)', fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {item.l}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: item.c || 'var(--text)' }}>
                    {item.v}
                  </div>
                </div>
              ))}
            </div>

            {balanceNaira < stakeNaira && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--red)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Need ₦{(stakeNaira - balanceNaira).toLocaleString()} more</span>
                <span style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowDeposit(true)}>
                  Deposit
                </span>
              </div>
            )}

            <Button variant="primary" full size="lg" loading={loading} onClick={findMatch}>
              {mode === 'group' ? `Find group — ${playerCount} players` : 'Find opponent'}
            </Button>
          </div>
        </>
      )}

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </>
  )
}
