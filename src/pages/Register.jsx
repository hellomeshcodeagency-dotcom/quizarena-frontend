import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../context/authStore'
import { Button, Input, Brand } from '../components/ui'

export default function Register() {
  const register = useAuthStore(s => s.register)
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ username: '', email: '', phone: '', password: '', referralCode: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero-gradient" style={{ minHeight: '100vh' }}>
      <div style={{ position: 'fixed', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="page-in" style={{ maxWidth: 440, margin: '0 auto', padding: '60px 24px 60px', width: '100%' }}>
        <div style={{ marginBottom: 36 }}>
          <Brand size={24} />
          <div style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 8 }}>Nigeria's real-money quiz platform</div>
        </div>

        <h2 style={{ marginBottom: 6 }}>Create your account</h2>
        <div style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 28 }}>Join 50,000+ players competing daily</div>

        {error && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--red)', marginBottom: 20, animation: 'popIn 0.3s ease' }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <Input label="Username" type="text" placeholder="your_username" value={form.username} onChange={set('username')} hint="Letters, numbers and underscores only" required />
          <Input label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} required />
          <Input label="Phone number" type="tel" placeholder="08012345678" value={form.phone} onChange={set('phone')} />
          <Input label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={set('password')} required />
          <Input label="Referral code (optional)" type="text" placeholder="Get 50 bonus coins" value={form.referralCode} onChange={set('referralCode')} />

          {/* PERKS */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--line2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              What you get free
            </div>
            {[
              { icon: '◈', text: '20 free coins on signup', color: 'var(--gold)' },
              { icon: '🎯', text: '5 free practice games every day', color: 'var(--indigo-lt)' },
              { icon: '🏆', text: 'Access to free weekly tournaments', color: 'var(--purple)' },
              { icon: '📊', text: 'Real-time global leaderboard', color: 'var(--teal)' },
            ].map(p => (
              <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{p.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{p.text}</span>
              </div>
            ))}
          </div>

          <Button type="submit" variant="primary" full size="lg" loading={loading}>
            Create account
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--indigo-lt)', fontWeight: 700, fontFamily: 'var(--display)' }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
