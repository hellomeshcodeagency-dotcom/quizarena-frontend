import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../services/socket'
import useAuthStore from '../context/authStore'

const TIMER_MAX = 15

// Practice questions when no socket available
const PRACTICE_QUESTIONS = {
  Sports: [
    { question: "Which Nigerian footballer is nicknamed Jay-Jay?", options: { a: "Nwankwo Kanu", b: "Jay-Jay Okocha", c: "Rashidi Yekini", d: "Sunday Oliseh" }, correct: 'b' },
    { question: "Nigeria won Olympic football gold in which year?", options: { a: "1992", b: "1996", c: "2000", d: "2004" }, correct: 'b' },
    { question: "How many times has Nigeria won AFCON?", options: { a: "1", b: "2", c: "3", d: "4" }, correct: 'c' },
    { question: "Who scored Nigeria's first World Cup goal in 1994?", options: { a: "Rashidi Yekini", b: "Jay-Jay Okocha", c: "Emmanuel Amuneke", d: "Daniel Amokachi" }, correct: 'a' },
    { question: "Which Nigerian club won CAF Champions League 2003 and 2004?", options: { a: "Rangers", b: "Shooting Stars", c: "Enyimba FC", d: "Heartland" }, correct: 'c' },
    { question: "What is Nigeria's national football team nickname?", options: { a: "Golden Lions", b: "Super Eagles", c: "Green Panthers", d: "Flying Stars" }, correct: 'b' },
    { question: "The Moshood Abiola Stadium is in which city?", options: { a: "Lagos", b: "Kano", c: "Abuja", d: "Port Harcourt" }, correct: 'c' },
    { question: "Which Nigerian player was part of Arsenal's Invincibles?", options: { a: "Jay-Jay Okocha", b: "Nwankwo Kanu", c: "Sunday Oliseh", d: "Daniel Amokachi" }, correct: 'b' },
    { question: "Victor Osimhen joined which club after Napoli?", options: { a: "Chelsea", b: "Arsenal", c: "Galatasaray", d: "PSG" }, correct: 'c' },
    { question: "Nigeria first qualified for the World Cup in which year?", options: { a: "1990", b: "1994", c: "1998", d: "2002" }, correct: 'b' },
  ],
  Science: [
    { question: "What is the chemical symbol for Gold?", options: { a: "Go", b: "Gd", c: "Au", d: "Ag" }, correct: 'c' },
    { question: "How many bones are in the adult human body?", options: { a: "196", b: "206", c: "216", d: "226" }, correct: 'b' },
    { question: "Which planet is the Red Planet?", options: { a: "Venus", b: "Jupiter", c: "Saturn", d: "Mars" }, correct: 'd' },
    { question: "What is the powerhouse of the cell?", options: { a: "Nucleus", b: "Ribosome", c: "Mitochondria", d: "Chloroplast" }, correct: 'c' },
    { question: "What gas do plants absorb during photosynthesis?", options: { a: "Oxygen", b: "Nitrogen", c: "Carbon Dioxide", d: "Hydrogen" }, correct: 'c' },
    { question: "What is the atomic number of Carbon?", options: { a: "4", b: "6", c: "8", d: "12" }, correct: 'b' },
    { question: "Who discovered Penicillin?", options: { a: "Louis Pasteur", b: "Alexander Fleming", c: "Marie Curie", d: "Isaac Newton" }, correct: 'b' },
    { question: "What is the hardest natural substance?", options: { a: "Gold", b: "Iron", c: "Diamond", d: "Titanium" }, correct: 'c' },
    { question: "How many chromosomes does a human cell have?", options: { a: "23", b: "44", c: "46", d: "48" }, correct: 'c' },
    { question: "Speed of light in vacuum is approximately?", options: { a: "200,000 km/s", b: "300,000 km/s", c: "400,000 km/s", d: "500,000 km/s" }, correct: 'b' },
  ],
  Geography: [
    { question: "What is the capital of Nigeria?", options: { a: "Lagos", b: "Kano", c: "Ibadan", d: "Abuja" }, correct: 'd' },
    { question: "Which is the largest country in Africa by area?", options: { a: "Nigeria", b: "Sudan", c: "Algeria", d: "DRC" }, correct: 'c' },
    { question: "Which river is longest in Africa?", options: { a: "Congo", b: "Nile", c: "Niger", d: "Zambezi" }, correct: 'b' },
    { question: "How many states does Nigeria have?", options: { a: "34", b: "36", c: "38", d: "40" }, correct: 'b' },
    { question: "Which ocean is the largest?", options: { a: "Atlantic", b: "Indian", c: "Arctic", d: "Pacific" }, correct: 'd' },
    { question: "Mount Kilimanjaro is in which country?", options: { a: "Kenya", b: "Ethiopia", c: "Tanzania", d: "Uganda" }, correct: 'c' },
    { question: "Currency of South Africa?", options: { a: "Shilling", b: "Rand", c: "Cedi", d: "Franc" }, correct: 'b' },
    { question: "Amazon rainforest is primarily in which country?", options: { a: "Colombia", b: "Venezuela", c: "Peru", d: "Brazil" }, correct: 'd' },
    { question: "Which African city has the largest population?", options: { a: "Nairobi", b: "Cairo", c: "Lagos", d: "Kinshasa" }, correct: 'c' },
    { question: "What is the smallest country in the world?", options: { a: "Monaco", b: "Liechtenstein", c: "Vatican City", d: "San Marino" }, correct: 'c' },
  ],
  Nollywood: [
    { question: "Which actress is known as Mama G?", options: { a: "Genevieve Nnaji", b: "Rita Dominic", c: "Patience Ozokwo", d: "Omotola Jalade" }, correct: 'c' },
    { question: "Which film launched modern Nollywood?", options: { a: "Glamour Girls", b: "Living in Bondage", c: "Emotional Crack", d: "True Confession" }, correct: 'b' },
    { question: "RMD stands for?", options: { a: "Ramsey Moussa Dominic", b: "Richard Mofe-Damijo", c: "Robert Musa David", d: "Raymond Mathew Douglas" }, correct: 'b' },
    { question: "Who directed Lionheart?", options: { a: "Kemi Adetiba", b: "Genevieve Nnaji", c: "Kunle Afolayan", d: "EbonyLife Films" }, correct: 'b' },
    { question: "Omotola Jalade is also known as?", options: { a: "Omosexy", b: "Omo Naija", c: "Tola the Great", d: "Nigerian Queen" }, correct: 'a' },
    { question: "Which Nigerian film was submitted for the Oscars 2020?", options: { a: "Wedding Party", b: "King of Boys", c: "Lionheart", d: "October 1" }, correct: 'c' },
    { question: "Living in Bondage was released in?", options: { a: "1989", b: "1990", c: "1992", d: "1995" }, correct: 'c' },
    { question: "Nollywood is primarily based in?", options: { a: "Abuja", b: "Port Harcourt", c: "Enugu", d: "Lagos" }, correct: 'd' },
    { question: "Which actress is known as Genevieve?", options: { a: "Genevieve Nnaji", b: "Genevieve Okonkwo", c: "Genevieve Amadi", d: "Genevieve Bello" }, correct: 'a' },
    { question: "Nollywood produces roughly how many films per year?", options: { a: "500", b: "1,000", c: "2,000", d: "3,000" }, correct: 'c' },
  ],
  Technology: [
    { question: "What does CPU stand for?", options: { a: "Central Processing Unit", b: "Computer Processing Unit", c: "Central Program Utility", d: "Core Processing Unit" }, correct: 'a' },
    { question: "What does HTML stand for?", options: { a: "Hyper Text Markup Language", b: "High Text Machine Language", c: "Hyper Transfer Markup Language", d: "High Transfer Machine Logic" }, correct: 'a' },
    { question: "Which company created the iPhone?", options: { a: "Samsung", b: "Google", c: "Apple", d: "Microsoft" }, correct: 'c' },
    { question: "Which Nigerian company processes most online payments?", options: { a: "Flutterwave", b: "Paystack", c: "Interswitch", d: "Quickteller" }, correct: 'b' },
    { question: "What does API stand for?", options: { a: "Application Programming Interface", b: "Automated Process Integration", c: "Application Process Interaction", d: "Automated Programming Interface" }, correct: 'a' },
    { question: "Most widely used web programming language?", options: { a: "Python", b: "Java", c: "JavaScript", d: "Ruby" }, correct: 'c' },
    { question: "What does URL stand for?", options: { a: "Uniform Resource Locator", b: "Universal Resource Link", c: "Unified Remote Locator", d: "Universal Response Locator" }, correct: 'a' },
    { question: "Social media platform with most users?", options: { a: "Instagram", b: "Twitter", c: "Facebook", d: "TikTok" }, correct: 'c' },
    { question: "What does AI stand for?", options: { a: "Automated Intelligence", b: "Artificial Intelligence", c: "Automated Interface", d: "Artificial Interface" }, correct: 'b' },
    { question: "First commercial internet in Nigeria launched in?", options: { a: "1992", b: "1994", c: "1996", d: "1998" }, correct: 'c' },
  ],
  'General Knowledge': [
    { question: "Largest planet in our solar system?", options: { a: "Saturn", b: "Neptune", c: "Jupiter", d: "Uranus" }, correct: 'c' },
    { question: "Who painted the Mona Lisa?", options: { a: "Michelangelo", b: "Raphael", c: "Leonardo da Vinci", d: "Caravaggio" }, correct: 'c' },
    { question: "How many sides does a hexagon have?", options: { a: "5", b: "6", c: "7", d: "8" }, correct: 'b' },
    { question: "Capital of France?", options: { a: "Berlin", b: "Madrid", c: "Rome", d: "Paris" }, correct: 'd' },
    { question: "First iPhone launched in?", options: { a: "2005", b: "2006", c: "2007", d: "2008" }, correct: 'c' },
    { question: "Square root of 144?", options: { a: "11", b: "12", c: "13", d: "14" }, correct: 'b' },
    { question: "How many continents on Earth?", options: { a: "5", b: "6", c: "7", d: "8" }, correct: 'c' },
    { question: "Chemical formula for water?", options: { a: "HO", b: "H2O", c: "H3O", d: "OH2" }, correct: 'b' },
    { question: "Who wrote Things Fall Apart?", options: { a: "Wole Soyinka", b: "Chinua Achebe", c: "Chimamanda Adichie", d: "Ben Okri" }, correct: 'b' },
    { question: "How many hours in a day?", options: { a: "12", b: "20", c: "24", d: "36" }, correct: 'c' },
  ],
}

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

