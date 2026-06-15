import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { vipAPI } from '../services/api'
import useAuthStore from '../context/authStore'
import { Button } from '../components/ui'

const PLANS = {
  weekly:  { name: 'VIP Weekly', price: 500,   priceLabel: '₦500/week',   coins: 50,   days: 7   },
  monthly: { name: 'VIP Gold',   price: 1500,  priceLabel: '₦1,500/month', coins: 200,  days: 30  },
  annual:  { name: 'VIP Annual', price: 12000, priceLabel: '₦12,000/year', coins: 2400, days: 365 },
}

const FEATURES = [
  'Unlimited games per day',
  'Zero ads during gameplay',
  'Priority matchmaking',
  'All 15+ categories unlocked',
  '+10% bonus on every win',
  'VIP-only tournaments (₦1M prize)',
  'Monthly coins bonus included',
  'Animated profile frame',
]

const COMPARISON = [
  { f: 'Daily games',     free: '5',   vip: 'Unlimited', vc: 'var(--green)' },
  { f: 'Ads',             free: 'Yes', vip: 'None',      vc: 'var(--green)', fc: 'var(--red)' },
  { f: 'Categories',      free: '6',   vip: '15+',       vc: 'var(--green)' },
  { f: 'Win bonus',       free: '—',   vip: '+10%',      vc: 'var(--green)' },
  { f: 'VIP tournaments', free: 'No',  vip: 'Yes',       vc: 'var(--green)', fc: 'var(--red)' },
  { f: 'Monthly coins',   free: '—',   vip: 'Included',  vc: 'var(--amber)' },
]

export default function Vip() {
  const navigate    = useNavigate()
  const updateUser  = useAuthStore(s => s.updateUser)
  const [plan,    setPlan]    = useState('monthly')
  const [loading, setLoading] = useState(false)

  const selected = PLANS[plan]

  const subscribe = async () => {
    setLoading(true)
    try {
      await vipAPI.subscribe(plan)
      updateUser({ isVip: true })
      toast.success('VIP activated!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Subscription failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700 }}>VIP membership</div>
        <div />
      </div>

      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: '28px 20px', borderBottom: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
            Unlock more.<br />Win more.
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            VIP members earn more from every match
          </div>
        </div>

        {/* PLAN TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
          {Object.entries(PLANS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setPlan(key)}
              style={{
                flex: 1, height: 44,
                borderBottom: `2px solid ${plan === key ? 'var(--blue)' : 'transparent'}`,
                color: plan === key ? 'var(--blue)' : 'var(--muted)',
                fontWeight: 700, fontSize: 13, textTransform: 'capitalize',
                background: 'none', cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {key}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* PLAN CARD */}
          <div style={{ background: 'var(--blue-dim)', border: '2px solid var(--blue-mid)', borderRadius: 'var(--r)', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Recommended
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {selected.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 600, color: 'var(--amber)' }}>
                ₦{selected.price.toLocaleString()}
              </span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                /{plan === 'weekly' ? 'week' : plan === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
                {f === 'Monthly coins bonus included'
                  ? `${selected.coins} free coins included`
                  : f}
              </div>
            ))}
          </div>

          <Button variant="primary" full size="lg" loading={loading} onClick={subscribe}>
            Start {selected.name} — {selected.priceLabel}
          </Button>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
            Cancel anytime. No hidden charges.
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden', margin: '0 20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '10px 14px', background: 'var(--surface2)', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <div>Feature</div>
            <div style={{ textAlign: 'center' }}>Free</div>
            <div style={{ textAlign: 'center', color: 'var(--blue)' }}>VIP</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '10px 14px', borderTop: '1px solid var(--line)', fontSize: 12, alignItems: 'center' }}>
              <div style={{ color: 'var(--muted)' }}>{row.f}</div>
              <div style={{ textAlign: 'center', color: row.fc || 'var(--muted)' }}>{row.free}</div>
              <div style={{ textAlign: 'center', color: row.vc || 'var(--text)', fontWeight: 600 }}>{row.vip}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
