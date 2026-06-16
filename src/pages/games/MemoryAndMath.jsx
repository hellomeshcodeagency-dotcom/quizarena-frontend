import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../../services/socket'
import useAuthStore from '../../context/authStore'
import { Button } from '../../components/ui'
import DifficultyPicker from '../../components/game/DifficultyPicker'

// ── SHARED ────────────────────────────────────────────────
const DIFF_COLORS = { easy: 'var(--teal)', medium: 'var(--gold)', hard: 'var(--red)' }

// ── MEMORY MATCH ──────────────────────────────────────────
const EASY_EMOJIS   = ['🎯','💎','🔥','⚡','🎮','🏆','💰','🎪']
const MEDIUM_EMOJIS = ['🌟','🎭','🎸','🚀','🦁','🐯','🦊','🐺','🎨','🎲']
const HARD_EMOJIS   = ['🦋','🌊','🎺','🏰','🦅','🌋','🎻','🦄','🌈','🎠','🦜','🌺']

const GRID_BY_DIFF  = { easy: { pairs:6, cols:3 }, medium: { pairs:8, cols:4 }, hard: { pairs:12, cols:4 } }
const FLIP_DELAY    = { easy: 1500, medium: 1000, hard: 600 }

const createMemoryBoard = (diff) => {
  const cfg  = GRID_BY_DIFF[diff] || GRID_BY_DIFF.medium
  const pool = diff==='hard' ? HARD_EMOJIS : diff==='easy' ? EASY_EMOJIS : MEDIUM_EMOJIS
  const pairs = pool.slice(0, cfg.pairs)
  return [...pairs, ...pairs]
    .map((emoji,i) => ({ id:i, emoji, flipped:false, matched:false }))
    .sort(() => Math.random()-0.5)
    .map((card,i) => ({ ...card, position:i }))
}

