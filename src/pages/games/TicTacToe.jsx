import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../../services/socket'
import useAuthStore from '../../context/authStore'
import { Button } from '../../components/ui'
import DifficultyPicker from '../../components/game/DifficultyPicker'

const checkWinner = (board) => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a,b,c] }
  }
  if (board.every(c => c)) return { winner: 'draw', line: [] }
  return null
}

// AI difficulty levels
const getAIMove = (board, aiSymbol, difficulty) => {
  const humanSymbol = aiSymbol === 'X' ? 'O' : 'X'
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  const empty = board.map((v,i) => v ? null : i).filter(v => v !== null)
  if (!empty.length) return null

  // Easy: mostly random with occasional smart move
  if (difficulty === 'easy') {
    if (Math.random() < 0.3) {
      // Sometimes play smart
      for (const [a,b,c] of lines) {
        if (board[a]===aiSymbol && board[b]===aiSymbol && !board[c]) return c
        if (board[a]===aiSymbol && !board[b] && board[c]===aiSymbol) return b
        if (!board[a] && board[b]===aiSymbol && board[c]===aiSymbol) return a
      }
    }
    return empty[Math.floor(Math.random()*empty.length)]
  }

  // Medium: tries to win and block but misses sometimes
  if (difficulty === 'medium') {
    // Win if possible
    for (const [a,b,c] of lines) {
      if (board[a]===aiSymbol && board[b]===aiSymbol && !board[c]) return c
      if (board[a]===aiSymbol && !board[b] && board[c]===aiSymbol) return b
      if (!board[a] && board[b]===aiSymbol && board[c]===aiSymbol) return a
    }
    // Block human ~60% of the time
    if (Math.random() < 0.6) {
      for (const [a,b,c] of lines) {
        if (board[a]===humanSymbol && board[b]===humanSymbol && !board[c]) return c
        if (board[a]===humanSymbol && !board[b] && board[c]===humanSymbol) return b
        if (!board[a] && board[b]===humanSymbol && board[c]===humanSymbol) return a
      }
    }
    if (!board[4]) return 4
    return empty[Math.floor(Math.random()*empty.length)]
  }

  // Hard: always wins/blocks, takes center and corners
  for (const [a,b,c] of lines) {
    if (board[a]===aiSymbol && board[b]===aiSymbol && !board[c]) return c
    if (board[a]===aiSymbol && !board[b] && board[c]===aiSymbol) return b
    if (!board[a] && board[b]===aiSymbol && board[c]===aiSymbol) return a
  }
  for (const [a,b,c] of lines) {
    if (board[a]===humanSymbol && board[b]===humanSymbol && !board[c]) return c
    if (board[a]===humanSymbol && !board[b] && board[c]===humanSymbol) return b
    if (!board[a] && board[b]===humanSymbol && board[c]===humanSymbol) return a
  }
  if (!board[4]) return 4
  const corners = [0,2,6,8].filter(i => !board[i])
  if (corners.length) return corners[Math.floor(Math.random()*corners.length)]
  return empty[Math.floor(Math.random()*empty.length)]
}

const AI_DELAY = { easy: 1000, medium: 700, hard: 400 }

