import { useState } from 'react'
import { walletAPI } from '../../services/api'
import useAuthStore from '../../context/authStore'
import { Button } from '../ui'
import toast from 'react-hot-toast'

const AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000]

export default function DepositModal({ onClose }) {
  const user      = useAuthStore(s => s.user)
  const [amount,  setAmount]  = useState(5000)
  const [loading, setLoading] = useState(false)

  const balance = (user?.balance || 0) / 100

  const submit = async () => {
    setLoading(true)
    try {
      const { data } = await walletAPI.initDeposit(amount)
      window.location.href = data.authorization_url
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deposit failed. Check your Paystack key in Render.')
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
            Current balance:{' '}
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--gold)', fontWeight: 700 }}>
              ₦{balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* AMOUNT GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
          {AMOUNTS.map(a => (
            <div
              key={a}
              onClick={() => setAmount(a)}
              style={{
                background: amount === a ? 'var(--indigo-dim)' : 'var(--surface2)',
                border: `1px solid ${amount === a ? 'var(--indigo)' : 'var(--line2)'}`,
                borderRadius: 10, padding: '14px 8px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                transform: amount === a ? 'scale(1.04)' : 'none',
                boxShadow: amount === a ? '0 0 12px var(--indigo-dim)' : 'none',
              }}
            >
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
                color: amount === a ? 'var(--gold)' : 'var(--text)',
              }}>
                ₦{a.toLocaleString()}
              </div>
            </div>
          ))}
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
