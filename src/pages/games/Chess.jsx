import { useEffect, useState, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../../services/socket'
import useAuthStore from '../../context/authStore'
import { Button } from '../../components/ui'

const PIECE_SYMBOLS = {
  K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙',
  k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟',
}

const FILES = ['a','b','c','d','e','f','g','h']
const RANKS = ['8','7','6','5','4','3','2','1']

export default function Chess() {
  const { roomId } = useParams()
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)

  const [board,      setBoard]      = useState(null)
  const [myColor,    setMyColor]    = useState(null)
  const [currTurn,   setCurrTurn]   = useState('white')
  const [selected,   setSelected]   = useState(null)
  const [legalMoves, setLegalMoves] = useState([])
  const [status,     setStatus]     = useState('waiting')
  const [result,     setResult]     = useState(null)
  const [timers,     setTimers]     = useState({ white: 600, black: 600 })
  const [inCheck,    setInCheck]    = useState(false)
  const [moveHistory, setMoveHistory] = useState([])
  const [lastMove,   setLastMove]   = useState(null)

  const { stakeNaira = 0 } = location.state || {}
  const isMyTurn = myColor === currTurn

  const formatTime = (secs) => `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`

  useEffect(() => {
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }

    socket.emit('chess:join', { roomId })

    socket.on('chess:state', ({ board, colors, currentTurn, timers, status, moveHistory }) => {
      setBoard(board)
      setMyColor(colors[user.id])
      setCurrTurn(currentTurn)
      setTimers(timers)
      setStatus(status)
      setMoveHistory(moveHistory || [])
    })

    socket.on('chess:start', ({ colors, currentTurn }) => {
      setMyColor(colors[user.id])
      setCurrTurn(currentTurn)
      setStatus('playing')
    })

    socket.on('chess:moved', ({ board, from, to, piece, currentTurn, inCheck, timers }) => {
      setBoard(board)
      setCurrTurn(currentTurn)
      setInCheck(inCheck)
      setTimers(timers)
      setLastMove({ from, to })
      setSelected(null)
      setLegalMoves([])
      setMoveHistory(prev => [...prev, { from, to, piece }])
    })

    socket.on('chess:illegal', () => {
      setSelected(null)
      setLegalMoves([])
    })

    socket.on('chess:timer', ({ timers }) => setTimers(timers))

    socket.on('chess:ended', ({ winnerId, reason }) => {
      setResult({ winnerId, reason, isWinner: winnerId === user.id })
      setStatus('ended')
    })

    socket.on('chess:draw_offer', ({ from }) => {
      if (from !== user.id) {
        // Show draw offer to opponent
        if (window.confirm('Opponent offers a draw. Accept?')) {
          socket.emit('chess:draw_accept', { roomId })
        }
      }
    })

    return () => {
      socket.off('chess:state'); socket.off('chess:start'); socket.off('chess:moved')
      socket.off('chess:illegal'); socket.off('chess:timer'); socket.off('chess:ended')
      socket.off('chess:draw_offer')
    }
  }, [roomId])

  const handleSquareClick = useCallback((row, col) => {
    if (!isMyTurn || status !== 'playing') return

    const piece = board?.[row]?.[col]

    if (selected) {
      const isLegal = legalMoves.some(([r,c]) => r === row && c === col)
      if (isLegal) {
        getSocket()?.emit('chess:move', { roomId, from: selected, to: [row, col] })
        return
      }
    }

    // Select own piece
    if (piece) {
      const isWhitePiece = piece === piece.toUpperCase()
      const isMyPiece = (myColor === 'white' && isWhitePiece) || (myColor === 'black' && !isWhitePiece)
      if (isMyPiece) {
        setSelected([row, col])
        // Request legal moves from the client-side check
        // (simplified — send to server for validation on move)
        setLegalMoves([]) // server validates, show all empty + enemy squares
        return
      }
    }

    setSelected(null)
    setLegalMoves([])
  }, [board, selected, legalMoves, isMyTurn, status, myColor, roomId])

  if (status === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>♟️</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>Waiting for opponent...</div>
        <div style={{ fontSize: 13, color: 'var(--muted2)' }}>₦{stakeNaira.toLocaleString()} stake · 10 min clock</div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (status === 'ended' && result) {
    const reasonLabels = { checkmate: 'by checkmate', resign: 'by resignation', timeout: 'on time', draw: "— it's a draw" }
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{result.reason === 'draw' ? '🤝' : result.isWinner ? '♔' : '♚'}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 30, fontWeight: 800, color: result.reason === 'draw' ? 'var(--muted2)' : result.isWinner ? 'var(--teal)' : 'var(--red)', marginBottom: 8 }}>
          {result.reason === 'draw' ? 'Draw!' : result.isWinner ? 'You won!' : 'You lost'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 8 }}>{reasonLabels[result.reason]}</div>
        {result.isWinner && <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', textShadow: '0 0 20px var(--gold-glow)' }}>+₦{(stakeNaira * 2 * 0.9).toLocaleString()}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 24 }}>
          <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          <Button variant="ghost" full onClick={() => navigate('/dashboard')}>Home</Button>
        </div>
      </div>
    )
  }

  const displayBoard = myColor === 'black' ? [...(board || [])].reverse().map(row => [...row].reverse()) : board

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{ padding: '12px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 800 }}>Chess</div>
          <div style={{ fontSize: 11, color: 'var(--muted2)' }}>
            You play as <span style={{ color: myColor === 'white' ? '#fff' : 'var(--muted)', fontWeight: 700, textTransform: 'capitalize' }}>{myColor}</span>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>
          ₦{(stakeNaira * 2 * 0.9).toLocaleString()} prize
        </div>
      </div>

      {/* OPPONENT TIMER */}
      <div style={{ padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--muted2)' }}>Opponent ({myColor === 'white' ? 'black' : 'white'})</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800, color: currTurn !== myColor ? 'var(--text)' : 'var(--muted)' }}>
          {formatTime(timers[myColor === 'white' ? 'black' : 'white'])}
        </div>
      </div>

      {/* TURN INDICATOR */}
      {inCheck && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', padding: '8px 20px', textAlign: 'center', fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>
          ⚠️ {isMyTurn ? 'You are in check!' : 'Opponent is in check'}
        </div>
      )}

      {/* BOARD */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 8px', flex: 1, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', border: '2px solid var(--line2)', borderRadius: 6, overflow: 'hidden', width: 'min(90vw, 400px)', aspectRatio: '1' }}>
            {(displayBoard || Array(8).fill(Array(8).fill(null))).map((row, displayRow) =>
              row.map((piece, displayCol) => {
                const row = myColor === 'black' ? 7 - displayRow : displayRow
                const col = myColor === 'black' ? 7 - displayCol : displayCol
                const isLight = (displayRow + displayCol) % 2 === 0
                const isSelected = selected && selected[0] === row && selected[1] === col
                const isLastFrom = lastMove?.from[0] === row && lastMove?.from[1] === col
                const isLastTo = lastMove?.to[0] === row && lastMove?.to[1] === col
                const isLegal = legalMoves.some(([r,c]) => r === row && c === col)

                return (
                  <div
                    key={`${displayRow}-${displayCol}`}
                    onClick={() => handleSquareClick(row, col)}
                    style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'clamp(20px, 6vw, 38px)', cursor: isMyTurn ? 'pointer' : 'default',
                      userSelect: 'none',
                      background: isSelected ? 'rgba(108,99,255,0.5)'
                        : isLegal ? 'rgba(0,212,170,0.3)'
                        : isLastFrom || isLastTo ? 'rgba(255,184,0,0.2)'
                        : isLight ? '#F0D9B5' : '#B58863',
                      transition: 'background 0.15s',
                      position: 'relative',
                    }}
                  >
                    {piece && (
                      <span style={{ lineHeight: 1, filter: isSelected ? 'drop-shadow(0 0 6px var(--indigo))' : 'none' }}>
                        {PIECE_SYMBOLS[piece] || piece}
                      </span>
                    )}
                    {isLegal && !piece && (
                      <div style={{ width: '30%', height: '30%', borderRadius: '50%', background: 'rgba(0,212,170,0.6)' }} />
                    )}
                    {isLegal && piece && (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(0,212,170,0.8)' }} />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* FILE LABELS */}
          <div style={{ display: 'flex', paddingLeft: 2, marginTop: 4 }}>
            {(myColor === 'black' ? [...FILES].reverse() : FILES).map(f => (
              <div key={f} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* MY TIMER */}
      <div style={{ padding: '10px 20px', background: 'var(--surface2)', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--muted2)' }}>You ({myColor})</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800, color: isMyTurn ? 'var(--teal)' : 'var(--muted)', textShadow: isMyTurn ? '0 0 12px rgba(0,212,170,0.4)' : 'none' }}>
          {formatTime(timers[myColor] || 600)}
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line2)', display: 'flex', gap: 8 }}>
        <Button variant="ghost" full size="sm" onClick={() => getSocket()?.emit('chess:draw', { roomId })}>Offer draw</Button>
        <Button variant="danger" full size="sm" onClick={() => { if(window.confirm('Resign this game?')) getSocket()?.emit('chess:resign', { roomId }) }}>Resign</Button>
      </div>
    </div>
  )
}