export default function TicTacToe() {
  const { roomId }  = useParams()
  const location    = useLocation()
  const navigate    = useNavigate()
  const user        = useAuthStore(s => s.user)

  const { stakeNaira = 0, isPractice } = location.state || {}
  const isPrac = isPractice || roomId?.startsWith('practice')

  const [difficulty,  setDifficulty]  = useState(null)
  const [phase,       setPhase]       = useState(isPrac ? 'select-difficulty' : 'waiting')
  const [board,       setBoard]       = useState(Array(9).fill(null))
  const [isMyTurn,    setIsMyTurn]    = useState(true)
  const [status,      setStatus]      = useState(isPrac ? 'idle' : 'waiting')
  const [result,      setResult]      = useState(null)
  const [winLine,     setWinLine]     = useState([])
  const [score,       setScore]       = useState({ me: 0, ai: 0, draw: 0 })
  const [aiThinking,  setAiThinking]  = useState(false)

  // Multiplayer state
  const [mySymbol, setMySymbol]  = useState('X')

  const startPractice = (diff) => {
    setDifficulty(diff)
    setPhase('playing')
    setStatus('playing')
    setBoard(Array(9).fill(null))
    setIsMyTurn(true)
    setResult(null)
    setWinLine([])
  }

  const makeAIMove = (currentBoard, diff) => {
    setAiThinking(true)
    setTimeout(() => {
      const aiMove = getAIMove(currentBoard, 'O', diff)
      if (aiMove === undefined || aiMove === null) { setAiThinking(false); return }
      const newBoard = [...currentBoard]
      newBoard[aiMove] = 'O'
      setBoard(newBoard)
      const res = checkWinner(newBoard)
      if (res) {
        setWinLine(res.line)
        setResult({ result: res.winner, isWinner: res.winner === 'X', isDraw: res.winner === 'draw' })
        setStatus('ended')
        setScore(s => ({ me: res.winner==='X' ? s.me+1 : s.me, ai: res.winner==='O' ? s.ai+1 : s.ai, draw: res.winner==='draw' ? s.draw+1 : s.draw }))
      } else {
        setIsMyTurn(true)
      }
      setAiThinking(false)
    }, AI_DELAY[diff] || 700)
  }

  const practiceMove = (index) => {
    if (!isMyTurn || board[index] || status !== 'playing' || aiThinking) return
    const newBoard = [...board]
    newBoard[index] = 'X'
    setBoard(newBoard)
    const res = checkWinner(newBoard)
    if (res) {
      setWinLine(res.line)
      setResult({ result: res.winner, isWinner: res.winner === 'X', isDraw: res.winner === 'draw' })
      setStatus('ended')
      setScore(s => ({ me: res.winner==='X' ? s.me+1 : s.me, ai: res.winner==='O' ? s.ai+1 : s.ai, draw: res.winner==='draw' ? s.draw+1 : s.draw }))
    } else {
      setIsMyTurn(false)
      makeAIMove(newBoard, difficulty)
    }
  }

  const playAgainPractice = () => {
    setBoard(Array(9).fill(null))
    setWinLine([])
    setResult(null)
    setIsMyTurn(true)
    setStatus('playing')
  }

  // Multiplayer
  useEffect(() => {
    if (isPrac) return
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }
    socket.emit('ttt:join', { roomId })
    socket.on('ttt:state',  ({ board, symbols, currentTurn }) => { setBoard(board); setMySymbol(symbols[user.id]); setIsMyTurn(currentTurn === user.id) })
    socket.on('ttt:start',  ({ symbols, currentTurn }) => { setMySymbol(symbols[user.id]); setIsMyTurn(currentTurn === user.id); setStatus('playing') })
    socket.on('ttt:move',   ({ board }) => setBoard(board))
    socket.on('ttt:turn',   ({ currentTurn }) => setIsMyTurn(currentTurn === user.id))
    socket.on('ttt:ended',  ({ result, winnerId, line }) => { setWinLine(line); setStatus('ended'); setResult({ result, winnerId, isWinner: winnerId === user.id }) })
    return () => { socket.off('ttt:state'); socket.off('ttt:start'); socket.off('ttt:move'); socket.off('ttt:turn'); socket.off('ttt:ended') }
  }, [roomId, isPrac])

  const multiMove = (index) => {
    if (!isMyTurn || board[index] || status !== 'playing') return
    getSocket()?.emit('ttt:move', { roomId, cellIndex: index })
  }

  const handleClick = (i) => isPrac ? practiceMove(i) : multiMove(i)

  const DIFF_COLORS = { easy: 'var(--teal)', medium: 'var(--gold)', hard: 'var(--red)' }
  const diffColor = DIFF_COLORS[difficulty] || 'var(--indigo)'

  // DIFFICULTY SELECT
  if (phase === 'select-difficulty') {
    return <DifficultyPicker gameName="Tic-tac-toe" onSelect={startPractice} onBack={() => navigate('/games')} />
  }

  // WAITING
  if (!isPrac && status === 'waiting') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ fontSize:48 }}>⭕</div>
        <div style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:700 }}>Waiting for opponent...</div>
        <div className="spinner" style={{ width:32, height:32 }} />
      </div>
    )
  }

  // ENDED
  if (status === 'ended' && result) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16, animation:'popIn 0.5s ease' }}>
          {result.isDraw || result.result==='draw' ? '🤝' : result.isWinner ? '🏆' : '💀'}
        </div>
        <div style={{ fontFamily:'var(--display)', fontSize:28, fontWeight:800, marginBottom:8, color: result.isDraw||result.result==='draw' ? 'var(--muted2)' : result.isWinner ? 'var(--teal)' : 'var(--red)' }}>
          {result.isDraw||result.result==='draw' ? 'Draw!' : result.isWinner ? 'You won!' : 'You lost'}
        </div>
        {isPrac && (
          <>
            {difficulty && <div style={{ marginBottom:10 }}><span style={{ background:`${diffColor}18`, border:`1px solid ${diffColor}44`, borderRadius:100, padding:'3px 12px', fontSize:11, fontFamily:'var(--display)', fontWeight:700, color:diffColor }}>{difficulty.charAt(0).toUpperCase()+difficulty.slice(1)}</span></div>}
            <div style={{ fontFamily:'var(--display)', fontSize:14, color:'var(--muted2)', marginBottom:8 }}>
              Score — <span style={{ color:'var(--teal)' }}>You {score.me}</span> · <span style={{ color:'var(--red)' }}>AI {score.ai}</span> · <span style={{ color:'var(--muted2)' }}>Draw {score.draw}</span>
            </div>
          </>
        )}
        {!isPrac && result.isWinner && (
          <div style={{ fontFamily:'var(--mono)', fontSize:36, fontWeight:700, color:'var(--gold)', textShadow:'0 0 20px var(--gold-glow)', marginBottom:16 }}>
            +₦{(stakeNaira*2*0.9).toLocaleString()}
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300, marginTop:16 }}>
          {isPrac
            ? <>
                <Button variant="primary" full size="lg" onClick={playAgainPractice}>Play again</Button>
                <Button variant="ghost" full onClick={() => { setPhase('select-difficulty'); setScore({me:0,ai:0,draw:0}) }}>Change difficulty</Button>
              </>
            : <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          }
          {!isPrac && result.isWinner && <Button variant="teal" full onClick={() => navigate('/wallet')}>Withdraw winnings</Button>}
          <Button variant="ghost" full onClick={() => navigate('/games')}>Back to games</Button>
        </div>
      </div>
    )
  }

  const myTurnNow = isPrac ? (isMyTurn && !aiThinking) : isMyTurn

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line2)', background:'var(--surface)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:800 }}>Tic-tac-toe</div>
          <div style={{ fontSize:11, color:'var(--muted2)' }}>
            {isPrac ? `You are X · AI is O` : `You are ${mySymbol}`}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isPrac && difficulty && (
            <span style={{ background:`${diffColor}18`, border:`1px solid ${diffColor}44`, borderRadius:100, padding:'3px 10px', fontSize:11, fontFamily:'var(--display)', fontWeight:700, color:diffColor }}>
              {difficulty}
            </span>
          )}
          {isPrac
            ? <div style={{ fontFamily:'var(--display)', fontSize:13, fontWeight:700 }}>
                <span style={{ color:'var(--teal)' }}>You {score.me}</span> — <span style={{ color:'var(--red)' }}>AI {score.ai}</span>
              </div>
            : <div style={{ fontFamily:'var(--mono)', fontSize:15, fontWeight:700, color:'var(--gold)' }}>
                ₦{(stakeNaira*2*0.9).toLocaleString()} prize
              </div>
          }
        </div>
      </div>

      <div style={{ padding:'10px 20px', textAlign:'center', background: myTurnNow ? 'var(--indigo-dim)' : 'var(--surface2)', borderBottom:'1px solid var(--line2)', transition:'background 0.3s' }}>
        <div style={{ fontFamily:'var(--display)', fontSize:13, fontWeight:700, color: myTurnNow ? 'var(--indigo-lt)' : 'var(--muted2)' }}>
          {myTurnNow ? '🎯 Your turn' : isPrac ? `🤖 AI thinking${difficulty==='hard' ? ' fast' : difficulty==='easy' ? '...' : '...'}` : "⏳ Opponent's turn"}
        </div>
      </div>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:320, width:'100%' }}>
          {board.map((cell, i) => {
            const isWin = winLine.includes(i)
            return (
              <div
                key={i}
                onClick={() => handleClick(i)}
                style={{
                  aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center',
                  background: isWin ? 'var(--teal-dim)' : 'var(--surface2)',
                  border: `2px solid ${isWin ? 'var(--teal)' : myTurnNow&&!cell ? 'var(--line2)' : 'var(--line)'}`,
                  borderRadius:16, cursor: myTurnNow&&!cell&&status==='playing' ? 'pointer' : 'default',
                  fontSize:52, fontFamily:'var(--mono)', fontWeight:900,
                  color: cell==='X' ? 'var(--indigo-lt)' : 'var(--red)',
                  transition:'all 0.2s', userSelect:'none',
                  boxShadow: isWin ? '0 0 20px var(--teal-mid)' : 'none',
                  animation: cell ? 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                }}
                onMouseEnter={e => { if(myTurnNow&&!cell&&status==='playing') e.currentTarget.style.borderColor='var(--indigo)' }}
                onMouseLeave={e => { if(myTurnNow&&!cell) e.currentTarget.style.borderColor='var(--line2)' }}
              >
                {cell}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding:'14px 20px', borderTop:'1px solid var(--line2)', display:'flex', gap:10 }}>
        {isPrac
          ? <Button variant="ghost" full onClick={() => navigate('/games')}>Exit practice</Button>
          : <Button variant="danger" full onClick={() => getSocket()?.emit('ttt:resign', { roomId })}>Resign</Button>
        }
      </div>
    </div>
  )
}
