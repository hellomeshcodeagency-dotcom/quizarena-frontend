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
    hasPractice: true,
    practiceRoute: '/lobby',
    practiceState: { mode: 'practice' },
  },
  {
    id: 'chess',
    name: 'Chess',
    icon: '♟️',
    desc: 'Classic chess with a 10-minute clock. Checkmate wins the pot.',
    modes: ['1v1', 'Tournament'],
    color: '#A0A0CC',
    glow: 'rgba(160,160,200,0.3)',
    gameRoute: 'chess',
    hasPractice: true,
    practiceRoute: '/games/chess/practice',
    practiceState: { isPractice: true, stakeNaira: 0 },
  },
  {
    id: 'tictactoe',
    name: 'Tic-tac-toe',
    icon: '⭕',
    desc: 'Classic 3x3 board. Get 3 in a row to win the pot.',
    modes: ['1v1', 'Tournament'],
    color: 'var(--teal)',
    glow: 'rgba(0,212,170,0.3)',
    gameRoute: 'tictactoe',
    hasPractice: true,
    practiceRoute: '/games/tictactoe/practice',
    practiceState: { isPractice: true, stakeNaira: 0 },
  },
  {
    id: 'word',
    name: 'Word Scramble',
    icon: '🔤',
    desc: 'Unscramble 8 words faster than your opponent.',
    modes: ['1v1', 'Group', 'Tournament'],
    color: 'var(--gold)',
    glow: 'var(--gold-glow)',
    gameRoute: 'word',
    hasPractice: true,
    practiceRoute: '/games/word/practice',
    practiceState: { isPractice: true, stakeNaira: 0 },
  },
  {
    id: 'memory',
    name: 'Memory Match',
    icon: '🧩',
    desc: 'Flip cards and find matching pairs. Most pairs wins.',
    modes: ['1v1', 'Group', 'Tournament'],
    color: 'var(--purple)',
    glow: 'rgba(180,79,232,0.3)',
    gameRoute: 'memory',
    hasPractice: true,
    practiceRoute: '/games/memory/practice',
    practiceState: { isPractice: true, stakeNaira: 0 },
  },
  {
    id: 'speedmath',
    name: 'Speed Math',
    icon: '⚡',
    desc: '15 math questions. Answer first to score. Fastest brain wins.',
    modes: ['1v1', 'Group', 'Tournament'],
    color: 'var(--red)',
    glow: 'rgba(255,71,87,0.3)',
    gameRoute: 'speedmath',
    hasPractice: true,
    practiceRoute: '/games/speedmath/practice',
    practiceState: { isPractice: true, stakeNaira: 0 },
  },
]

const STAKES = [100, 500, 1000, 2000, 5000, 10000]
const GROUP_SIZES = [10, 20, 50]

