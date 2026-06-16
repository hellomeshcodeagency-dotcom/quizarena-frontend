import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../../services/socket'
import useAuthStore from '../../context/authStore'
import { Button } from '../../components/ui'

const WINNING_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

export default function TicTacToe() {
  const { roomId }  = useParams()
  const location    = useLocation()
  const navigate    = useNavigate()
  const user        = useAuthStore(s => s.user)

  const [board,       setBoard]       = useState(Array(9).fill(null))
  const [mySymbol,    setMySymbol]    = useState(null)
  const [currentTurn, setCurrentTurn] = useState(null)
  const [status,      setStatus]      = useState('waiting')
  const [result,      setResult]      = useState(null)
  const [winLine,     setWinLine]     = useState([])
  const [players,     setPlayers]     = useState([])

  const { stakeNaira = 0 } = location.state || {}
  const isMyTurn = currentTurn === user?.id

  useEffect(() => {
    const socket = getSocket()
    if (!socket) { navigate('/games'); return }

    socket.emit('ttt:join', { roomId })

    socket.on('ttt:state', ({ board, symbols, currentTurn, players }) => {
      setBoard(board)
      setMySymbol(symbols[user.id])
      setCurrentTurn(currentTurn)
      setPlayers(players)
    })

    socket.on('ttt:start', ({ symbols, currentTurn }) => {
      setMySymbol(symbols[user.id])
      setCurrentTurn(currentTurn)
      setStatus('playing')
    })

    socket.on('ttt:move', ({ board }) => setBoard(board))

    socket.on('ttt:turn', ({ currentTurn }) => setCurrentTurn(currentTurn))

    socket.on('ttt:ended', ({ result, winnerId, line }) => {
      setWinLine(line)
      setStatus('ended')
      setResult({ result, winnerId, isWinner: winnerId === user.id })
    })

    return () => {
      socket.off('ttt:state')
      socket.off('ttt:start')
      socket.off('ttt:move')
      socket.off('ttt:turn')
      socket.off('ttt:ended')
    }
  }, [roomId])

  const makeMove = (index) => {
    if (!isMyTurn || board[index] || status !== 'playing') return
    getSocket()?.emit('ttt:move', { roomId, cellIndex: index })
  }

  const resign = () => getSocket()?.emit('ttt:resign', { roomId })

  if (status === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>⭕</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>Waiting for opponent...</div>
        <div style={{ fontSize: 13, color: 'var(--muted2)' }}>₦{stakeNaira.toLocaleString()} stake</div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (status === 'ended' && result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', animation: 'pageIn 0.4s ease' }}>
        <div style={{ fontSize: 64, marginBottom: 16, animation: 'popIn 0.6s ease' }}>
          {result.result === 'draw' ? '🤝' : result.isWinner ? '🏆' : '💀'}
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 800, marginBottom: 8, color: result.result === 'draw' ? 'var(--muted2)' : result.isWinner ? 'var(--teal)' : 'var(--red)' }}>
          {result.result === 'draw' ? "It's a draw" : result.isWinner ? 'You won!' : 'You lost'}
        </div>
        {result.isWinner && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', textShadow: '0 0 20px var(--gold-glow)', marginBottom: 8 }}>
            +₦{(stakeNaira * 2 * 0.9).toLocaleString()}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 24 }}>
          <Button variant="primary" full size="lg" onClick={() => navigate('/games')}>Play again</Button>
          <Button variant="outline" full onClick={() => navigate('/wallet')}>Withdraw</Button>
          <Button variant="ghost" full onClick={() => navigate('/dashboard')}>Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 800 }}>Tic-tac-toe</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>
            You are <span style={{ color: mySymbol === 'X' ? 'var(--indigo-lt)' : 'var(--red)', fontWeight: 700, fontFamily: 'var(--mono)' }}>{mySymbol}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>
            ₦{(stakeNaira * 2 * 0.9).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>prize pool</div>
        </div>
      </div>

      {/* TURN INDICATOR */}
      <div style={{ padding: '14px 20px', textAlign: 'center', background: isMyTurn ? 'var(--indigo-dim)' : 'var(--surface2)', borderBottom: '1px solid var(--line2)', transition: 'background 0.3s' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: isMyTurn ? 'var(--indigo-lt)' : 'var(--muted2)' }}>
          {isMyTurn ? '🎯 Your turn' : "⏳ Opponent's turn"}
        </div>
      </div>

      {/* BOARD */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 320, width: '100%' }}>
          {board.map((cell, i) => {
            const isWin = winLine.includes(i)
            return (
              <div
                key={i}
                onClick={() => makeMove(i)}
                style={{
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isWin ? 'var(--teal-dim)' : 'var(--surface2)',
                  border: `2px solid ${isWin ? 'var(--teal)' : isMyTurn && !cell ? 'var(--line2)' : 'var(--line)'}`,
                  borderRadius: 16, cursor: isMyTurn && !cell ? 'pointer' : 'default',
                  fontSize: 48, fontFamily: 'var(--mono)', fontWeight: 900,
                  color: cell === 'X' ? 'var(--indigo-lt)' : 'var(--red)',
                  transition: 'all 0.2s', userSelect: 'none',
                  boxShadow: isWin ? '0 0 20px var(--teal-mid)' : 'none',
                  animation: cell ? 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                }}
                onMouseEnter={e => { if (isMyTurn && !cell) e.currentTarget.style.borderColor = 'var(--indigo)' }}
                onMouseLeave={e => { if (isMyTurn && !cell) e.currentTarget.style.borderColor = 'var(--line2)' }}
              >
                {cell}
              </div>
            )
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line2)' }}>
        <Button variant="danger" full onClick={resign}>Resign</Button>
      </div>
    </div>
  )
}
