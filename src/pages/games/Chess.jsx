import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../../services/socket'
import useAuthStore from '../../context/authStore'
import { Button } from '../../components/ui'

const PIECE_SYMBOLS = {
  K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙',
  k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟',
}

const INITIAL_BOARD = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R'],
]

const isWhite = p => p && p === p.toUpperCase()
const isBlack = p => p && p === p.toLowerCase()
const inBounds = (r,c) => r>=0&&r<8&&c>=0&&c<8

const getLegalMoves = (board, row, col) => {
  const piece = board[row][col]
  if (!piece) return []
  const white = isWhite(piece)
  const type  = piece.toLowerCase()
  const moves = []

  const addMove = (r,c) => {
    if (!inBounds(r,c)) return false
    if (!board[r][c]) { moves.push([r,c]); return true }
    if (white ? isBlack(board[r][c]) : isWhite(board[r][c])) { moves.push([r,c]); return false }
    return false
  }

  switch(type) {
    case 'p': {
      const dir = white ? -1 : 1
      const start = white ? 6 : 1
      if (inBounds(row+dir,col) && !board[row+dir][col]) {
        moves.push([row+dir,col])
        if (row===start && !board[row+dir*2][col]) moves.push([row+dir*2,col])
      }
      for (const dc of [-1,1]) {
        if (inBounds(row+dir,col+dc)) {
          const target = board[row+dir][col+dc]
          if (target && (white ? isBlack(target) : isWhite(target))) moves.push([row+dir,col+dc])
        }
      }
      break
    }
    case 'r':
      for (const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]])
        for (let i=1;i<8;i++) if(!addMove(row+dr*i,col+dc*i)) break
      break
    case 'n':
      for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])
        addMove(row+dr,col+dc)
      break
    case 'b':
      for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]])
        for (let i=1;i<8;i++) if(!addMove(row+dr*i,col+dc*i)) break
      break
    case 'q':
      for (const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0],[-1,-1],[-1,1],[1,-1],[1,1]])
        for (let i=1;i<8;i++) if(!addMove(row+dr*i,col+dc*i)) break
      break
    case 'k':
      for (const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0],[-1,-1],[-1,1],[1,-1],[1,1]])
        addMove(row+dr,col+dc)
      break
  }
  return moves
}

const applyMove = (board, from, to) => {
  const nb = board.map(r=>[...r])
  nb[to[0]][to[1]] = nb[from[0]][from[1]]
  nb[from[0]][from[1]] = null
  // Pawn promotion
  if (nb[to[0]][to[1]] === 'P' && to[0]===0) nb[to[0]][to[1]] = 'Q'
  if (nb[to[0]][to[1]] === 'p' && to[0]===7) nb[to[0]][to[1]] = 'q'
  return nb
}

// Simple AI: pick random legal move
const getAIMove = (board) => {
  const moves = []
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    if (board[r][c] && isBlack(board[r][c])) {
      const lm = getLegalMoves(board,r,c)
      lm.forEach(to => moves.push({ from:[r,c], to }))
    }
  }
  if (!moves.length) return null
  // Prefer captures
  const captures = moves.filter(m => board[m.to[0]][m.to[1]])
  const pool = captures.length ? captures : moves
  return pool[Math.floor(Math.random()*pool.length)]
}

const FILES = ['a','b','c','d','e','f','g','h']

