import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../../services/socket'
import useAuthStore from '../../context/authStore'
import { Button } from '../../components/ui'

export default function WordScramble() {
  const { roomId }  = useParams()
  const location    = useLocation()
  const navigate    = useNavigate()
  const user        = useAuthStore(s => s.user)
  const inputRef    = useRef(null)

  const [status,    setStatus]    = useState('waiting')
  const [round,     setRound]     = useState(null)
  const [guess,     setGuess]     = useState('')
  const [scores,    setScores]    = useState({})
  const [feedback,  setFeedback]  = useState(null) // 'correct' | 'wrong'
  const [timeLeft,  setTimeLeft]  = useState(30)
  const [result,    setResult]    = useState(null)
  const [lastWord,  setLastWord]  = useState(null)

  const { stakeNaira = 0 } = location.state || {}
  const timerRef = useRef(null)

  useEffect(() => {
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }

    socket.emit('word:join', { roomId })

    socket.on('word:countdown', () => setStatus('countdown'))

    socket.on('word:round', (data) => {
      setRound(data)
      setGuess('')
      setFeedback(null)
      setLastWord(null)
      setTimeLeft(data.timeLimit)
      setStatus('playing')
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
      setTimeout(() => inputRef.current?.focus(), 100)
    })

    socket.on('word:correct', ({ playerId, word, scores }) => {
      setScores(scores)
      setLastWord(word)
      if (playerId === user.id) {
        setFeedback('correct')
        setGuess('')
      }
      clearInterval(timerRef.current)
    })

    socket.on('word:wrong', () => {
      setFeedback('wrong')
      setTimeout(() => setFeedback(null), 600)
    })

    socket.on('word:timeout', ({ word }) => {
      setLastWord(word)
      clearInterval(timerRef.current)
    })

    socket.on('word:ended', (data) => {
      setResult({ ...data, isWinner: data.winnerId === user.id })
      setStatus('ended')
      clearInterval(timerRef.current)
    })

    return () => {
      clearInterval(timerRef.current)
      socket.off('word:countdown')
      socket.off('word:round')
      socket.off('word:correct')
      socket.off('word:wrong')
      socket.off('word:timeout')
      socket.off('word:ended')
    }
  }, [roomId])

  const submitGuess = (e) => {
    e.preventDefault()
    if (!guess.trim()) return
    getSocket()?.emit('word:guess', { roomId, guess: guess.trim() })
  }

  const myScore = scores[user?.id] || 0

  if (status === 'waiting' || status === 'countdown') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔤</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>
          {status === 'countdown' ? 'Get ready!' : 'Waiting for opponent...'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted2)' }}>₦{stakeNaira.toLocaleString()} stake · 8 words</div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (status === 'ended' && result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16, animation: 'popIn 0.6s ease' }}>
          {!result.winnerId ? '🤝' : result.isWinner ? '🏆' : '💀'}
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 30, fontWeight: 800, marginBottom: 8, color: !result.winnerId ? 'var(--muted2)' : result.isWinner ? 'var(--teal)' : 'var(--red)' }}>
          {!result.winnerId ? "It's a draw!" : result.isWinner ? 'You won!' : 'You lost'}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: 'var(--muted2)', marginBottom: 8 }}>
          Your score: {myScore} pts
        </div>
        {result.isWinner && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', textShadow: '0 0 20px var(--gold-glow)', marginBottom: 8 }}>
            +₦{(stakeNaira * 2 * 0.9).toLocaleString()}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 24 }}>
          <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          <Button variant="ghost" full onClick={() => navigate('/dashboard')}>Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line2)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 800 }}>Word Scramble</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>Round {round?.index + 1} of {round?.total}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{myScore} pts</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>your score</div>
        </div>
      </div>

      {/* PROGRESS */}
      <div style={{ height: 3, background: 'var(--line2)' }}>
        <div style={{ height: 3, background: 'var(--gold)', width: `${((round?.index || 0) / (round?.total || 1)) * 100}%`, transition: 'width 0.4s' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        {/* TIMER */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 48, fontWeight: 800, color: timeLeft <= 5 ? 'var(--red)' : 'var(--muted2)', marginBottom: 8, transition: 'color 0.3s', animation: timeLeft <= 5 ? 'pulse 1s ease infinite' : 'none' }}>
          {timeLeft}s
        </div>

        {/* HINT */}
        {round && (
          <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 24 }}>
            Hint: {round.hint}
          </div>
        )}

        {/* SCRAMBLED WORD */}
        {round && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
            {round.scrambled.split('').map((letter, i) => (
              <div
                key={i}
                style={{
                  width: 48, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--surface2)', border: '2px solid var(--line2)',
                  borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800,
                  color: 'var(--gold)', animation: `popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.04}s both`,
                }}
              >
                {letter}
              </div>
            ))}
          </div>
        )}

        {/* ANSWER LENGTH HINT */}
        {round && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
            {Array(round.length).fill(null).map((_, i) => (
              <div key={i} style={{ width: 28, height: 3, background: 'var(--line2)', borderRadius: 2 }} />
            ))}
          </div>
        )}

        {/* LAST CORRECT WORD */}
        {lastWord && (
          <div style={{ marginBottom: 20, animation: 'popIn 0.4s ease' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, textAlign: 'center' }}>Answer was</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 800, color: 'var(--teal)', textAlign: 'center' }}>{lastWord}</div>
          </div>
        )}

        {/* INPUT */}
        <form onSubmit={submitGuess} style={{ width: '100%', maxWidth: 340 }}>
          <input
            ref={inputRef}
            value={guess}
            onChange={e => setGuess(e.target.value.toUpperCase())}
            placeholder="Type your answer..."
            autoComplete="off"
            autoCapitalize="characters"
            style={{
              width: '100%', height: 56, padding: '0 20px',
              background: feedback === 'correct' ? 'var(--teal-dim)' : feedback === 'wrong' ? 'var(--red-dim)' : 'var(--surface2)',
              border: `2px solid ${feedback === 'correct' ? 'var(--teal)' : feedback === 'wrong' ? 'var(--red)' : 'var(--line2)'}`,
              borderRadius: 14, color: 'var(--text)', fontFamily: 'var(--mono)',
              fontSize: 20, fontWeight: 700, outline: 'none', textAlign: 'center',
              letterSpacing: 4, transition: 'all 0.2s',
              animation: feedback === 'wrong' ? 'shake 0.4s ease' : 'none',
            }}
          />
          <Button type="submit" variant="gold" full size="lg" style={{ marginTop: 12 }}>
            Submit
          </Button>
        </form>
      </div>
    </div>
  )
}
