import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../services/socket'
import useAuthStore from '../context/authStore'

const LETTERS = ['A','B','C','D']
const TIMER_MAX = 15

export default function Game() {
  const { roomId }    = useParams()
  const location      = useLocation()
  const navigate      = useNavigate()
  const user          = useAuthStore(s => s.user)

  const [phase,       setPhase]       = useState('waiting')   // waiting | countdown | playing | ended
  const [countdown,   setCountdown]   = useState(3)
  const [question,    setQuestion]    = useState(null)
  const [qIndex,      setQIndex]      = useState(0)
  const [qTotal,      setQTotal]      = useState(10)
  const [timeLeft,    setTimeLeft]    = useState(TIMER_MAX)
  const [answered,    setAnswered]    = useState(false)
  const [selected,    setSelected]    = useState(null)         // 'a','b','c','d'
  const [correctAns,  setCorrectAns]  = useState(null)
  const [score,       setScore]       = useState(0)
  const [opponents,   setOpponents]   = useState([])
  const [result,      setResult]      = useState(null)

  const timerRef  = useRef(null)
  const stateInfo = location.state || {}

  useEffect(() => {
    const socket = getSocket()
    if (!socket) { navigate('/lobby'); return }

    socket.emit('join_room', { roomId })

    socket.on('player_joined', ({ players }) => {
      setOpponents(players.filter(p => p.userId !== user.id))
    })

    socket.on('game_starting', ({ countdown: c }) => {
      setPhase('countdown')
      let tick = c
      setCountdown(tick)
      const iv = setInterval(() => {
        tick--
        setCountdown(tick)
        if (tick <= 0) { clearInterval(iv); setPhase('playing') }
      }, 1000)
    })

    socket.on('question', (q) => {
      setQuestion(q)
      setQIndex(q.index)
      setQTotal(q.total)
      setAnswered(false)
      setSelected(null)
      setCorrectAns(null)
      setTimeLeft(q.timeLimit || TIMER_MAX)
      startTimer(q.timeLimit || TIMER_MAX)
    })

    socket.on('answer_result', ({ isCorrect, correctAnswer, points, totalScore }) => {
      setCorrectAns(correctAnswer)
      setScore(totalScore)
    })

    socket.on('question_ended', ({ correctAnswer }) => {
      setCorrectAns(correctAnswer)
      clearTimer()
    })

    socket.on('score_update', ({ userId, score: s }) => {
      if (userId !== user.id) {
        setOpponents(prev => prev.map(p => p.userId === userId ? { ...p, score: s } : p))
      }
    })

    socket.on('game_ended', (data) => {
      setPhase('ended')
      setResult(data)
      setTimeout(() => {
        navigate('/results', { state: { result: data, stakeNaira: stateInfo.stakeNaira } })
      }, 2000)
    })

    socket.on('error', ({ message }) => {
      navigate('/lobby')
    })

    return () => {
      socket.off('player_joined')
      socket.off('game_starting')
      socket.off('question')
      socket.off('answer_result')
      socket.off('question_ended')
      socket.off('score_update')
      socket.off('game_ended')
      socket.off('error')
    }
  }, [roomId])

  const startTimer = (limit) => {
    clearTimer()
    let t = limit
    timerRef.current = setInterval(() => {
      t--
      setTimeLeft(t)
      if (t <= 0) clearTimer()
    }, 1000)
  }

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const submitAnswer = (letter) => {
    if (answered || !question) return
    setAnswered(true)
    setSelected(letter)
    const responseTimeMs = (TIMER_MAX - timeLeft) * 1000
    clearTimer()
    getSocket()?.emit('submit_answer', { roomId, questionIndex: qIndex, answer: letter, responseTimeMs })
  }

  const timerPct = timeLeft / TIMER_MAX
  const circumference = 251
  const strokeOffset  = circumference - (circumference * timerPct)
  const timerColor    = timeLeft > 5 ? 'var(--blue)' : timeLeft > 3 ? 'var(--amber)' : 'var(--red)'

  const getAnswerStyle = (letter) => {
    const base = {
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--r)', cursor: answered ? 'default' : 'pointer',
      transition: 'border-color .15s, background .15s', width: '100%', color: 'var(--text)',
      fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500,
    }
    if (!answered && !correctAns) {
      if (selected === letter) return { ...base, borderColor: 'var(--blue)', background: 'var(--blue-dim)' }
      return base
    }
    if (correctAns === letter)  return { ...base, borderColor: 'var(--green)', background: 'var(--green-dim)' }
    if (selected   === letter && selected !== correctAns) return { ...base, borderColor: 'var(--red)', background: 'var(--red-dim)' }
    return { ...base, opacity: 0.5 }
  }

  if (phase === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <div style={{ fontWeight: 600 }}>Waiting for players...</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{stateInfo.category} · ₦{(stateInfo.stakeNaira || 0).toLocaleString()} stake</div>
        {opponents.map(o => (
          <div key={o.userId} style={{ fontSize: 13, color: 'var(--green)' }}>✓ {o.username} joined</div>
        ))}
      </div>
    )
  }

  if (phase === 'countdown') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 80, fontWeight: 800, color: 'var(--blue)', animation: 'pop .4s ease' }}>{countdown}</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>Get ready!</div>
      </div>
    )
  }

  if (phase === 'ended') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800 }}>Game over</div>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>Loading results...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* TOP BAR */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', background: 'var(--surface)' }}>
        <span className="tag tag-blue" style={{ gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'blink 1.4s ease infinite', display: 'inline-block' }} />
          Live
        </span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Q {qIndex + 1} / {qTotal}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--amber)' }}>
            ₦{Math.round((stateInfo.stakeNaira || 0) * 2 * 0.9).toLocaleString()} prize
          </div>
        </div>
        <span className="tag tag-amber" style={{ fontFamily: 'var(--mono)' }}>
          {score} pts
        </span>
      </div>

      {/* PROGRESS */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${((qIndex) / qTotal) * 100}%` }} />
      </div>

      {/* TIMER */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 12px' }}>
        <div style={{ position: 'relative', width: 88, height: 88 }}>
          <svg viewBox="0 0 80 80" width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r="36" fill="none" stroke="var(--line)" strokeWidth="4" />
            <circle
              cx="40" cy="40" r="36"
              fill="none" stroke={timerColor} strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 600 }}>
            {timeLeft}
          </div>
        </div>
      </div>

      {/* QUESTION */}
      {question && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            {stateInfo.category}
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.55 }}>{question.question}</div>
        </div>
      )}

      {/* ANSWERS */}
      {question && (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {Object.entries(question.options).map(([letter, text]) => (
            <button key={letter} style={getAnswerStyle(letter)} onClick={() => submitAnswer(letter)}>
              <div style={{ width: 26, height: 26, borderRadius: 4, background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', flexShrink: 0 }}>
                {letter.toUpperCase()}
              </div>
              <span>{text}</span>
            </button>
          ))}
        </div>
      )}

      {/* POWER-UPS */}
      <div style={{ padding: '0 20px', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { icon: '⏱', label: '10 coins', title: 'Extra time'   },
          { icon: '⊘', label: '20 coins', title: '50/50'         },
          { icon: '↷', label: '15 coins', title: 'Skip'          },
          { icon: '◈', label: '30 coins', title: 'Shield'        },
        ].map(pu => (
          <div key={pu.title} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '8px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 54 }}>
            <div style={{ fontSize: 16 }}>{pu.icon}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--amber)', fontWeight: 600 }}>{pu.label}</div>
          </div>
        ))}
      </div>

      {/* OPPONENTS */}
      {opponents.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 20px', scrollbarWidth: 'none' }}>
          {opponents.map(opp => (
            <div key={opp.userId} style={{ flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '4px 10px 4px 6px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue-dim)', border: '1px solid var(--blue-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--blue)' }}>
                {opp.username?.substring(0,2).toUpperCase()}
              </div>
              <span>{opp.username}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)' }}>{opp.score || 0}pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