export default function Chess() {
  const { roomId } = useParams()
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)
  const timerRef   = useRef(null)

  const { stakeNaira = 0, isPractice } = location.state || {}
  const isPrac = isPractice || roomId?.startsWith('practice')

  // Board state
  const [board,      setBoard]      = useState(INITIAL_BOARD.map(r=>[...r]))
  const [selected,   setSelected]   = useState(null)
  const [legalMoves, setLegalMoves] = useState([])
  const [isMyTurn,   setIsMyTurn]   = useState(true) // white always starts in practice
  const [lastMove,   setLastMove]   = useState(null)
  const [status,     setStatus]     = useState(isPrac ? 'playing' : 'waiting')
  const [result,     setResult]     = useState(null)
  const [moveCount,  setMoveCount]  = useState(0)
  const [aiThinking, setAiThinking] = useState(false)

  // Multiplayer state
  const [myColor,    setMyColor]    = useState('white')
  const [currTurn,   setCurrTurn]   = useState('white')
  const [timers,     setTimers]     = useState({ white: 600, black: 600 })
  const [inCheck,    setInCheck]    = useState(false)

  const formatTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  // ── PRACTICE LOGIC ──────────────────────────────────────
  const practiceClick = (row, col) => {
    if (!isMyTurn || status !== 'playing' || aiThinking) return

    const piece = board[row][col]

    if (selected) {
      const isLegal = legalMoves.some(([r,c]) => r===row && c===col)
      if (isLegal) {
        // Make player move
        const newBoard = applyMove(board, selected, [row,col])
        setBoard(newBoard)
        setLastMove({ from: selected, to: [row,col] })
        setSelected(null)
        setLegalMoves([])
        setIsMyTurn(false)
        setMoveCount(m => m+1)

        // Check if king captured
        const hasBlackKing = newBoard.some(r => r.includes('k'))
        if (!hasBlackKing) {
          setResult({ isWinner: true, reason: 'checkmate' })
          setStatus('ended')
          return
        }

        // AI responds after delay
        setAiThinking(true)
        setTimeout(() => {
          const aiMove = getAIMove(newBoard)
          if (!aiMove) {
            setResult({ isWinner: true, reason: 'no moves' })
            setStatus('ended')
            setAiThinking(false)
            return
          }
          const afterAI = applyMove(newBoard, aiMove.from, aiMove.to)
          setBoard(afterAI)
          setLastMove({ from: aiMove.from, to: aiMove.to })
          setIsMyTurn(true)
          setAiThinking(false)

          const hasWhiteKing = afterAI.some(r => r.includes('K'))
          if (!hasWhiteKing) {
            setResult({ isWinner: false, reason: 'checkmate' })
            setStatus('ended')
          }
        }, 700)
        return
      }
    }

    // Select own piece (white pieces only in practice)
    if (piece && isWhite(piece)) {
      setSelected([row,col])
      setLegalMoves(getLegalMoves(board, row, col))
    } else {
      setSelected(null)
      setLegalMoves([])
    }
  }

  // ── MULTIPLAYER SOCKET ──────────────────────────────────
  useEffect(() => {
    if (isPrac) return
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }

    socket.emit('chess:join', { roomId })

    socket.on('chess:state', ({ board, colors, currentTurn, timers, status, moveHistory }) => {
      if (board) setBoard(board)
      setMyColor(colors[user.id])
      setCurrTurn(currentTurn)
      setTimers(timers)
      setStatus(status)
    })

    socket.on('chess:start', ({ colors, currentTurn }) => {
      setMyColor(colors[user.id])
      setCurrTurn(currentTurn)
      setStatus('playing')
      // Start timer
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setTimers(prev => {
          const updated = { ...prev, [currentTurn]: prev[currentTurn] - 1 }
          if (updated[currentTurn] <= 0) clearInterval(timerRef.current)
          return updated
        })
      }, 1000)
    })

    socket.on('chess:moved', ({ board, from, to, currentTurn, inCheck, timers }) => {
      setBoard(board)
      setCurrTurn(currentTurn)
      setInCheck(inCheck)
      if (timers) setTimers(timers)
      setLastMove({ from, to })
      setSelected(null)
      setLegalMoves([])
    })

    socket.on('chess:timer',  ({ timers }) => setTimers(timers))
    socket.on('chess:illegal', () => { setSelected(null); setLegalMoves([]) })

    socket.on('chess:ended', ({ winnerId, reason }) => {
      setResult({ winnerId, reason, isWinner: winnerId === user.id })
      setStatus('ended')
      clearInterval(timerRef.current)
    })

    return () => {
      clearInterval(timerRef.current)
      socket.off('chess:state'); socket.off('chess:start'); socket.off('chess:moved')
      socket.off('chess:timer'); socket.off('chess:illegal'); socket.off('chess:ended')
    }
  }, [roomId, isPrac])

  const multiClick = (row, col) => {
    const myColorTurn = myColor === currTurn
    if (!myColorTurn || status !== 'playing') return

    const piece = board[row][col]

    if (selected) {
      const isLegal = legalMoves.some(([r,c]) => r===row && c===col)
      if (isLegal) {
        getSocket()?.emit('chess:move', { roomId, from: selected, to: [row,col] })
        return
      }
    }

    if (piece) {
      const isMyPiece = myColor === 'white' ? isWhite(piece) : isBlack(piece)
      if (isMyPiece) {
        setSelected([row,col])
        setLegalMoves(getLegalMoves(board, row, col))
        return
      }
    }
    setSelected(null)
    setLegalMoves([])
  }

  const handleClick = (row, col) => isPrac ? practiceClick(row, col) : multiClick(row, col)

  // Display board — flip for black
  const displayColor = isPrac ? 'white' : myColor
  const displayBoard = displayColor === 'black'
    ? [...board].reverse().map(r => [...r].reverse())
    : board

  const toDisplayPos = (row, col) =>
    displayColor === 'black' ? [7-row, 7-col] : [row, col]

  // ── WAITING ─────────────────────────────────────────────
  if (!isPrac && status === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>♟️</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>Waiting for opponent...</div>
        <div style={{ fontSize: 13, color: 'var(--muted2)' }}>₦{stakeNaira.toLocaleString()} stake · 10 min clock</div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  // ── ENDED ────────────────────────────────────────────────
  if (status === 'ended' && result) {
    const reasonMap = { checkmate: 'by checkmate', resign: 'by resignation', timeout: 'on time', draw: "— it's a draw", 'no moves': 'no legal moves' }
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16, animation: 'popIn 0.5s ease' }}>
          {result.reason === 'draw' ? '🤝' : result.isWinner ? '♔' : '♚'}
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 6, color: result.reason === 'draw' ? 'var(--muted2)' : result.isWinner ? 'var(--teal)' : 'var(--red)' }}>
          {result.reason === 'draw' ? 'Draw!' : result.isWinner ? 'You won!' : 'You lost'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 16 }}>
          {reasonMap[result.reason] || ''}
          {isPrac && ` · ${moveCount} moves`}
        </div>
        {!isPrac && result.isWinner && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', textShadow: '0 0 20px var(--gold-glow)', marginBottom: 16 }}>
            +₦{(stakeNaira * 2 * 0.9).toLocaleString()}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 8 }}>
          {isPrac
            ? <Button variant="primary" full size="lg" onClick={() => { setBoard(INITIAL_BOARD.map(r=>[...r])); setSelected(null); setLegalMoves([]); setIsMyTurn(true); setLastMove(null); setMoveCount(0); setResult(null); setStatus('playing') }}>
                Play again vs AI
              </Button>
            : <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          }
          {!isPrac && result.isWinner && (
            <Button variant="teal" full onClick={() => navigate('/wallet')}>Withdraw winnings</Button>
          )}
          <Button variant="ghost" full onClick={() => navigate('/games')}>Back to games</Button>
        </div>
      </div>
    )
  }

  // ── PLAYING ──────────────────────────────────────────────
  const myTurnNow = isPrac ? (isMyTurn && !aiThinking) : (myColor === currTurn)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{ padding: '12px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 800 }}>
            Chess {isPrac ? '(Practice vs AI)' : ''}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted2)' }}>
            {isPrac ? `You play White · ${moveCount} moves` : `You play ${myColor}`}
          </div>
        </div>
        {isPrac
          ? <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--muted2)' }}>
              {aiThinking ? '🤖 AI thinking...' : '🎯 Your turn'}
            </div>
          : <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>
              ₦{(stakeNaira * 2 * 0.9).toLocaleString()} prize
            </div>
        }
      </div>

      {/* OPPONENT TIMER (multiplayer only) */}
      {!isPrac && (
        <div style={{ padding: '8px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: 'var(--muted2)' }}>Opponent ({myColor === 'white' ? 'Black' : 'White'})</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: currTurn !== myColor ? 'var(--text)' : 'var(--muted)' }}>
            {formatTime(timers[myColor === 'white' ? 'black' : 'white'] || 600)}
          </div>
        </div>
      )}

      {/* CHECK WARNING */}
      {!isPrac && inCheck && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', padding: '8px 20px', textAlign: 'center', fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>
          ⚠️ {myTurnNow ? 'You are in check!' : 'Opponent is in check'}
        </div>
      )}

      {/* TURN INDICATOR */}
      <div style={{ padding: '8px 20px', textAlign: 'center', background: myTurnNow ? 'var(--indigo-dim)' : 'var(--surface2)', borderBottom: '1px solid var(--line2)', transition: 'background 0.3s' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: myTurnNow ? 'var(--indigo-lt)' : 'var(--muted2)' }}>
          {myTurnNow
            ? '🎯 Your turn — click a piece'
            : isPrac ? '🤖 AI is thinking...' : "⏳ Opponent's turn"}
        </div>
      </div>

      {/* BOARD */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 8px', flex: 1, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', border: '2px solid var(--line2)', borderRadius: 6, overflow: 'hidden', width: 'min(90vw, 420px)', aspectRatio: '1' }}>
            {displayBoard.map((row, dRow) =>
              row.map((piece, dCol) => {
                const [aRow, aCol] = displayColor === 'black' ? [7-dRow, 7-dCol] : [dRow, dCol]
                const isLight      = (dRow + dCol) % 2 === 0
                const isSel        = selected && selected[0]===aRow && selected[1]===aCol
                const isLegal      = legalMoves.some(([r,c]) => r===aRow && c===aCol)
                const isLastFrom   = lastMove?.from[0]===aRow && lastMove?.from[1]===aCol
                const isLastTo     = lastMove?.to[0]===aRow   && lastMove?.to[1]===aCol

                return (
                  <div
                    key={`${dRow}-${dCol}`}
                    onClick={() => handleClick(aRow, aCol)}
                    style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: myTurnNow ? 'pointer' : 'default', userSelect: 'none',
                      fontSize: 'clamp(18px, 5.5vw, 36px)',
                      background: isSel        ? 'rgba(108,99,255,0.55)'
                        : isLegal && piece      ? 'rgba(255,71,87,0.25)'
                        : isLegal               ? 'rgba(0,212,170,0.3)'
                        : isLastFrom||isLastTo  ? 'rgba(255,184,0,0.2)'
                        : isLight               ? '#F0D9B5'
                        : '#B58863',
                      position: 'relative', transition: 'background 0.1s',
                    }}
                  >
                    {piece && (
                      <span style={{
                        lineHeight: 1,
                        filter: isSel ? 'drop-shadow(0 0 6px var(--indigo))' : 'none',
                        transition: 'filter 0.2s',
                      }}>
                        {PIECE_SYMBOLS[piece] || piece}
                      </span>
                    )}
                    {isLegal && !piece && (
                      <div style={{ width: '28%', height: '28%', borderRadius: '50%', background: 'rgba(0,212,170,0.7)', pointerEvents: 'none' }} />
                    )}
                    {isLegal && piece && (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: 0, border: '3px solid rgba(0,212,170,0.8)', pointerEvents: 'none' }} />
                    )}
                  </div>
                )
              })
            )}
          </div>
          {/* FILE LABELS */}
          <div style={{ display: 'flex', paddingLeft: 2, marginTop: 3 }}>
            {(displayColor === 'black' ? [...FILES].reverse() : FILES).map(f => (
              <div key={f} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* MY TIMER (multiplayer only) */}
      {!isPrac && (
        <div style={{ padding: '8px 20px', background: 'var(--surface2)', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: 'var(--muted2)' }}>You ({myColor})</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: myTurnNow ? 'var(--teal)' : 'var(--muted)', textShadow: myTurnNow ? '0 0 12px rgba(0,212,170,0.4)' : 'none' }}>
            {formatTime(timers[myColor] || 600)}
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line2)', display: 'flex', gap: 8 }}>
        {isPrac
          ? <>
              <Button variant="ghost" full size="sm" onClick={() => { setBoard(INITIAL_BOARD.map(r=>[...r])); setSelected(null); setLegalMoves([]); setIsMyTurn(true); setLastMove(null); setMoveCount(0) }}>
                New game
              </Button>
              <Button variant="ghost" full size="sm" onClick={() => navigate('/games')}>Exit</Button>
            </>
          : <>
              <Button variant="ghost" full size="sm" onClick={() => getSocket()?.emit('chess:draw', { roomId })}>Offer draw</Button>
              <Button variant="danger" full size="sm" onClick={() => { if(window.confirm('Resign this game?')) getSocket()?.emit('chess:resign', { roomId }) }}>Resign</Button>
            </>
        }
      </div>
    </div>
  )
}
