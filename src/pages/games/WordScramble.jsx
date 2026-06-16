import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../../services/socket'
import useAuthStore from '../../context/authStore'
import { Button } from '../../components/ui'
import DifficultyPicker from '../../components/game/DifficultyPicker'

const WORDS = {
  easy: [
    { word: 'CAT', hint: 'A small pet animal' },
    { word: 'BOOK', hint: 'You read this' },
    { word: 'FOOD', hint: 'Something you eat' },
    { word: 'GAME', hint: 'Something you play' },
    { word: 'LOVE', hint: 'A strong feeling' },
    { word: 'RAIN', hint: 'Water from the sky' },
    { word: 'GOLD', hint: 'A precious metal' },
    { word: 'FIRE', hint: 'Hot and bright' },
    { word: 'STAR', hint: 'Shines in the night sky' },
    { word: 'FISH', hint: 'Lives in water' },
    { word: 'TREE', hint: 'Has leaves and branches' },
    { word: 'CITY', hint: 'A large town' },
    { word: 'MILK', hint: 'White drink from a cow' },
    { word: 'SHIP', hint: 'Travels on water' },
    { word: 'RICE', hint: 'A staple food in Nigeria' },
  ],
  medium: [
    { word: 'NIGERIA', hint: 'West African country' },
    { word: 'CHAMPION', hint: 'Winner of a competition' },
    { word: 'STRATEGY', hint: 'A plan of action' },
    { word: 'FOOTBALL', hint: 'Most popular sport in Nigeria' },
    { word: 'ECONOMY', hint: 'System of trade and money' },
    { word: 'VICTORY', hint: 'Winning a contest' },
    { word: 'KEYBOARD', hint: 'Used for typing' },
    { word: 'PAYMENT', hint: 'Giving money for goods' },
    { word: 'QUESTION', hint: 'Something you ask' },
    { word: 'PLATFORM', hint: 'A raised surface or software base' },
    { word: 'NOLLYWOOD', hint: 'Nigerian film industry' },
    { word: 'TREASURE', hint: 'Hidden valuable things' },
    { word: 'ADVENTURE', hint: 'An exciting experience' },
    { word: 'COMMUNITY', hint: 'A group of people' },
    { word: 'COMPUTER', hint: 'Electronic device for processing data' },
  ],
  hard: [
    { word: 'TOURNAMENT', hint: 'A series of competitions' },
    { word: 'LEADERBOARD', hint: 'Ranking of top players' },
    { word: 'TECHNOLOGY', hint: 'Application of science' },
    { word: 'JAVASCRIPT', hint: 'Popular programming language' },
    { word: 'CRYPTOCURRENCY', hint: 'Digital currency like Bitcoin' },
    { word: 'ENTREPRENEUR', hint: 'Someone who starts a business' },
    { word: 'INFRASTRUCTURE', hint: 'Basic systems of a country' },
    { word: 'ACCOUNTABILITY', hint: 'Being responsible for your actions' },
    { word: 'PHARMACEUTICAL', hint: 'Related to medicine and drugs' },
    { word: 'INDEPENDENCE', hint: 'Nigeria achieved this in 1960' },
    { word: 'CHAMPIONSHIP', hint: 'Final competition to determine best' },
    { word: 'COMMUNICATION', hint: 'Sharing information with others' },
    { word: 'METROPOLITAN', hint: 'Relating to a large city' },
    { word: 'AUTHORIZATION', hint: 'Official permission' },
    { word: 'ENTERTAINMENT', hint: 'Movies, music, and fun activities' },
  ],
}

const TIMER_BY_DIFF = { easy: 45, medium: 30, hard: 15 }
const DIFF_COLORS   = { easy: 'var(--teal)', medium: 'var(--gold)', hard: 'var(--red)' }

const scramble = (word) => {
  const arr = word.split('')
  for (let i = arr.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]]
  }
  return arr.join('') === word ? scramble(word) : arr.join('')
}

const shuffle = arr => [...arr].sort(() => Math.random()-0.5)

