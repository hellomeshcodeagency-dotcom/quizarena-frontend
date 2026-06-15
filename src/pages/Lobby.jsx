import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { gameAPI } from '../services/api'
import useAuthStore from '../context/authStore'
import { Button, Brand, WalletChip, Alert } from '../components/ui'
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
  { label: '1v1', value: 2 },
  { label: '10',  value: 10 },
  { label: '20',  value: 20 },
  { label: '50',  value: 50 },
]

const MODES = ['1v1', 'group', 'practice']

export default function Lobby() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const user       = useAuthStore(s => s.user)

  const [mode,        setMode]        = useState('1v1')
  const [category,    setCategory]    = useState(location.state?.category || 'Sports')
  const [stakeNaira,  setStakeNaira]  = useState(500)
  const [playerCount, setPlayerCount] = useState(2)
  const [loading,     setLoading]     = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)

  const balanceNaira = (user?.balance || 0) / 100
  const prizeNaira   = stakeNaira * 2 * 0.9
  const platformFee  = stakeNaira * 0.1

  const findMatch = async () => {
    if (balanceNaira < stakeNaira) {
      toast.error('Insufficient balance')
      setShowDeposit(true)
      return
    }
    setLoading(true)
    try {
      const { data } = await gameAPI.findMatch({ category, stakeNaira, playerCount })
      toast.success('Match found!')
      navigate(`/game/${data.roomId}`, { state: { stakeNaira, category, playerCount } })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to find match')
    } finally {
      setLoading(false)
    }
  }

  const startPractice = async () => {
    setLoading(true)
    try {
      navigate('/practice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="flex gap-8">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Game lobby</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Configure your match</div>
          </div>
        </div>
        <WalletChip balance={user?.balance || 0} onClick={() => setShowDeposit(true)} />
      </div>

      {/* MODE TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
        {MODES.map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); if (m !== 'group') setPlayerCount(2) }}
            style={{
              flex: 1, height: 44, borderBottom: `2px solid ${mode === m ? 'var(--blue)' : 'transparent'}`,
              color: mode === m ? 'var(--blue)' : 'var(--muted)',
              fontWeight: 700, fontSize: 13, textTransform: 'capitalize',
              background: 'none', cursor: 'pointer', transition: 'all .15s',
            }}
          >
            {m === '1v1' ? '1 vs 1' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {mode === 'practice' ? (
        <div style={{ padding: 20 }}>
          <Alert variant="blue" title="Practice mode">
            No entry fee. Play to improve your skills. You can play 5 free practice games per day.
            {user?.is_vip ? ' VIP members get unlimited practice.' : ''}
          </Alert>
          <div style={{ marginTop: 20 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Choose category</div>
            <div className="grid3">
              {CATEGORIES.map(c => (
                <div
                  key={c.name}
                  onClick={() => setCategory(c.name)}
                  style={{
                    background: category === c.name ? 'var(--blue-dim)' : 'var(--surface)',
                    border: `1px solid ${category === c.name ? 'var(--blue-mid)' : 'var(--line)'}`,
                    borderRadius: 'var(--r)', padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{c.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted2)' }}>{c.name}</div>
                </div>
              ))}
            </div>
          </div>
          <Button variant="primary" full size="lg" style={{ marginTop: 20 }} onClick={() => navigate('/practice', { state: { category } })}>
            Start practice
          </Button>
        </div>
      ) : (
        <>
          <div style={{ padding: '20px 20px 0' }}>
            {/* CATEGORY */}
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Category</div>
            <div className="grid3" style={{ marginBottom: 20 }}>
              {CATEGORIES.map(c => (
                <div
                  key={c.name}
                  onClick={() => setCategory(c.name)}
                  style={{
                    background: category === c.name ? 'var(--blue-dim)' : 'var(--surface)',
                    border: `1px solid ${category === c.name ? 'var(--blue-mid)' : 'var(--line)'}`,
                    borderRadius: 'var(--r)', padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{c.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted2)' }}>{c.name}</div>
                </div>
              ))}
            </div>

            {/* STAKE */}
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Stake amount</div>
            <div className="grid3" style={{ marginBottom: 20 }}>
              {STAKES.map(s => (
                <div
                  key={s.naira}
                  onClick={() => setStakeNaira(s.naira)}
                  style={{
                    background: stakeNaira === s.naira ? 'var(--blue-dim)' : 'var(--surface)',
                    border: `1px solid ${stakeNaira === s.naira ? 'var(--blue-mid)' : 'var(--line)'}`,
                    borderRadius: 'var(--r)', padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                  }}
                >
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--amber)', marginBottom: 2 }}>
                    ₦{s.naira.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>win ₦{s.win.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* PLAYER COUNT — only for group */}
            {mode === 'group' && (
              <>
                <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Players per room</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
                  {PLAYER_SIZES.map(p => (
                    <div
                      key={p.value}
                      onClick={() => setPlayerCount(p.value)}
                      style={{
                        background: playerCount === p.value ? 'var(--blue-dim)' : 'var(--surface)',
                        border: `1px solid ${playerCount === p.value ? 'var(--blue-mid)' : 'var(--line)'}`,
                        borderRadius: 'var(--r)', padding: '11px 6px', textAlign: 'center', cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--amber)' }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.value === 2 ? 'players' : 'players'}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* FOOTER */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg)', position: 'sticky', bottom: 0 }}>
            {/* SUMMARY */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 'var(--r)', padding: '10px 0', marginBottom: 12,
            }}>
              {[
                { l: 'Category', v: category.split(' ')[0] },
                { l: 'Stake',    v: '₦' + stakeNaira.toLocaleString(), color: 'var(--amber)' },
                { l: 'Prize',    v: '₦' + prizeNaira.toLocaleString(), color: 'var(--green)' },
                { l: 'Fee',      v: '10%', color: 'var(--muted)' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center', borderRight: i < 3 ? '1px solid var(--line)' : 'none', padding: '0 4px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{item.l}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: item.color || 'var(--text)' }}>{item.v}</div>
                </div>
              ))}
            </div>

            {balanceNaira < stakeNaira && (
              <div style={{ marginBottom: 10 }}>
                <Alert variant="red">
                  Insufficient balance. You need ₦{stakeNaira.toLocaleString()} but have ₦{balanceNaira.toLocaleString()}.
                  <span style={{ color: 'var(--blue)', cursor: 'pointer', marginLeft: 4 }} onClick={() => setShowDeposit(true)}>Deposit now</span>
                </Alert>
              </div>
            )}

            <Button variant="primary" full size="lg" loading={loading} onClick={findMatch}>
              Find match
            </Button>
          </div>
        </>
      )}

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </>
  )
}
