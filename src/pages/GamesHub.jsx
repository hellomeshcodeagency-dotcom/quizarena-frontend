import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'
import { gameAPI } from '../services/api'
import { Brand, WalletChip, Button, Tag } from '../components/ui'
import DepositModal from '../components/game/DepositModal'

const GAMES = [
  {
    id: 'quiz',
    name: 'Quiz Battle',
    icon: '🧠',
    desc: 'Answer 10 questions faster and more accurately than your opponent',
    modes: ['1v1', 'Group', 'Tournament'],
    color: 'var(--indigo)',
    glow: 'var(--indigo-glow)',
    path: '/lobby',
    tag: 'Most popular',
  },
  {
    id: 'chess',
    name: 'Chess',
    icon: '♟️',
    desc: 'Classic chess with a 10-minute clock. Checkmate wins the pot.',
    modes: ['1v1'],
    color: 'var(--muted2)',
    glow: 'rgba(160,160,200,0.3)',
    path: '/games/chess-lobby',
    tag: 'Strategy',
  },
  {
    id: 'tictactoe',
    name: 'Tic-tac-toe',
    icon: '⭕',
    desc: 'Best of 3 rounds. Fast, intense, winner takes all.',
    modes: ['1v1'],
    color: 'var(--teal)',
    glow: 'rgba(0,212,170,0.3)',
    path: '/games/ttt-lobby',
    tag: 'Quick game',
  },
  {
    id: 'word',
    name: 'Word Scramble',
    icon: '🔤',
    desc: 'Unscramble 8 words faster than your opponent. First to guess wins each round.',
    modes: ['1v1', 'Group'],
    color: 'var(--gold)',
    glow: 'var(--gold-glow)',
    path: '/games/word-lobby',
    tag: 'Word game',
  },
  {
    id: 'memory',
    name: 'Memory Match',
    icon: '🧩',
    desc: 'Flip cards and find matching pairs. Most pairs wins.',
    modes: ['1v1'],
    color: 'var(--purple)',
    glow: 'rgba(180,79,232,0.3)',
    path: '/games/memory-lobby',
    tag: 'Memory',
  },
  {
    id: 'speedmath',
    name: 'Speed Math',
    icon: '⚡',
    desc: '15 math questions. Answer first to score points. Fastest brain wins.',
    modes: ['1v1', 'Group'],
    color: 'var(--red)',
    glow: 'rgba(255,71,87,0.3)',
    path: '/games/math-lobby',
    tag: 'Speed',
  },
]

const STAKES = [100, 500, 1000, 2000, 5000, 10000]

export default function GamesHub() {
  const navigate      = useNavigate()
  const user          = useAuthStore(s => s.user)
  const [showDeposit, setShowDeposit] = useState(false)
  const [selected,    setSelected]    = useState(null) // game being staked
  const [stake,       setStake]       = useState(500)
  const [loading,     setLoading]     = useState(false)

  const balance = (user?.balance || 0) / 100

  const openStake = (game) => {
    if (game.path === '/lobby') { navigate('/lobby'); return }
    setSelected(game)
  }

  const findMatch = async () => {
    if (balance < stake) { toast.error('Insufficient balance'); setShowDeposit(true); return }
    setLoading(true)
    try {
      const { data } = await gameAPI.findMatch({
        category: selected.id,
        stakeNaira: stake,
        playerCount: 2,
        gameType: selected.id,
      })
      navigate(`/games/${selected.id === 'tictactoe' ? 'tictactoe' : selected.id === 'word' ? 'word' : selected.id === 'memory' ? 'memory' : selected.id === 'speedmath' ? 'speedmath' : 'chess'}/${data.roomId}`, {
        state: { stakeNaira: stake, gameType: selected.id }
      })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to find match')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <Brand />
        <WalletChip balance={user?.balance || 0} onClick={() => setShowDeposit(true)} />
      </div>

      <div className="page-in" style={{ padding: '20px 20px 90px' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 4 }}>Choose your game</h2>
          <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Stake ₦, beat your opponent, withdraw winnings</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GAMES.map((game, i) => (
            <div
              key={game.id}
              onClick={() => openStake(game)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line2)',
                borderRadius: 16,
                padding: '18px 18px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                animation: `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.06}s both`,
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = game.color
                e.currentTarget.style.boxShadow = `0 8px 32px ${game.glow}`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.borderColor = 'var(--line2)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Color accent bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: game.color, borderRadius: '16px 0 0 16px' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: `${game.color}18`,
                  border: `1px solid ${game.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  {game.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 800 }}>{game.name}</span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: game.color, background: `${game.color}18`, padding: '2px 8px', borderRadius: 100, border: `1px solid ${game.color}33` }}>
                      {game.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5, marginBottom: 8 }}>{game.desc}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {game.modes.map(m => (
                      <span key={m} style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--line2)' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 20, color: 'var(--muted)', flexShrink: 0 }}>›</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STAKE MODAL */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${selected.color}18`, border: `1px solid ${selected.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {selected.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)' }}>1v1 · Winner takes 90% of pot</div>
              </div>
            </div>

            <div style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Choose stake
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
              {STAKES.map(s => (
                <div
                  key={s}
                  onClick={() => setStake(s)}
                  style={{
                    background: stake === s ? `${selected.color}18` : 'var(--surface2)',
                    border: `1px solid ${stake === s ? selected.color : 'var(--line2)'}`,
                    borderRadius: 10, padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s', transform: stake === s ? 'scale(1.04)' : 'none',
                  }}
                >
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: stake === s ? 'var(--gold)' : 'var(--text)', marginBottom: 2 }}>
                    ₦{s.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--display)' }}>
                    win ₦{(s * 2 * 0.9).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {balance < stake && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--red)' }}>
                Insufficient balance. You have ₦{balance.toLocaleString()}.{' '}
                <span style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setSelected(null); setShowDeposit(true) }}>Deposit now</span>
              </div>
            )}

            <Button variant="primary" full size="lg" loading={loading} onClick={findMatch}
              style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}CC)` }}>
              Find opponent — ₦{stake.toLocaleString()} stake
            </Button>
            <Button variant="ghost" full style={{ marginTop: 10 }} onClick={() => setSelected(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </>
  )
}
