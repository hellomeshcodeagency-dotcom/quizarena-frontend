import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import useAuthStore from '../context/authStore'

export default function Results() {
  const location      = useLocation()
  const navigate      = useNavigate()
  const user          = useAuthStore(s => s.user)
  const { result, stakeNaira = 0 } = location.state || {}

  if (!result) { navigate('/dashboard'); return null }

  const isWinner   = result.winnerId === user?.id
  const myScore    = result.scores?.[user?.id] || 0
  const prizeNaira = (result.prize || 0) / 100
  const feeNaira   = (result.platformFee || 0) / 100
  const lossNaira  = (stakeNaira * 0.9)
  const cashback   = Math.round(stakeNaira * 0.1)

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: '40px 20px 100px', textAlign: 'center', background: 'var(--bg)',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, marginBottom: 16,
        background: isWinner ? 'var(--green-dim)' : 'var(--red-dim)',
        border: `1px solid ${isWinner ? 'var(--green-mid)' : 'var(--red-mid)'}`,
        animation: 'pop .6s ease',
      }}>
        {isWinner ? '🏆' : ''}
      </div>

      <div style={{
        fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800,
        color: isWinner ? 'var(--green)' : 'var(--red)', marginBottom: 4,
      }}>
        {isWinner ? 'You won' : 'Better luck next time'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        {myScore} points scored
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 42, fontWeight: 600,
        color: isWinner ? 'var(--amber)' : 'var(--red)', marginBottom: 20,
      }}>
        {isWinner ? `+₦${prizeNaira.toLocaleString()}` : `-₦${lossNaira.toLocaleString()}`}
      </div>

      {/* STATS TABLE */}
      <div style={{ width: '100%', maxWidth: 340, border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 18 }}>
        {[
          { l: 'Your score',         v: `${myScore} pts` },
          { l: 'Prize won',          v: isWinner ? `₦${prizeNaira.toLocaleString()}` : '—',       c: isWinner ? 'var(--amber)' : undefined },
          { l: 'Platform fee (10%)', v: isWinner ? `₦${feeNaira.toLocaleString()}` : '—',          c: 'var(--muted)' },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderBottom: i < 2 ? '1px solid var(--line)' : 'none' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{row.l}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: row.c || 'var(--text)' }}>{row.v}</span>
          </div>
        ))}
      </div>

      {/* CASHBACK NOTICE */}
      {!isWinner && cashback > 0 && (
        <div style={{
          width: '100%', maxWidth: 340, background: 'var(--green-dim)',
          border: '1px solid var(--green-mid)', borderRadius: 'var(--r)',
          padding: '12px 14px', marginBottom: 18,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 3 }}>Cashback applied</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>₦{cashback.toLocaleString()} returned to your wallet</div>
        </div>
      )}

      {/* ACTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 340 }}>
        <Button variant="primary" full size="lg" onClick={() => navigate('/lobby')}>Play again</Button>
        {isWinner && <Button variant="success" full onClick={() => navigate('/wallet')}>Withdraw winnings</Button>}
        <Button variant="ghost" full onClick={() => navigate('/tournaments')}>Join a tournament</Button>
        <Button variant="outline" full onClick={() => navigate('/dashboard')}>Back to home</Button>
      </div>
    </div>
  )
}
