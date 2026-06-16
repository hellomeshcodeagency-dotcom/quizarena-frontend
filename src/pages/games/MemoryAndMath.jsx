// ── MEMORY MATCH ──────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../../services/socket'
import useAuthStore from '../../context/authStore'
import { Button } from '../../components/ui'

export function MemoryMatch() {
  const { roomId } = useParams()
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)

  const [board,       setBoard]       = useState([])
  const [scores,      setScores]      = useState({})
  const [myTurn,      setMyTurn]      = useState(false)
  const [status,      setStatus]      = useState('waiting')
  const [result,      setResult]      = useState(null)
  const [flipping,    setFlipping]    = useState([])
  const [matched,     setMatched]     = useState([])
  const [lastNoMatch, setLastNoMatch] = useState([])

  const { stakeNaira = 0 } = location.state || {}

  useEffect(() => {
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }

    socket.emit('mem:join', { roomId })

    socket.on('mem:state', ({ board, scores, currentTurn }) => {
      setBoard(board)
      setScores(scores || {})
      setMyTurn(currentTurn === user.id)
    })

    socket.on('mem:start', ({ currentTurn }) => {
      setStatus('playing')
      setMyTurn(currentTurn === user.id)
    })

    socket.on('mem:flip', ({ position, emoji }) => {
      setBoard(prev => prev.map((c, i) => i === position ? { ...c, flipped: true, emoji } : c))
      setFlipping(prev => [...prev, position])
    })

    socket.on('mem:match', ({ positions, playerId, scores }) => {
      setMatched(prev => [...prev, ...positions])
      setFlipping([])
      setScores(scores)
      if (playerId === user.id) setMyTurn(true)
    })

    socket.on('mem:nomatch', ({ positions, currentTurn }) => {
      setLastNoMatch(positions)
      setTimeout(() => {
        setBoard(prev => prev.map((c, i) => positions.includes(i) ? { ...c, flipped: false, emoji: undefined } : c))
        setFlipping([])
        setLastNoMatch([])
        setMyTurn(currentTurn === user.id)
      }, 1200)
    })

    socket.on('mem:ended', (data) => {
      setResult({ ...data, isWinner: data.winnerId === user.id })
      setStatus('ended')
    })

    return () => {
      socket.off('mem:state'); socket.off('mem:start'); socket.off('mem:flip')
      socket.off('mem:match'); socket.off('mem:nomatch'); socket.off('mem:ended')
    }
  }, [roomId])

  const flipCard = (position) => {
    if (!myTurn || status !== 'playing') return
    if (flipping.length >= 2) return
    if (flipping.includes(position)) return
    if (matched.includes(position)) return
    getSocket()?.emit('mem:flip', { roomId, position })
  }

  const myScore = scores[user?.id] || 0

  if (status === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🧩</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>Waiting for opponent...</div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (status === 'ended' && result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{result.isWinner ? '🏆' : result.winnerId ? '💀' : '🤝'}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 30, fontWeight: 800, color: result.isWinner ? 'var(--teal)' : result.winnerId ? 'var(--red)' : 'var(--muted2)', marginBottom: 8 }}>
          {result.isWinner ? 'You won!' : result.winnerId ? 'You lost' : "It's a draw!"}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--muted2)', marginBottom: 8 }}>{myScore} pairs matched</div>
        {result.isWinner && <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', textShadow: '0 0 20px var(--gold-glow)' }}>+₦{(stakeNaira * 2 * 0.9).toLocaleString()}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 24 }}>
          <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          <Button variant="ghost" full onClick={() => navigate('/dashboard')}>Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line2)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 800 }}>Memory Match</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{myScore} pts</div>
      </div>

      <div style={{ padding: '14px 20px', textAlign: 'center', background: myTurn ? 'var(--indigo-dim)' : 'var(--surface2)', borderBottom: '1px solid var(--line2)', transition: 'background 0.3s' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: myTurn ? 'var(--indigo-lt)' : 'var(--muted2)' }}>
          {myTurn ? '🎯 Your turn — flip a card' : "⏳ Opponent's turn"}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, maxWidth: 360, width: '100%' }}>
          {board.map((card, i) => {
            const isFlipped = card.flipped || matched.includes(i)
            const isMatched = matched.includes(i)
            const isNoMatch = lastNoMatch.includes(i)
            return (
              <div
                key={i}
                onClick={() => flipCard(i)}
                style={{
                  aspectRatio: '1', borderRadius: 12, cursor: myTurn && !isFlipped ? 'pointer' : 'default',
                  background: isMatched ? 'var(--teal-dim)' : isFlipped ? 'var(--surface3)' : 'var(--surface2)',
                  border: `2px solid ${isMatched ? 'var(--teal)' : isNoMatch ? 'var(--red)' : isFlipped ? 'var(--line2)' : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, transition: 'all 0.3s',
                  boxShadow: isMatched ? '0 0 12px var(--teal-mid)' : 'none',
                  transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(90deg)',
                  animation: isFlipped && !isMatched ? 'popIn 0.3s ease' : 'none',
                }}
              >
                {isFlipped ? card.emoji : '?'}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── SPEED MATH ────────────────────────────────────────────
export function SpeedMath() {
  const { roomId } = useParams()
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)

  const [status,   setStatus]   = useState('waiting')
  const [question, setQuestion] = useState(null)
  const [scores,   setScores]   = useState({})
  const [round,    setRound]    = useState(0)
  const [total,    setTotal]    = useState(15)
  const [timeLeft, setTimeLeft] = useState(10)
  const [feedback, setFeedback] = useState(null)
  const [result,   setResult]   = useState(null)

  const { stakeNaira = 0 } = location.state || {}
  const timerRef = { current: null }
  const myScore = scores[user?.id] || 0

  useEffect(() => {
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }

    socket.emit('math:join', { roomId })

    socket.on('math:countdown', () => setStatus('countdown'))

    socket.on('math:question', (data) => {
      setQuestion(data)
      setRound(data.round)
      setTotal(data.total)
      setTimeLeft(data.timeLimit)
      setFeedback(null)
      setStatus('playing')

      clearInterval(timerRef.current)
      let t = data.timeLimit
      timerRef.current = setInterval(() => { t--; setTimeLeft(t); if (t <= 0) clearInterval(timerRef.current) }, 1000)
    })

    socket.on('math:result', ({ correct, points, totalScore }) => {
      setFeedback(correct ? 'correct' : 'wrong')
      setScores(prev => ({ ...prev, [user.id]: totalScore }))
      setTimeout(() => setFeedback(null), 800)
    })

    socket.on('math:scores', ({ scores }) => setScores(scores))

    socket.on('math:timeout', () => {
      clearInterval(timerRef.current)
      setFeedback('timeout')
    })

    socket.on('math:ended', (data) => {
      setResult({ ...data, isWinner: data.winnerId === user.id })
      setStatus('ended')
      clearInterval(timerRef.current)
    })

    return () => {
      clearInterval(timerRef.current)
      socket.off('math:countdown'); socket.off('math:question')
      socket.off('math:result'); socket.off('math:scores')
      socket.off('math:timeout'); socket.off('math:ended')
    }
  }, [roomId])

  const answer = (val) => {
    if (status !== 'playing' || feedback) return
    getSocket()?.emit('math:answer', { roomId, answer: val })
  }

  if (status === 'waiting' || status === 'countdown') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>⚡</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>
          {status === 'countdown' ? 'Get ready!' : 'Waiting for opponent...'}
        </div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (status === 'ended' && result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{result.isWinner ? '🏆' : result.winnerId ? '💀' : '🤝'}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 30, fontWeight: 800, color: result.isWinner ? 'var(--teal)' : result.winnerId ? 'var(--red)' : 'var(--muted2)', marginBottom: 8 }}>
          {result.isWinner ? 'Lightning fast!' : result.winnerId ? 'Too slow!' : "It's a draw!"}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--muted2)', marginBottom: 8 }}>{myScore} points</div>
        {result.isWinner && <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', textShadow: '0 0 20px var(--gold-glow)' }}>+₦{(stakeNaira * 2 * 0.9).toLocaleString()}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 24 }}>
          <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          <Button variant="ghost" full onClick={() => navigate('/dashboard')}>Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line2)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 800 }}>Speed Math</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>Q {round} / {total}</div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>{myScore} pts</div>
      </div>

      <div style={{ height: 3, background: 'var(--line2)' }}>
        <div style={{ height: 3, background: 'var(--red)', width: `${(round / total) * 100}%`, transition: 'width 0.4s' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* TIMER */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 52, fontWeight: 900, color: timeLeft <= 3 ? 'var(--red)' : 'var(--text)', marginBottom: 8, animation: timeLeft <= 3 ? 'pulse 0.8s ease infinite' : 'none', textShadow: timeLeft <= 3 ? '0 0 20px var(--red)' : 'none' }}>
          {timeLeft}
        </div>

        {/* QUESTION */}
        {question && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 42, fontWeight: 900, marginBottom: 40, color: feedback === 'correct' ? 'var(--teal)' : feedback === 'wrong' ? 'var(--red)' : 'var(--text)', animation: feedback === 'wrong' ? 'shake 0.4s ease' : feedback === 'correct' ? 'bounce 0.5s ease' : 'none', transition: 'color 0.2s' }}>
            {question.question}
          </div>
        )}

        {/* OPTIONS */}
        {question && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 320 }}>
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(opt)}
                disabled={!!feedback}
                style={{
                  height: 64, borderRadius: 14, fontFamily: 'var(--mono)',
                  fontSize: 24, fontWeight: 800, cursor: feedback ? 'default' : 'pointer',
                  background: 'var(--surface2)', border: '2px solid var(--line2)',
                  color: 'var(--text)', transition: 'all 0.15s',
                  transform: 'scale(1)',
                }}
                onMouseEnter={e => { if (!feedback) { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.transform = 'scale(1.05)' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MemoryMatch
