import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../context/authStore'
import { Button, Input, Brand } from '../components/ui'

export default function Register() {
  const register = useAuthStore(s => s.register)
  const navigate  = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '', referralCode: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 20px', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <Brand size={22} />
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Real-money quiz. Compete and earn.</div>
        </div>

        <h2 style={{ marginBottom: 20 }}>Create your account</h2>

        {error && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <Input label="Username" type="text" placeholder="your_username" value={form.username} onChange={set('username')} hint="Letters, numbers and underscores only" required />
          <Input label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} required />
          <Input label="Phone number" type="tel" placeholder="08012345678" value={form.phone} onChange={set('phone')} />
          <Input label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={set('password')} required />
          <Input label="Referral code (optional)" type="text" placeholder="Enter a friend's code for 50 bonus coins" value={form.referralCode} onChange={set('referralCode')} />

          {/* What you get */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              What you get on signup
            </div>
            {[
              '20 free coins — use them for in-game power-ups',
              '5 free practice games every day',
              'Access to free weekly tournaments',
              'Real-time global leaderboard ranking',
            ].map(perk => (
              <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted2)', padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
                {perk}
              </div>
            ))}
          </div>

          <Button type="submit" variant="primary" full size="lg" loading={loading}>
            Create account
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Log in</Link>
        </div>
      </div>
    </div>
  )
}
