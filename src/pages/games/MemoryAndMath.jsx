import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../../services/socket'
import useAuthStore from '../../context/authStore'
import { Button } from '../../components/ui'

const EMOJIS = ['🎯','💎','🔥','⚡','🎮','🏆','💰','🎪','🌟','🎭','🎸','🚀','🦁','🐯','🦊','🐺']

const createBoard = () => {
  const pairs = EMOJIS.slice(0, 8)
  return [...pairs, ...pairs]
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5)
    .map((card, i) => ({ ...card, position: i }))
}

// ── MEMORY MATCH ──────────────────────────────────────────
export function MemoryMatch() {
  const { roomId } = useParams()
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)

  const { stakeNaira = 0, isPractice } = location.state || {}
  const isPrac = isPractice || roomId?.startsWith('practice')

  const [board,    setBoard]    = useState(() => createBoard())
  const [flipped,  setFlipped]  = useState([])
  const [matched,  setMatched]  = useState([])
  const [locked,   setLocked]   = useState(false)
  const [scores,   setScores]   = useState({})
  const [myTurn,   setMyTurn]   = useState(isPrac ? true : false)
  const [status,   setStatus]   = useState(isPrac ? 'playing' : 'waiting')
  const [result,   setResult]   = useState(null)
  const [moves,    setMoves]    = useState(0)

  // Practice flip logic
  const practiceFlip = (position) => {
    if (locked || status !== 'playing') return
    if (matched.includes(position)) return
    if (flipped.includes(position)) return
    if (flipped.length >= 2) return

    const newFlipped = [...flipped, position]
    setFlipped(newFlipped)
    setMoves(m => m + 1)

    if (newFlipped.length === 2) {
      setLocked(true)
      const [p1, p2] = newFlipped
      const c1 = board[p1], c2 = board[p2]
      if (c1.emoji === c2.emoji) {
        const newMatched = [...matched, p1, p2]
        setMatched(newMatched)
        setFlipped([])
        setLocked(false)
        if (newMatched.length === board.length) setStatus('ended')
      } else {
        setTimeout(() => { setFlipped([]); setLocked(false) }, 1000)
      }
    }
  }

  // Multiplayer socket
  useEffect(() => {
    if (isPrac) return
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }

    socket.emit('mem:join', { roomId })
    socket.on('mem:state', ({ board: b, scores: s, currentTurn }) => {
      if (b) setBoard(b.map((c,i) => ({ ...c, position: i })))
      setScores(s || {})
      setMyTurn(currentTurn === user.id)
    })
    socket.on('mem:start',   ({ currentTurn }) => { setStatus('playing'); setMyTurn(currentTurn === user.id) })
    socket.on('mem:flip',    ({ position, emoji }) => {
      setBoard(prev => prev.map((c,i) => i === position ? { ...c, flipped: true, emoji } : c))
      setFlipped(prev => [...prev, position])
    })
    socket.on('mem:match',   ({ positions, scores: s }) => {
      setMatched(prev => [...prev, ...positions]); setFlipped([]); setScores(s)
    })
    socket.on('mem:nomatch', ({ positions, currentTurn }) => {
      setTimeout(() => {
        setBoard(prev => prev.map((c,i) => positions.includes(i) ? { ...c, flipped: false, emoji: undefined } : c))
        setFlipped([]); setMyTurn(currentTurn === user.id)
      }, 1000)
    })
    socket.on('mem:ended',   (data) => { setResult({ ...data, isWinner: data.winnerId === user.id }); setStatus('ended') })
    return () => {
      socket.off('mem:state'); socket.off('mem:start'); socket.off('mem:flip')
      socket.off('mem:match'); socket.off('mem:nomatch'); socket.off('mem:ended')
    }
  }, [roomId, isPrac])

  const multiFlip = (position) => {
    if (!myTurn || status !== 'playing') return
    if (flipped.length >= 2 || matched.includes(position) || flipped.includes(position)) return
    getSocket()?.emit('mem:flip', { roomId, position })
  }

  const handleFlip = (position) => isPrac ? practiceFlip(position) : multiFlip(position)

  if (!isPrac && status === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🧩</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>Waiting for opponent...</div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (status === 'ended') {
    const isWinner = isPrac ? true : result?.isWinner
    const pairCount = matched.length / 2
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{isPrac ? '🏅' : isWinner ? '🏆' : result?.winnerId ? '💀' : '🤝'}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 8, color: isPrac ? 'var(--teal)' : isWinner ? 'var(--teal)' : result?.winnerId ? 'var(--red)' : 'var(--muted2)' }}>
          {isPrac ? `Completed in ${moves} moves!` : isWinner ? 'You won!' : result?.winnerId ? 'You lost' : "It's a draw!"}
        </div>
        {isPrac && <div style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--muted2)', marginBottom: 8 }}>{pairCount} pairs found · {moves} moves</div>}
        {!isPrac && isWinner && <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', marginBottom: 16 }}>+₦{(stakeNaira * 2 * 0.9).toLocaleString()}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 16 }}>
          {isPrac
            ? <Button variant="primary" full size="lg" onClick={() => { setBoard(createBoard()); setFlipped([]); setMatched([]); setLocked(false); setMoves(0); setStatus('playing') }}>Play again</Button>
            : <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          }
          <Button variant="ghost" full onClick={() => navigate('/games')}>Back to games</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line2)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 800 }}>Memory Match {isPrac ? '(Practice)' : ''}</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{isPrac ? `${moves} moves · ${matched.length/2} pairs found` : `${matched.length/2} / 8 pairs`}</div>
        </div>
        {!isPrac && <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{scores[user?.id] || 0} pts</div>}
      </div>
      {!isPrac && (
        <div style={{ padding: '10px 20px', textAlign: 'center', background: myTurn ? 'var(--indigo-dim)' : 'var(--surface2)', borderBottom: '1px solid var(--line2)', transition: 'background 0.3s' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: myTurn ? 'var(--indigo-lt)' : 'var(--muted2)' }}>
            {myTurn ? '🎯 Your turn' : "⏳ Opponent's turn"}
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, maxWidth: 360, width: '100%' }}>
          {board.map((card, i) => {
            const isFlipped = isPrac ? (flipped.includes(i) || matched.includes(i)) : (card.flipped || matched.includes(i))
            const isMatched = matched.includes(i)
            return (
              <div
                key={i}
                onClick={() => handleFlip(i)}
                style={{
                  aspectRatio: '1', borderRadius: 12, cursor: isMatched ? 'default' : 'pointer',
                  background: isMatched ? 'var(--teal-dim)' : isFlipped ? 'var(--surface3)' : 'var(--surface2)',
                  border: `2px solid ${isMatched ? 'var(--teal)' : isFlipped ? 'var(--line2)' : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, transition: 'all 0.3s', userSelect: 'none',
                  boxShadow: isMatched ? '0 0 12px var(--teal-mid)' : 'none',
                  animation: isFlipped && !isMatched ? 'popIn 0.25s ease' : 'none',
                }}
              >
                {isFlipped ? (isPrac ? board[i].emoji : card.emoji) : '?'}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── SPEED MATH ────────────────────────────────────────────
const generateQ = (round) => {
  const d = Math.min(round, 5)
  const ops = d <= 2 ? ['+','-'] : d <= 4 ? ['+','-','×'] : ['+','-','×','÷']
  const op  = ops[Math.floor(Math.random() * ops.length)]
  let a, b, answer
  switch (op) {
    case '+': a = Math.floor(Math.random()*(10*d))+1; b = Math.floor(Math.random()*(10*d))+1; answer = a+b; break
    case '-': a = Math.floor(Math.random()*(10*d))+10; b = Math.floor(Math.random()*a)+1; answer = a-b; break
    case '×': a = Math.floor(Math.random()*(3*d))+2; b = Math.floor(Math.random()*12)+2; answer = a*b; break
    case '÷': b = Math.floor(Math.random()*11)+2; answer = Math.floor(Math.random()*10)+2; a = b*answer; break
  }
  const options = new Set([answer])
  while (options.size < 4) {
    const w = answer + (Math.floor(Math.random()*10)-5)
    if (w !== answer && w > 0) options.add(w)
  }
  return { question: `${a} ${op} ${b} = ?`, answer, options: [...options].sort(() => Math.random()-0.5) }
}

export function SpeedMath() {
  const { roomId } = useParams()
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)
  const timerRef   = useRef(null)

  const { stakeNaira = 0, isPractice } = location.state || {}
  const isPrac = isPractice || roomId?.startsWith('practice')

  const [status,   setStatus]   = useState(isPrac ? 'playing' : 'waiting')
  const [question, setQuestion] = useState(null)
  const [round,    setRound]    = useState(0)
  const [total,    setTotal]    = useState(15)
  const [timeLeft, setTimeLeft] = useState(10)
  const [feedback, setFeedback] = useState(null)
  const [scores,   setScores]   = useState({})
  const [result,   setResult]   = useState(null)
  const [practiceScore, setPracticeScore] = useState(0)
  const [practiceCorrect, setPracticeCorrect] = useState(0)
  const [practiceRound,   setPracticeRound]   = useState(0)

  const loadPracticeQ = (r) => {
    if (r >= 15) { setStatus('ended'); return }
    const q = generateQ(r + 1)
    setQuestion(q); setFeedback(null); setTimeLeft(10); setPracticeRound(r)
    clearInterval(timerRef.current)
    let t = 10
    timerRef.current = setInterval(() => {
      t--; setTimeLeft(t)
      if (t <= 0) { clearInterval(timerRef.current); setFeedback('timeout'); setTimeout(() => loadPracticeQ(r+1), 1000) }
    }, 1000)
  }

  useEffect(() => { if (isPrac) loadPracticeQ(0) }, [isPrac])

  const practiceAnswer = (val) => {
    if (feedback) return
    clearInterval(timerRef.current)
    const correct = val === question.answer
    if (correct) { setPracticeScore(s => s + 100 + timeLeft*10); setPracticeCorrect(c => c+1) }
    setFeedback(correct ? 'correct' : 'wrong')
    setTimeout(() => loadPracticeQ(practiceRound + 1), 800)
  }

  // Multiplayer
  useEffect(() => {
    if (isPrac) return
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }
    socket.emit('math:join', { roomId })
    socket.on('math:countdown', () => setStatus('countdown'))
    socket.on('math:question', (data) => {
      setQuestion(data); setRound(data.round); setTotal(data.total)
      setFeedback(null); setTimeLeft(data.timeLimit); setStatus('playing')
      clearInterval(timerRef.current)
      let t = data.timeLimit
      timerRef.current = setInterval(() => { t--; setTimeLeft(t); if(t<=0) clearInterval(timerRef.current) }, 1000)
    })
    socket.on('math:result',  ({ correct, totalScore }) => {
      setFeedback(correct ? 'correct' : 'wrong')
      setScores(prev => ({ ...prev, [user.id]: totalScore }))
      setTimeout(() => setFeedback(null), 800)
    })
    socket.on('math:scores',  ({ scores: s }) => setScores(s))
    socket.on('math:timeout', () => { clearInterval(timerRef.current); setFeedback('timeout') })
    socket.on('math:ended',   (data) => {
      setResult({ ...data, isWinner: data.winnerId === user.id }); setStatus('ended')
      clearInterval(timerRef.current)
    })
    return () => {
      clearInterval(timerRef.current)
      socket.off('math:countdown'); socket.off('math:question'); socket.off('math:result')
      socket.off('math:scores'); socket.off('math:timeout'); socket.off('math:ended')
    }
  }, [roomId, isPrac])

  const multiAnswer = (val) => {
    if (status !== 'playing' || feedback) return
    getSocket()?.emit('math:answer', { roomId, answer: val })
  }

  const handleAnswer = (val) => isPrac ? practiceAnswer(val) : multiAnswer(val)

  if (!isPrac && (status === 'waiting' || status === 'countdown')) {
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

  if (status === 'ended') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{isPrac ? '⚡' : result?.isWinner ? '🏆' : result?.winnerId ? '💀' : '🤝'}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 8, color: isPrac ? 'var(--gold)' : result?.isWinner ? 'var(--teal)' : result?.winnerId ? 'var(--red)' : 'var(--muted2)' }}>
          {isPrac ? 'Practice done!' : result?.isWinner ? 'Lightning fast!' : result?.winnerId ? 'Too slow!' : "It's a draw!"}
        </div>
        {isPrac && <div style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--muted2)', marginBottom: 8 }}>{practiceCorrect}/15 correct · {practiceScore} pts</div>}
        {!isPrac && result?.isWinner && <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', marginBottom: 16 }}>+₦{(stakeNaira * 2 * 0.9).toLocaleString()}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 16 }}>
          {isPrac
            ? <Button variant="primary" full size="lg" onClick={() => { setPracticeScore(0); setPracticeCorrect(0); loadPracticeQ(0); setStatus('playing') }}>Practice again</Button>
            : <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          }
          <Button variant="ghost" full onClick={() => navigate('/games')}>Back to games</Button>
        </div>
      </div>
    )
  }

  const myScore = isPrac ? practiceScore : (scores[user?.id] || 0)
  const currentRound = isPrac ? practiceRound + 1 : round

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line2)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 800 }}>Speed Math {isPrac ? '(Practice)' : ''}</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>Q {currentRound} / {total}</div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{myScore} pts</div>
      </div>
      <div style={{ height: 3, background: 'var(--line2)' }}>
        <div style={{ height: 3, background: 'var(--red)', width: `${(currentRound / total) * 100}%`, transition: 'width 0.4s' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 56, fontWeight: 900, color: timeLeft <= 3 ? 'var(--red)' : 'var(--text)', marginBottom: 8, animation: timeLeft <= 3 ? 'pulse 0.8s ease infinite' : 'none', textShadow: timeLeft <= 3 ? '0 0 20px var(--red)' : 'none' }}>
          {timeLeft}
        </div>
        {question && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 44, fontWeight: 900, marginBottom: 36, color: feedback === 'correct' ? 'var(--teal)' : feedback === 'wrong' ? 'var(--red)' : 'var(--text)', transition: 'color 0.2s', animation: feedback === 'wrong' ? 'shake 0.4s ease' : feedback === 'correct' ? 'bounce 0.5s ease' : 'none' }}>
            {question.question}
          </div>
        )}
        {question && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 320 }}>
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
                style={{ height: 66, borderRadius: 14, fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 800, cursor: feedback ? 'default' : 'pointer', background: 'var(--surface2)', border: '2px solid var(--line2)', color: 'var(--text)', transition: 'all 0.15s' }}
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
