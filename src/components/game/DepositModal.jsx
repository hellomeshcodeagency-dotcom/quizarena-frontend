import { useState } from 'react'
import { walletAPI } from '../../services/api'
import useAuthStore from '../../context/authStore'
import { Button } from '../ui'
import toast from 'react-hot-toast'

const AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000]

export default function DepositModal({ onClose }) {
  const user       = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)
  const [amount,  setAmount]  = useState(5000)
  const [loading, setLoading] = useState(false)

  const bonus = amount >= 5000 ? Math.round(amount * 0.1) : 0

  const submit = async () => {
    setLoading(true)
    try {
      const { data } = await walletAPI.initDeposit(amount)
      // Redirect to Paystack
      window.location.href = data.authorization_url
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deposit failed')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">Deposit funds</div>
        <div className="modal-sub">
          Balance: <span style={{ fontFamily: 'var(--mono)', color: 'var(--amber)' }}>
            ₦{((user?.balance || 0) / 100).toLocaleString()}
          </span>
        </div>

        {/* DEPOSIT BONUS ALERT */}
        <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green-mid)', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 2 }}>
            Deposit bonus active
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>
            Deposit ₦5,000+ and get 10% bonus cash + 50 coins instantly.
          </div>
        </div>

        {/* AMOUNT GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
          {AMOUNTS.map(a => (
            <div
              key={a}
              onClick={() => setAmount(a)}
              style={{
                background: amount === a ? 'var(--blue-dim)' : 'var(--surface2)',
                border: `1px solid ${amount === a ? 'var(--blue-mid)' : 'var(--line)'}`,
                borderRadius: 'var(--r)', padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600,
                color: amount === a ? 'var(--amber)' : 'var(--text)',
                transition: 'all .15s',
              }}
            >
              ₦{a.toLocaleString()}
              {a >= 5000 && (
                <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, marginTop: 2 }}>
                  +₦{(a * 0.1).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SUMMARY */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Amount</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>₦{amount.toLocaleString()}</span>
          </div>
          {bonus > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Bonus (10%)</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>+₦{bonus.toLocaleString()}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total credited</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>
              ₦{(amount + bonus).toLocaleString()}
            </span>
          </div>
        </div>

        <Button variant="primary" full size="lg" loading={loading} onClick={submit}>
          Deposit ₦{amount.toLocaleString()} via Paystack
        </Button>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          Secured by 256-bit TLS · Powered by Paystack
        </div>
        <Button variant="ghost" full style={{ marginTop: 8 }} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