export default function GamesHub() {
  const navigate      = useNavigate()
  const user          = useAuthStore(s => s.user)
  const [showDeposit, setShowDeposit] = useState(false)
  const [selected,    setSelected]    = useState(null)
  const [stake,       setStake]       = useState(500)
  const [groupSize,   setGroupSize]   = useState(10)
  const [matchMode,   setMatchMode]   = useState('1v1')
  const [loading,     setLoading]     = useState(false)

  const balance = (user?.balance || 0) / 100
  const players = matchMode === '1v1' ? 2 : groupSize
  const prize   = Math.round(stake * players * 0.9)

  const openGame = (game) => {
    // Quiz goes directly to its own lobby
    if (game.id === 'quiz') { navigate('/lobby'); return }
    setSelected(game)
    setMatchMode('1v1')
  }

  const startPractice = (game) => {
    if (game.id === 'quiz') {
      navigate('/lobby', { state: { mode: 'practice' } })
      return
    }
    navigate(`${game.practiceRoute}-${Date.now()}`, {
      state: { ...game.practiceState, gameType: game.id }
    })
  }

  const findMatch = async () => {
    if (balance < stake) {
      toast.error('Insufficient balance')
      setShowDeposit(true)
      return
    }
    setLoading(true)
    try {
      const { data } = await gameAPI.findMatch({
        category: selected.id,
        stakeNaira: stake,
        playerCount: players,
        gameType: selected.id,
      })
      navigate(`/games/${selected.gameRoute}/${data.roomId}`, {
        state: { stakeNaira: stake, gameType: selected.id, playerCount: players }
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
          <div style={{ fontSize: 13, color: 'var(--muted2)' }}>
            Stake ₦, beat your opponent, withdraw winnings
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GAMES.map((game, i) => (
            <div
              key={game.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line2)',
                borderRadius: 16,
                overflow: 'hidden',
                animation: `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.05}s both`,
              }}
            >
              {/* MAIN CARD */}
              <div
                style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: game.color }} />
                <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: `${game.color}18`, border: `1px solid ${game.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                  {game.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 800, marginBottom: 3 }}>{game.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5, marginBottom: 6 }}>{game.desc}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {game.modes.map(m => (
                      <span key={m} style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--line2)' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--line2)' }}>
                <button
                  onClick={() => startPractice(game)}
                  style={{ padding: '11px', background: 'var(--surface2)', border: 'none', borderRight: '1px solid var(--line2)', cursor: 'pointer', fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'var(--muted2)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface3)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted2)'; e.currentTarget.style.background = 'var(--surface2)' }}
                >
                  🎯 Practice free
                </button>
                <button
                  onClick={() => openGame(game)}
                  style={{ padding: '11px', background: `${game.color}18`, border: 'none', cursor: 'pointer', fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: game.color, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = `${game.color}28`}
                  onMouseLeave={e => e.currentTarget.style.background = `${game.color}18`}
                >
                  ₦ Play for money
                </button>
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

            {/* GAME HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${selected.color}18`, border: `1px solid ${selected.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {selected.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)' }}>Platform takes 10% · you keep 90%</div>
              </div>
            </div>

            {/* MATCH MODE — only show group if game supports it */}
            {selected.modes.includes('Group') && (
              <>
                <div style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Match type
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {['1v1', 'group'].map(m => (
                    <div
                      key={m}
                      onClick={() => { setMatchMode(m); if (m === '1v1') setGroupSize(10) }}
                      style={{
                        padding: '10px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                        background: matchMode === m ? `${selected.color}18` : 'var(--surface2)',
                        border: `1px solid ${matchMode === m ? selected.color : 'var(--line2)'}`,
                        fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700,
                        color: matchMode === m ? selected.color : 'var(--muted2)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {m === '1v1' ? '1 vs 1' : 'Group'}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* GROUP SIZE */}
            {matchMode === 'group' && (
              <>
                <div style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Players per room
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
                  {GROUP_SIZES.map(s => (
                    <div
                      key={s}
                      onClick={() => setGroupSize(s)}
                      style={{
                        padding: '10px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                        background: groupSize === s ? `${selected.color}18` : 'var(--surface2)',
                        border: `1px solid ${groupSize === s ? selected.color : 'var(--line2)'}`,
                        fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800,
                        color: groupSize === s ? selected.color : 'var(--text)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* STAKE */}
            <div style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Stake amount
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
                    win ₦{Math.round(s * players * 0.9).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* SUMMARY */}
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--line2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Players</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700 }}>{players}</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--line2)', borderRight: '1px solid var(--line2)' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Stake</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>₦{stake.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Prize</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--teal)' }}>₦{prize.toLocaleString()}</div>
              </div>
            </div>

            {balance < stake && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--red)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Need ₦{(stake - balance).toLocaleString()} more</span>
                <span style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setSelected(null); setShowDeposit(true) }}>
                  Deposit
                </span>
              </div>
            )}

            <Button
              variant="primary" full size="lg" loading={loading} onClick={findMatch}
              style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}CC)` }}
            >
              Find {matchMode === 'group' ? `group (${players} players)` : 'opponent'} — ₦{stake.toLocaleString()}
            </Button>
            <Button variant="ghost" full style={{ marginTop: 10 }} onClick={() => setSelected(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </>
  )
}
