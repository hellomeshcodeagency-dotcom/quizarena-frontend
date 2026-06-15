import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { walletAPI } from '../services/api'
import useAuthStore from '../context/authStore'
import { Button, Input, TxRow } from '../components/ui'

const AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000]

export default function Wallet() {
  const navigate    = useNavigate()
  const user        = useAuthStore(s => s.user)
  const updateUser  = useAuthStore(s => s.updateUser)

  const [tab,      setTab]      = useState('deposit')
  const [txns,     setTxns]     = useState([])
  const [depAmt,   setDepAmt]   = useState(5000)
  const [loading,  setLoading]  = useState(false)
  const [wdForm,   setWdForm]   = useState({ amount: '', accountNumber: '', bankName: '' })

  const balance = (user?.balance || 0) / 100
  const bonus   = depAmt >= 5000 ? Math.round(depAmt * 0.1) : 0

  useEffect(() => {
    walletAPI.transactions({ limit: 30 })
      .then(r => setTxns(r.data.transactions))
      .catch(() => {})
  }, [])

  const initDeposit = async () => {
    setLoading(true)
    try {
      const { data } = await walletAPI.initDeposit(depAmt)
      window.location.href = data.authorization_url
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deposit failed')
      setLoading(false)
    }
  }

  const doWithdraw = async () => {
    const { amount, accountNumber, bankName } = wdForm
    if (!amount || Number(amount) < 1000) { toast.error('Minimum withdrawal is ₦1,000'); return }
    if (!accountNumber) { toast.error('Enter your account number'); return }
    setLoading(true)
    try {
      await walletAPI.withdraw({ amount: Number(amount), bankCode: '000', accountNumber, accountName: bankName })
      toast.success('Withdrawal request submitted. Processing within 24 hours.')
      setWdForm({ amount: '', accountNumber: '', bankName: '' })
      walletAPI.transactions({ limit: 30 }).then(r => setTxns(r.data.transactions))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Wallet</div>
        </div>
      </div>

      <div style={{ paddingBottom: 80 }}>
        {/* BALANCE */}
        <div style={{ padding: 20, background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
          <div className="amount-label">Available balance</div>
          <div className="amount-display">₦{balance.toLocaleString()}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <Button variant="primary" full onClick={() => setTab('deposit')}>Deposit</Button>
            <Button variant="outline" full onClick={() => setTab('withdraw')}>Withdraw</Button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
          {['deposit', 'withdraw', 'history'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, height: 44,
                borderBottom: `2px solid ${tab === t ? 'var(--blue)' : 'transparent'}`,
                color: tab === t ? 'var(--blue)' : 'var(--muted)',
                fontWeight: 700, fontSize: 13, textTransform: 'capitalize',
                background: 'none', cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* DEPOSIT */}
        {tab === 'deposit' && (
          <div style={{ padding: 20 }}>
            <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green-mid)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 3 }}>Deposit bonus active</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>Deposit ₦5,000+ and get 10% bonus cash + 50 coins instantly.</div>
            </div>

            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Choose amount</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {AMOUNTS.map(a => (
                <div
                  key={a}
                  onClick={() => setDepAmt(a)}
                  style={{
                    background: depAmt === a ? 'var(--blue-dim)' : 'var(--surface2)',
                    border: `1px solid ${depAmt === a ? 'var(--blue-mid)' : 'var(--line)'}`,
                    borderRadius: 'var(--r)', padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600,
                    color: depAmt === a ? 'var(--amber)' : 'var(--text)',
                  }}
                >
                  ₦{a.toLocaleString()}
                  {a >= 5000 && <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, marginTop: 2 }}>+₦{(a * 0.1).toLocaleString()}</div>}
                </div>
              ))}
            </div>

            {bonus > 0 && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>You deposit</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>₦{depAmt.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Bonus (10%)</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)' }}>+₦{bonus.toLocaleString()}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Total credited</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>₦{(depAmt + bonus).toLocaleString()}</span>
                </div>
              </div>
            )}

            <Button variant="primary" full size="lg" loading={loading} onClick={initDeposit}>
              Deposit ₦{depAmt.toLocaleString()} via Paystack
            </Button>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              256-bit TLS encryption · Powered by Paystack
            </div>
          </div>
        )}

        {/* WITHDRAW */}
        {tab === 'withdraw' && (
          <div style={{ padding: 20 }}>
            <Input
              label="Amount (₦)"
              type="number"
              placeholder="Minimum ₦1,000"
              value={wdForm.amount}
              onChange={e => setWdForm(p => ({ ...p, amount: e.target.value }))}
              hint="Processed within 24 hours"
            />
            <Input
              label="Account number"
              type="text"
              placeholder="10-digit account number"
              value={wdForm.accountNumber}
              onChange={e => setWdForm(p => ({ ...p, accountNumber: e.target.value }))}
            />
            <Input
              label="Bank name"
              type="text"
              placeholder="GTBank / Access / Zenith / UBA / Opay"
              value={wdForm.bankName}
              onChange={e => setWdForm(p => ({ ...p, bankName: e.target.value }))}
              hint="KYC required for amounts above ₦50,000"
            />
            <Button variant="primary" full size="lg" loading={loading} onClick={doWithdraw}>
              Request withdrawal
            </Button>
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div style={{ padding: '0 20px' }}>
            {txns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>No transactions yet</div>
            ) : txns.map(tx => (
              <TxRow
                key={tx.id}
                type={tx.type}
                name={tx.description}
                date={new Date(tx.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                amount={tx.amount}
                currency={tx.currency}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