export default function Game() {
  const { roomId }  = useParams()
  const location    = useLocation()
  const navigate    = useNavigate()
  const user        = useAuthStore(s => s.user)

  const stateInfo   = location.state || {}
  const isPractice  = stateInfo.isPractice || roomId?.startsWith('practice-')

  const [phase,      setPhase]      = useState(isPractice ? 'playing' : 'waiting')
  const [countdown,  setCountdown]  = useState(3)
  const [question,   setQuestion]   = useState(null)
  const [qIndex,     setQIndex]     = useState(0)
  const [qTotal,     setQTotal]     = useState(10)
  const [timeLeft,   setTimeLeft]   = useState(TIMER_MAX)
  const [answered,   setAnswered]   = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [correctAns, setCorrectAns] = useState(null)
  const [score,      setScore]      = useState(0)
  const [correct,    setCorrect]    = useState(0)
  const [opponents,  setOpponents]  = useState([])
  const [practiceQs, setPracticeQs] = useState([])

  const timerRef = useRef(null)
  const practiceRef = useRef([])

  // ── PRACTICE MODE ──────────────────────────────────────
  useEffect(() => {
    if (!isPractice) return

    const cat = stateInfo.category || 'General Knowledge'
    const bank = PRACTICE_QUESTIONS[cat] || PRACTICE_QUESTIONS['General Knowledge']
    const questions = shuffle(bank).slice(0, 10)
    practiceRef.current = questions
    setPracticeQs(questions)
    loadPracticeQ(questions, 0)
  }, [isPractice])

  const loadPracticeQ = (questions, index) => {
    if (index >= questions.length) {
      setPhase('ended')
      return
    }
    const q = questions[index]
    setQuestion({ question: q.question, options: q.options })
    setQIndex(index)
    setQTotal(questions.length)
    setAnswered(false)
    setSelected(null)
    setCorrectAns(null)
    setTimeLeft(TIMER_MAX)
    setPhase('playing')
    clearInterval(timerRef.current)
    let t = TIMER_MAX
    timerRef.current = setInterval(() => {
      t--
      setTimeLeft(t)
      if (t <= 0) {
        clearInterval(timerRef.current)
        // Auto reveal correct answer
        setCorrectAns(questions[index].correct)
        setAnswered(true)
        setTimeout(() => loadPracticeQ(questions, index + 1), 1500)
      }
    }, 1000)
  }

  const pickPracticeAnswer = (letter) => {
    if (answered) return
    const q = practiceRef.current[qIndex]
    clearInterval(timerRef.current)
    const isCorrect = letter === q.correct
    setSelected(letter)
    setCorrectAns(q.correct)
    setAnswered(true)
    if (isCorrect) {
      const pts = Math.max(100, timeLeft * 85)
      setScore(s => s + pts)
      setCorrect(c => c + 1)
    }
    setTimeout(() => loadPracticeQ(practiceRef.current, qIndex + 1), 1400)
  }

  // ── MULTIPLAYER MODE ───────────────────────────────────
  useEffect(() => {
    if (isPractice) return
    const socket = getSocket()
    if (!socket) { navigate('/lobby'); return }

    socket.emit('join_room', { roomId })

    socket.on('player_joined', ({ players }) => {
      setOpponents(players.filter(p => p.userId !== user?.id))
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
      if (isCorrect) setCorrect(c => c + 1)
    })

    socket.on('question_ended', ({ correctAnswer }) => {
      setCorrectAns(correctAnswer)
      clearInterval(timerRef.current)
    })

    socket.on('score_update', ({ userId, score: s }) => {
      if (userId !== user?.id) {
        setOpponents(prev => prev.map(p =>
          p.userId === userId ? { ...p, score: s } : p
        ))
      }
    })

    socket.on('game_ended', (data) => {
      clearInterval(timerRef.current)
      navigate('/results', {
        state: { result: data, stakeNaira: stateInfo.stakeNaira }
      })
    })

    socket.on('error', () => navigate('/lobby'))

    return () => {
      clearInterval(timerRef.current)
      socket.off('player_joined')
      socket.off('game_starting')
      socket.off('question')
      socket.off('answer_result')
      socket.off('question_ended')
      socket.off('score_update')
      socket.off('game_ended')
      socket.off('error')
    }
  }, [roomId, isPractice])

  const startTimer = (limit) => {
    clearInterval(timerRef.current)
    let t = limit
    timerRef.current = setInterval(() => {
      t--
      setTimeLeft(t)
      if (t <= 0) clearInterval(timerRef.current)
    }, 1000)
  }

  const pickAnswer = (letter) => {
    if (answered || !question) return
    setAnswered(true)
    setSelected(letter)
    const responseTimeMs = (TIMER_MAX - timeLeft) * 1000
    clearInterval(timerRef.current)
    getSocket()?.emit('submit_answer', {
      roomId,
      questionIndex: qIndex,
      answer: letter,
      responseTimeMs,
    })
  }

  const getAnswerStyle = (letter) => {
    const base = {
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '15px 16px', width: '100%',
      borderRadius: 'var(--r)', cursor: answered ? 'default' : 'pointer',
      transition: 'all 0.2s', border: '1px solid',
      fontFamily: 'var(--body)', fontSize: 14, fontWeight: 500,
      color: 'var(--text)',
    }
    if (correctAns) {
      if (letter === correctAns) return { ...base, background: 'var(--teal-dim)', borderColor: 'var(--teal)', boxShadow: '0 0 16px var(--teal-mid)', animation: 'bounce 0.5s ease' }
      if (letter === selected && letter !== correctAns) return { ...base, background: 'var(--red-dim)', borderColor: 'var(--red)', animation: 'shake 0.4s ease' }
      return { ...base, background: 'var(--surface2)', borderColor: 'var(--line)', opacity: 0.5 }
    }
    if (selected === letter) return { ...base, background: 'var(--indigo-dim)', borderColor: 'var(--indigo)' }
    return { ...base, background: 'var(--surface2)', borderColor: 'var(--line2)' }
  }

  const timerPct   = timeLeft / TIMER_MAX
  const circ       = 251
  const strokeOff  = circ - (circ * timerPct)
  const timerColor = timeLeft > 5 ? 'var(--indigo)' : timeLeft > 3 ? 'var(--gold)' : 'var(--red)'

  // ── PRACTICE ENDED ────────────────────────────────────
  if (isPractice && phase === 'ended') {
    const acc = Math.round((correct / qTotal) * 100)
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Practice complete!</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--muted2)', marginBottom: 24 }}>{correct} / {qTotal} correct · {acc}% accuracy</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line2)', borderRadius: 14, padding: 20, width: '100%', maxWidth: 320, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'var(--muted2)', fontSize: 13 }}>Score</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--gold)' }}>{score} pts</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'var(--muted2)', fontSize: 13 }}>Accuracy</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: acc >= 70 ? 'var(--teal)' : 'var(--red)' }}>{acc}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted2)', fontSize: 13 }}>Category</span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13 }}>{stateInfo.category || 'General Knowledge'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
          <button
            onClick={() => navigate('/lobby', { state: { mode: 'practice', category: stateInfo.category } })}
            className="btn btn-primary btn-full btn-lg"
          >
            Practice again
          </button>
          <button onClick={() => navigate('/lobby')} className="btn btn-outline btn-full">
            Play for real money
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-full">
            Home
          </button>
        </div>
      </div>
    )
  }

  // ── WAITING ───────────────────────────────────────────
  if (phase === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700 }}>Waiting for players...</div>
        <div style={{ fontSize: 13, color: 'var(--muted2)' }}>
          {stateInfo.category} · ₦{(stateInfo.stakeNaira || 0).toLocaleString()} stake
        </div>
        {opponents.map(o => (
          <div key={o.userId} style={{ fontSize: 13, color: 'var(--teal)' }}>✓ {o.username} joined</div>
        ))}
      </div>
    )
  }

  // ── COUNTDOWN ─────────────────────────────────────────
  if (phase === 'countdown') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 96, fontWeight: 800, color: 'var(--indigo)', animation: 'popIn 0.4s ease' }}>
          {countdown}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8, color: 'var(--muted2)' }}>Get ready!</div>
      </div>
    )
  }

  // ── PLAYING ───────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* TOPBAR */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line2)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isPractice
            ? <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--indigo-lt)' }}>Practice</span>
            : <span className="tag tag-red"><span className="live-dot" /> Live</span>
          }
          <span style={{ fontSize: 12, color: 'var(--muted2)' }}>Q {qIndex + 1} / {qTotal}</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
            {isPractice ? 'Practice' : `₦${Math.round((stateInfo.stakeNaira || 0) * 2 * 0.9).toLocaleString()} prize`}
          </div>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--indigo-lt)' }}>
          {score} pts
        </span>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ height: 3, background: 'var(--line2)' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--indigo), var(--indigo-lt))', width: `${((qIndex) / qTotal) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>

      {/* TIMER RING */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 12px' }}>
        <div style={{ position: 'relative', width: 88, height: 88 }}>
          <svg viewBox="0 0 80 80" width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r="36" fill="none" stroke="var(--line2)" strokeWidth="4" />
            <circle
              cx="40" cy="40" r="36"
              fill="none" stroke={timerColor} strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={strokeOff}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', filter: timeLeft <= 5 ? `drop-shadow(0 0 6px ${timerColor})` : 'none' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 700, color: timerColor }}>
            {timeLeft}
          </div>
        </div>
      </div>

      {/* QUESTION */}
      {question && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            {stateInfo.category || 'Quiz'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, color: 'var(--text)' }}>
            {question.question}
          </div>
        </div>
      )}

      {/* ANSWERS */}
      {question && (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {Object.entries(question.options).map(([letter, text]) => (
            <button
              key={letter}
              style={getAnswerStyle(letter)}
              onClick={() => isPractice ? pickPracticeAnswer(letter) : pickAnswer(letter)}
              disabled={answered}
            >
              <div style={{ width: 28, height: 28, borderRadius: 6, background: correctAns === letter ? 'var(--teal)' : selected === letter && !correctAns ? 'var(--indigo)' : 'var(--line2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 800, color: correctAns === letter || selected === letter ? '#fff' : 'var(--muted2)', flexShrink: 0, transition: 'all 0.2s' }}>
                {letter.toUpperCase()}
              </div>
              <span>{text}</span>
            </button>
          ))}
        </div>
      )}

      {/* OPPONENTS (multiplayer only) */}
      {!isPractice && opponents.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 12px', scrollbarWidth: 'none' }}>
          {opponents.map(opp => (
            <div key={opp.userId} style={{ flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--line2)', borderRadius: 100, padding: '4px 12px 4px 6px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--indigo-dim)', border: '1px solid var(--indigo-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: 'var(--indigo-lt)' }}>
                {opp.username?.substring(0, 2).toUpperCase()}
              </div>
              <span style={{ color: 'var(--text2)' }}>{opp.username}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--teal)' }}>{opp.score || 0}pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