export default function WordScramble() {
  const { roomId }  = useParams()
  const location    = useLocation()
  const navigate    = useNavigate()
  const user        = useAuthStore(s => s.user)
  const inputRef    = useRef(null)
  const timerRef    = useRef(null)

  const { stakeNaira = 0, isPractice } = location.state || {}
  const isPrac = isPractice || roomId?.startsWith('practice')

  const [difficulty,     setDifficulty]     = useState(null)
  const [phase,          setPhase]          = useState(isPrac ? 'select-difficulty' : 'waiting')
  const [practiceWords,  setPracticeWords]  = useState([])
  const [round,          setRound]          = useState(null)
  const [guess,          setGuess]          = useState('')
  const [scores,         setScores]         = useState({})
  const [feedback,       setFeedback]       = useState(null)
  const [timeLeft,       setTimeLeft]       = useState(30)
  const [status,         setStatus]         = useState('idle')
  const [result,         setResult]         = useState(null)
  const [lastWord,       setLastWord]       = useState(null)
  const [practiceScore,  setPracticeScore]  = useState(0)
  const [practiceCorrect,setPracticeCorrect]= useState(0)

  const startPractice = (diff) => {
    setDifficulty(diff)
    const words = shuffle(WORDS[diff]).slice(0, 8)
    setPracticeWords(words)
    setPhase('playing')
    setStatus('playing')
    setPracticeScore(0)
    setPracticeCorrect(0)
    loadPracticeWord(words, 0, TIMER_BY_DIFF[diff])
  }

  const loadPracticeWord = (words, index, timerMax) => {
    if (index >= words.length) { setStatus('ended'); return }
    const w = words[index]
    setRound({ index, total: words.length, scrambled: scramble(w.word), hint: w.hint, length: w.word.length, word: w.word })
    setGuess(''); setFeedback(null); setLastWord(null); setTimeLeft(timerMax)
    clearInterval(timerRef.current)
    let t = timerMax
    timerRef.current = setInterval(() => {
      t--; setTimeLeft(t)
      if (t <= 0) {
        clearInterval(timerRef.current)
        setLastWord(words[index].word)
        setFeedback('timeout')
        setTimeout(() => loadPracticeWord(words, index+1, timerMax), 1500)
      }
    }, 1000)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const submitPracticeGuess = (e) => {
    e?.preventDefault()
    if (!guess.trim() || !round) return
    if (guess.trim().toUpperCase() === round.word) {
      clearInterval(timerRef.current)
      const timerMax = TIMER_BY_DIFF[difficulty]
      const pts = 100 + timeLeft * (difficulty === 'hard' ? 20 : difficulty === 'medium' ? 10 : 5)
      setPracticeScore(s => s+pts); setPracticeCorrect(c => c+1)
      setLastWord(round.word); setFeedback('correct'); setGuess('')
      setTimeout(() => loadPracticeWord(practiceWords, round.index+1, timerMax), 1200)
    } else {
      setFeedback('wrong')
      setTimeout(() => setFeedback(null), 600)
    }
  }

  // Multiplayer
  useEffect(() => {
    if (isPrac) return
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }
    socket.emit('word:join', { roomId })
    socket.on('word:countdown', () => setPhase('countdown'))
    socket.on('word:round', (data) => {
      setRound(data); setGuess(''); setFeedback(null); setLastWord(null)
      setTimeLeft(data.timeLimit); setStatus('playing')
      clearInterval(timerRef.current)
      let t = data.timeLimit
      timerRef.current = setInterval(() => { t--; setTimeLeft(t); if(t<=0) clearInterval(timerRef.current) }, 1000)
      setTimeout(() => inputRef.current?.focus(), 100)
    })
    socket.on('word:correct', ({ playerId, word, scores }) => {
      setScores(scores); setLastWord(word)
      if (playerId === user.id) { setFeedback('correct'); setGuess('') }
      clearInterval(timerRef.current)
    })
    socket.on('word:wrong',   () => { setFeedback('wrong'); setTimeout(() => setFeedback(null), 600) })
    socket.on('word:timeout', ({ word }) => { setLastWord(word); clearInterval(timerRef.current) })
    socket.on('word:ended',   (data) => { setResult({ ...data, isWinner: data.winnerId === user.id }); setStatus('ended') })
    return () => {
      clearInterval(timerRef.current)
      socket.off('word:countdown'); socket.off('word:round'); socket.off('word:correct')
      socket.off('word:wrong'); socket.off('word:timeout'); socket.off('word:ended')
    }
  }, [roomId, isPrac])

  const submitMultiGuess = (e) => {
    e?.preventDefault()
    if (!guess.trim()) return
    getSocket()?.emit('word:guess', { roomId, guess: guess.trim() })
  }

  const diffColor = DIFF_COLORS[difficulty] || 'var(--gold)'
  const myScore = isPrac ? practiceScore : (scores[user?.id] || 0)

  // DIFFICULTY SELECT
  if (phase === 'select-difficulty') {
    return <DifficultyPicker gameName="Word Scramble" onSelect={startPractice} onBack={() => navigate('/games')} />
  }

  // WAITING
  if (!isPrac && (phase === 'waiting' || phase === 'countdown')) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ fontSize:48 }}>🔤</div>
        <div style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:700 }}>{phase==='countdown' ? 'Get ready!' : 'Waiting for opponent...'}</div>
        <div className="spinner" style={{ width:32, height:32 }} />
      </div>
    )
  }

  // ENDED
  if (status === 'ended') {
    if (isPrac) {
      return (
        <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎯</div>
          <div style={{ fontFamily:'var(--display)', fontSize:26, fontWeight:800, marginBottom:8 }}>Practice complete!</div>
          {difficulty && <div style={{ marginBottom:12 }}><span style={{ background:`${diffColor}18`, border:`1px solid ${diffColor}44`, borderRadius:100, padding:'3px 12px', fontSize:11, fontFamily:'var(--display)', fontWeight:700, color:diffColor }}>{difficulty}</span></div>}
          <div style={{ fontFamily:'var(--mono)', fontSize:16, color:'var(--muted2)', marginBottom:8 }}>{practiceCorrect} / {practiceWords.length} correct · {practiceScore} pts</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300, marginTop:20 }}>
            <Button variant="primary" full size="lg" onClick={() => startPractice(difficulty)}>Try again</Button>
            <Button variant="ghost" full onClick={() => setPhase('select-difficulty')}>Change difficulty</Button>
            <Button variant="ghost" full onClick={() => navigate('/games')}>Back to games</Button>
          </div>
        </div>
      )
    }
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>{!result?.winnerId ? '🤝' : result?.isWinner ? '🏆' : '💀'}</div>
        <div style={{ fontFamily:'var(--display)', fontSize:28, fontWeight:800, color:!result?.winnerId?'var(--muted2)':result?.isWinner?'var(--teal)':'var(--red)', marginBottom:8 }}>
          {!result?.winnerId ? "Draw!" : result?.isWinner ? 'You won!' : 'You lost'}
        </div>
        {result?.isWinner && <div style={{ fontFamily:'var(--mono)', fontSize:36, fontWeight:700, color:'var(--gold)', marginBottom:16 }}>+₦{(stakeNaira*2*0.9).toLocaleString()}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300, marginTop:16 }}>
          <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          <Button variant="ghost" full onClick={() => navigate('/dashboard')}>Home</Button>
        </div>
      </div>
    )
  }

  const borderColor = feedback==='correct' ? 'var(--teal)' : feedback==='wrong' ? 'var(--red)' : feedback==='timeout' ? 'var(--gold)' : 'var(--line2)'
  const bgColor     = feedback==='correct' ? 'var(--teal-dim)' : feedback==='wrong' ? 'var(--red-dim)' : 'var(--surface2)'

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line2)', background:'var(--surface)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:800 }}>Word Scramble</div>
          <div style={{ fontSize:11, color:'var(--muted2)' }}>Word {(round?.index||0)+1} of {round?.total||8}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isPrac && difficulty && <span style={{ background:`${diffColor}18`, border:`1px solid ${diffColor}44`, borderRadius:100, padding:'3px 10px', fontSize:10, fontFamily:'var(--display)', fontWeight:700, color:diffColor }}>{difficulty}</span>}
          <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:700, color:'var(--gold)' }}>{myScore} pts</div>
        </div>
      </div>
      <div style={{ height:3, background:'var(--line2)' }}>
        <div style={{ height:3, background:diffColor, width:`${(((round?.index||0))/(round?.total||8))*100}%`, transition:'width 0.4s' }} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:52, fontWeight:900, color: timeLeft<=5 ? 'var(--red)' : diffColor, marginBottom:6, animation: timeLeft<=5 ? 'pulse 0.8s ease infinite' : 'none' }}>
          {timeLeft}s
        </div>
        {round && <div style={{ fontSize:12, color:'var(--muted)', fontStyle:'italic', marginBottom:16 }}>Hint: {round.hint}</div>}
        {round && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', marginBottom:20 }}>
            {round.scrambled.split('').map((letter, i) => (
              <div key={i} style={{ width:44, height:50, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface2)', border:`2px solid ${diffColor}44`, borderRadius:10, fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:diffColor, animation:`popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i*0.04}s both` }}>
                {letter}
              </div>
            ))}
          </div>
        )}
        {round && (
          <div style={{ display:'flex', gap:5, marginBottom:20 }}>
            {Array(round.length).fill(null).map((_,i) => (
              <div key={i} style={{ width:24, height:3, background:'var(--line2)', borderRadius:2 }} />
            ))}
          </div>
        )}
        {lastWord && (
          <div style={{ marginBottom:14, animation:'popIn 0.4s ease', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>Answer</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:800, color:'var(--teal)' }}>{lastWord}</div>
          </div>
        )}
        <form onSubmit={isPrac ? submitPracticeGuess : submitMultiGuess} style={{ width:'100%', maxWidth:340 }}>
          <input
            ref={inputRef}
            value={guess}
            onChange={e => setGuess(e.target.value.toUpperCase())}
            placeholder="Type your answer..."
            autoComplete="off"
            disabled={!!feedback && feedback !== 'wrong'}
            style={{ width:'100%', height:56, padding:'0 20px', background:bgColor, border:`2px solid ${borderColor}`, borderRadius:14, color:'var(--text)', fontFamily:'var(--mono)', fontSize:20, fontWeight:700, outline:'none', textAlign:'center', letterSpacing:4, transition:'all 0.2s', animation: feedback==='wrong' ? 'shake 0.4s ease' : 'none' }}
          />
          <Button type="submit" variant="primary" full size="lg" style={{ marginTop:12, background:`linear-gradient(135deg, ${diffColor}, ${diffColor}CC)` }}>
            Submit
          </Button>
        </form>
      </div>
    </div>
  )
}
