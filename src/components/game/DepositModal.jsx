import { useState } from 'react'
import { walletAPI } from '../../services/api'
import useAuthStore from '../../context/authStore'
import { Button } from '../ui'
import toast from 'react-hot-toast'

const AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000]

export default function DepositModal({ onClose }) {
  const user       = useAuthStore(s => s.user)
  const [amount,  setAmount]  = useState(5000)
  const [loading, setLoading] = useState(false)

  const bonus    = amount >= 5000 ? Math.round(amount * 0.1) : 0
  const total    = amount + bonus
  const balance  = (user?.balance || 0) / 100

  const submit = async () => {
    setLoading(true)
    try {
      const { data } = await walletAPI.initDeposit(amount)
      window.location.href = data.authorization_url
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deposit failed. Check Paystack keys.')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ marginBottom: 20 }}>
          <div className="modal-title">Deposit funds</div>
          <div style={{ fontSize: 13, color: 'var(--muted2)' }}>
            Current balance: <span style={{ fontFamily: 'var(--mono)', color: 'var(--gold)', fontWeight: 700 }}>₦{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* BONUS ALERT */}
        <div style={{ background: 'var(--teal-dim)', border: '1px solid var(--teal-mid)', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--teal)', marginBottom: 3 }}>
            🎁 Deposit bonus active
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Deposit ₦5,000 or more and get <strong>10% bonus cash + 50 coins</strong> instantly.
          </div>
        </div>

        {/* AMOUNT GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
          {AMOUNTS.map(a => (
            <div
              key={a}
              onClick={() => setAmount(a)}
              style={{
                background: amount === a ? 'var(--indigo-dim)' : 'var(--surface2)',
                border: `1px solid ${amount === a ? 'var(--indigo)' : 'var(--line2)'}`,
                borderRadius: 10, padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s', transform: amount === a ? 'scale(1.03)' : 'none',
                boxShadow: amount === a ? '0 0 12px var(--indigo-dim)' : 'none',
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: amount === a ? 'var(--gold)' : 'var(--text)', marginBottom: 2 }}>
                ₦{a.toLocaleString()}
              </div>
              {a >= 5000 && (
                <div style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--teal)' }}>
                  +₦{(a * 0.1).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SUMMARY */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--line2)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--muted2)' }}>You pay</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700 }}>₦{amount.toLocaleString()}</span>
          </div>
          {bonus > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--muted2)' }}>Bonus (10%)</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>+₦{bonus.toLocaleString()}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--line2)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700 }}>You receive</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800, color: 'var(--gold)', textShadow: '0 0 12px var(--gold-glow)' }}>₦{total.toLocaleString()}</span>
          </div>
        </div>

        <Button variant="primary" full size="lg" loading={loading} onClick={submit}>
          Pay ₦{amount.toLocaleString()} via Paystack
        </Button>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
          🔒 Secured by Paystack · 256-bit TLS
        </div>
        <Button variant="ghost" full style={{ marginTop: 10 }} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