export function MemoryMatch() {
  const { roomId } = useParams()
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)

  const { stakeNaira = 0, isPractice } = location.state || {}
  const isPrac = isPractice || roomId?.startsWith('practice')

  const [difficulty,  setDifficulty]  = useState(null)
  const [phase,       setPhase]       = useState(isPrac ? 'select-difficulty' : 'waiting')
  const [board,       setBoard]       = useState([])
  const [flipped,     setFlipped]     = useState([])
  const [matched,     setMatched]     = useState([])
  const [locked,      setLocked]      = useState(false)
  const [moves,       setMoves]       = useState(0)
  const [scores,      setScores]      = useState({})
  const [myTurn,      setMyTurn]      = useState(false)
  const [status,      setStatus]      = useState('idle')
  const [result,      setResult]      = useState(null)

  const startPractice = (diff) => {
    setDifficulty(diff)
    setPhase('playing')
    setBoard(createMemoryBoard(diff))
    setFlipped([]); setMatched([]); setLocked(false); setMoves(0); setResult(null)
    setStatus('playing')
  }

  const practiceFlip = (position) => {
    if (locked || status!=='playing') return
    if (matched.includes(position) || flipped.includes(position) || flipped.length>=2) return
    const newFlipped = [...flipped, position]
    setFlipped(newFlipped); setMoves(m => m+1)
    if (newFlipped.length === 2) {
      setLocked(true)
      const [p1,p2] = newFlipped
      if (board[p1].emoji === board[p2].emoji) {
        const newMatched = [...matched, p1, p2]
        setMatched(newMatched); setFlipped([]); setLocked(false)
        if (newMatched.length === board.length) setStatus('ended')
      } else {
        setTimeout(() => { setFlipped([]); setLocked(false) }, FLIP_DELAY[difficulty]||1000)
      }
    }
  }

  // Multiplayer
  useEffect(() => {
    if (isPrac) return
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }
    socket.emit('mem:join', { roomId })
    socket.on('mem:state',   ({ board:b, scores:s, currentTurn }) => { if(b) setBoard(b.map((c,i)=>({...c,position:i}))); setScores(s||{}); setMyTurn(currentTurn===user.id) })
    socket.on('mem:start',   ({ currentTurn }) => { setStatus('playing'); setMyTurn(currentTurn===user.id) })
    socket.on('mem:flip',    ({ position, emoji }) => { setBoard(prev => prev.map((c,i) => i===position ? {...c,flipped:true,emoji} : c)); setFlipped(prev => [...prev,position]) })
    socket.on('mem:match',   ({ positions, scores:s }) => { setMatched(prev => [...prev,...positions]); setFlipped([]); setScores(s) })
    socket.on('mem:nomatch', ({ positions, currentTurn }) => { setTimeout(() => { setBoard(prev => prev.map((c,i) => positions.includes(i) ? {...c,flipped:false,emoji:undefined} : c)); setFlipped([]); setMyTurn(currentTurn===user.id) }, 1000) })
    socket.on('mem:ended',   (data) => { setResult({...data,isWinner:data.winnerId===user.id}); setStatus('ended') })
    return () => { socket.off('mem:state'); socket.off('mem:start'); socket.off('mem:flip'); socket.off('mem:match'); socket.off('mem:nomatch'); socket.off('mem:ended') }
  }, [roomId, isPrac])

  const multiFlip = (position) => {
    if (!myTurn||status!=='playing') return
    if (flipped.length>=2||matched.includes(position)||flipped.includes(position)) return
    getSocket()?.emit('mem:flip', { roomId, position })
  }

  const handleFlip = (position) => isPrac ? practiceFlip(position) : multiFlip(position)

  const diffColor = DIFF_COLORS[difficulty] || 'var(--indigo)'
  const cfg = GRID_BY_DIFF[difficulty] || GRID_BY_DIFF.medium

  if (phase === 'select-difficulty') {
    return <DifficultyPicker gameName="Memory Match" onSelect={startPractice} onBack={() => navigate('/games')} />
  }

  if (!isPrac && status === 'waiting') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ fontSize:48 }}>🧩</div>
        <div style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:700 }}>Waiting for opponent...</div>
        <div className="spinner" style={{ width:32, height:32 }} />
      </div>
    )
  }

  if (status === 'ended') {
    const isWinner = isPrac ? true : result?.isWinner
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>{isPrac ? '🏅' : isWinner ? '🏆' : result?.winnerId ? '💀' : '🤝'}</div>
        <div style={{ fontFamily:'var(--display)', fontSize:26, fontWeight:800, marginBottom:8, color: isPrac?'var(--teal)':isWinner?'var(--teal)':result?.winnerId?'var(--red)':'var(--muted2)' }}>
          {isPrac ? `Done in ${moves} moves!` : isWinner ? 'You won!' : result?.winnerId ? 'You lost' : "It's a draw!"}
        </div>
        {isPrac && difficulty && <div style={{ marginBottom:10 }}><span style={{ background:`${diffColor}18`, border:`1px solid ${diffColor}44`, borderRadius:100, padding:'3px 12px', fontSize:11, fontFamily:'var(--display)', fontWeight:700, color:diffColor }}>{difficulty}</span></div>}
        {!isPrac && isWinner && <div style={{ fontFamily:'var(--mono)', fontSize:36, fontWeight:700, color:'var(--gold)', marginBottom:16 }}>+₦{(stakeNaira*2*0.9).toLocaleString()}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300, marginTop:16 }}>
          {isPrac
            ? <>
                <Button variant="primary" full size="lg" onClick={() => startPractice(difficulty)}>Play again</Button>
                <Button variant="ghost" full onClick={() => setPhase('select-difficulty')}>Change difficulty</Button>
              </>
            : <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          }
          <Button variant="ghost" full onClick={() => navigate('/games')}>Back to games</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line2)', background:'var(--surface)', display:'flex', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:800 }}>Memory Match</div>
          <div style={{ fontSize:11, color:'var(--muted2)' }}>{isPrac ? `${moves} moves · ${matched.length/2}/${cfg.pairs} pairs` : `${matched.length/2} / ${cfg.pairs} pairs`}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isPrac && difficulty && <span style={{ background:`${diffColor}18`, border:`1px solid ${diffColor}44`, borderRadius:100, padding:'3px 10px', fontSize:10, fontFamily:'var(--display)', fontWeight:700, color:diffColor }}>{difficulty}</span>}
          {!isPrac && <div style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:700, color:'var(--gold)' }}>{scores[user?.id]||0} pts</div>}
        </div>
      </div>
      {!isPrac && (
        <div style={{ padding:'8px 20px', textAlign:'center', background: myTurn ? 'var(--indigo-dim)' : 'var(--surface2)', borderBottom:'1px solid var(--line2)', transition:'background 0.3s' }}>
          <div style={{ fontFamily:'var(--display)', fontSize:13, fontWeight:700, color: myTurn ? 'var(--indigo-lt)' : 'var(--muted2)' }}>
            {myTurn ? '🎯 Your turn' : "⏳ Opponent's turn"}
          </div>
        </div>
      )}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${cfg.cols},1fr)`, gap:8, maxWidth:380, width:'100%' }}>
          {board.map((card,i) => {
            const isFlipped = isPrac ? (flipped.includes(i)||matched.includes(i)) : (card.flipped||matched.includes(i))
            const isMatched = matched.includes(i)
            return (
              <div
                key={i}
                onClick={() => handleFlip(i)}
                style={{ aspectRatio:'1', borderRadius:12, cursor: isMatched ? 'default' : 'pointer', background: isMatched ? `${diffColor}18` : isFlipped ? 'var(--surface3)' : 'var(--surface2)', border:`2px solid ${isMatched ? diffColor : isFlipped ? 'var(--line2)' : 'var(--line)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: cfg.pairs<=6 ? 30 : 24, transition:'all 0.3s', userSelect:'none', boxShadow: isMatched ? `0 0 12px ${diffColor}44` : 'none', animation: isFlipped&&!isMatched ? 'popIn 0.25s ease' : 'none' }}
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
const MATH_CONFIG = {
  easy:   { rounds:10, timePerQ:15, ops:['+','-'],         maxNum:20  },
  medium: { rounds:15, timePerQ:10, ops:['+','-','×'],     maxNum:50  },
  hard:   { rounds:20, timePerQ:6,  ops:['+','-','×','÷'], maxNum:100 },
}

const generateQ = (diff, round) => {
  const cfg = MATH_CONFIG[diff] || MATH_CONFIG.medium
  const op  = cfg.ops[Math.floor(Math.random()*cfg.ops.length)]
  let a, b, answer
  const max = Math.min(cfg.maxNum, 10 + round*3)
  switch(op) {
    case '+': a=Math.floor(Math.random()*max)+1; b=Math.floor(Math.random()*max)+1; answer=a+b; break
    case '-': a=Math.floor(Math.random()*max)+10; b=Math.floor(Math.random()*a)+1; answer=a-b; break
    case '×': a=Math.floor(Math.random()*(diff==='hard'?20:12))+2; b=Math.floor(Math.random()*12)+2; answer=a*b; break
    case '÷': b=Math.floor(Math.random()*11)+2; answer=Math.floor(Math.random()*10)+2; a=b*answer; break
  }
  const opts = new Set([answer])
  while(opts.size < 4) {
    const w = answer + (Math.floor(Math.random()*10)-5)
    if (w!==answer && w>0) opts.add(w)
  }
  return { question:`${a} ${op} ${b} = ?`, answer, options:[...opts].sort(()=>Math.random()-0.5) }
}

export function SpeedMath() {
  const { roomId } = useParams()
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)
  const timerRef   = useRef(null)

  const { stakeNaira = 0, isPractice } = location.state || {}
  const isPrac = isPractice || roomId?.startsWith('practice')

  const [difficulty,     setDifficulty]     = useState(null)
  const [phase,          setPhase]          = useState(isPrac ? 'select-difficulty' : 'waiting')
  const [status,         setStatus]         = useState('idle')
  const [question,       setQuestion]       = useState(null)
  const [practiceRound,  setPracticeRound]  = useState(0)
  const [round,          setRound]          = useState(0)
  const [total,          setTotal]          = useState(15)
  const [timeLeft,       setTimeLeft]       = useState(10)
  const [feedback,       setFeedback]       = useState(null)
  const [scores,         setScores]         = useState({})
  const [result,         setResult]         = useState(null)
  const [practiceScore,  setPracticeScore]  = useState(0)
  const [practiceCorrect,setPracticeCorrect]= useState(0)

  const startPractice = (diff) => {
    setDifficulty(diff)
    setPracticeScore(0); setPracticeCorrect(0); setPracticeRound(0)
    setPhase('playing'); setStatus('playing')
    loadPracticeQ(diff, 0)
  }

  const loadPracticeQ = (diff, r) => {
    const cfg = MATH_CONFIG[diff]
    if (r >= cfg.rounds) { setStatus('ended'); return }
    const q = generateQ(diff, r)
    setQuestion(q); setFeedback(null); setTimeLeft(cfg.timePerQ); setPracticeRound(r)
    clearInterval(timerRef.current)
    let t = cfg.timePerQ
    timerRef.current = setInterval(() => {
      t--; setTimeLeft(t)
      if (t <= 0) { clearInterval(timerRef.current); setFeedback('timeout'); setTimeout(() => loadPracticeQ(diff, r+1), 1000) }
    }, 1000)
  }

  const practiceAnswer = (val) => {
    if (feedback) return
    clearInterval(timerRef.current)
    const correct = val === question.answer
    const pts = correct ? (100 + timeLeft * (difficulty==='hard'?20:difficulty==='medium'?10:5)) : 0
    if (correct) { setPracticeScore(s => s+pts); setPracticeCorrect(c => c+1) }
    setFeedback(correct ? 'correct' : 'wrong')
    setTimeout(() => loadPracticeQ(difficulty, practiceRound+1), 800)
  }

  // Multiplayer
  useEffect(() => {
    if (isPrac) return
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }
    socket.emit('math:join', { roomId })
    socket.on('math:countdown', () => setPhase('countdown'))
    socket.on('math:question',  (data) => { setQuestion(data); setRound(data.round); setTotal(data.total); setFeedback(null); setTimeLeft(data.timeLimit); setStatus('playing'); clearInterval(timerRef.current); let t=data.timeLimit; timerRef.current=setInterval(()=>{t--;setTimeLeft(t);if(t<=0)clearInterval(timerRef.current)},1000) })
    socket.on('math:result',    ({ correct, totalScore }) => { setFeedback(correct?'correct':'wrong'); setScores(prev=>({...prev,[user.id]:totalScore})); setTimeout(()=>setFeedback(null),800) })
    socket.on('math:scores',    ({ scores:s }) => setScores(s))
    socket.on('math:timeout',   () => { clearInterval(timerRef.current); setFeedback('timeout') })
    socket.on('math:ended',     (data) => { setResult({...data,isWinner:data.winnerId===user.id}); setStatus('ended'); clearInterval(timerRef.current) })
    return () => { clearInterval(timerRef.current); socket.off('math:countdown'); socket.off('math:question'); socket.off('math:result'); socket.off('math:scores'); socket.off('math:timeout'); socket.off('math:ended') }
  }, [roomId, isPrac])

  const multiAnswer = (val) => {
    if (status!=='playing'||feedback) return
    getSocket()?.emit('math:answer', { roomId, answer:val })
  }

  const handleAnswer = (val) => isPrac ? practiceAnswer(val) : multiAnswer(val)

  const diffColor = DIFF_COLORS[difficulty] || 'var(--red)'
  const cfg       = MATH_CONFIG[difficulty] || MATH_CONFIG.medium
  const myScore   = isPrac ? practiceScore : (scores[user?.id]||0)
  const curRound  = isPrac ? practiceRound+1 : round
  const curTotal  = isPrac ? cfg.rounds : total
  const timerMax  = isPrac ? cfg.timePerQ : (question?.timeLimit||10)

  if (phase === 'select-difficulty') {
    return <DifficultyPicker gameName="Speed Math" onSelect={startPractice} onBack={() => navigate('/games')} />
  }

  if (!isPrac && (phase === 'waiting' || phase === 'countdown')) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ fontSize:48 }}>⚡</div>
        <div style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:700 }}>{phase==='countdown' ? 'Get ready!' : 'Waiting for opponent...'}</div>
        <div className="spinner" style={{ width:32, height:32 }} />
      </div>
    )
  }

  if (status === 'ended') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>{isPrac ? '⚡' : result?.isWinner ? '🏆' : result?.winnerId ? '💀' : '🤝'}</div>
        <div style={{ fontFamily:'var(--display)', fontSize:26, fontWeight:800, marginBottom:8, color: isPrac?diffColor:result?.isWinner?'var(--teal)':result?.winnerId?'var(--red)':'var(--muted2)' }}>
          {isPrac ? 'Practice done!' : result?.isWinner ? 'Lightning fast!' : result?.winnerId ? 'Too slow!' : "Draw!"}
        </div>
        {isPrac && <div style={{ fontFamily:'var(--mono)', fontSize:16, color:'var(--muted2)', marginBottom:8 }}>{practiceCorrect}/{cfg.rounds} correct · {practiceScore} pts</div>}
        {isPrac && difficulty && <div style={{ marginBottom:10 }}><span style={{ background:`${diffColor}18`, border:`1px solid ${diffColor}44`, borderRadius:100, padding:'3px 12px', fontSize:11, fontFamily:'var(--display)', fontWeight:700, color:diffColor }}>{difficulty}</span></div>}
        {!isPrac && result?.isWinner && <div style={{ fontFamily:'var(--mono)', fontSize:36, fontWeight:700, color:'var(--gold)', marginBottom:16 }}>+₦{(stakeNaira*2*0.9).toLocaleString()}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300, marginTop:16 }}>
          {isPrac
            ? <>
                <Button variant="primary" full size="lg" onClick={() => startPractice(difficulty)}>Try again</Button>
                <Button variant="ghost" full onClick={() => setPhase('select-difficulty')}>Change difficulty</Button>
              </>
            : <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          }
          <Button variant="ghost" full onClick={() => navigate('/games')}>Back to games</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line2)', background:'var(--surface)', display:'flex', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:800 }}>Speed Math</div>
          <div style={{ fontSize:11, color:'var(--muted2)' }}>Q {curRound} / {curTotal}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isPrac && difficulty && <span style={{ background:`${diffColor}18`, border:`1px solid ${diffColor}44`, borderRadius:100, padding:'3px 10px', fontSize:10, fontFamily:'var(--display)', fontWeight:700, color:diffColor }}>{difficulty}</span>}
          <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:700, color:'var(--gold)' }}>{myScore} pts</div>
        </div>
      </div>
      <div style={{ height:3, background:'var(--line2)' }}>
        <div style={{ height:3, background:diffColor, width:`${(curRound/curTotal)*100}%`, transition:'width 0.4s' }} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:56, fontWeight:900, color: timeLeft<=3?'var(--red)':diffColor, marginBottom:8, animation: timeLeft<=3?'pulse 0.8s ease infinite':'none', textShadow: timeLeft<=3?'0 0 20px var(--red)':'none' }}>
          {timeLeft}
        </div>
        {question && (
          <div style={{ fontFamily:'var(--mono)', fontSize:44, fontWeight:900, marginBottom:36, color: feedback==='correct'?'var(--teal)':feedback==='wrong'?'var(--red)':'var(--text)', transition:'color 0.2s', animation: feedback==='wrong'?'shake 0.4s ease':feedback==='correct'?'bounce 0.5s ease':'none' }}>
            {question.question}
          </div>
        )}
        {question && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, width:'100%', maxWidth:320 }}>
            {question.options.map((opt,i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
                style={{ height:66, borderRadius:14, fontFamily:'var(--mono)', fontSize:26, fontWeight:800, cursor:feedback?'default':'pointer', background:'var(--surface2)', border:`2px solid ${diffColor}33`, color:'var(--text)', transition:'all 0.15s' }}
                onMouseEnter={e => { if(!feedback) { e.currentTarget.style.borderColor=diffColor; e.currentTarget.style.background=`${diffColor}18`; e.currentTarget.style.transform='scale(1.05)' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=`${diffColor}33`; e.currentTarget.style.background='var(--surface2)'; e.currentTarget.style.transform='scale(1)' }}
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
