import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'
import { Button, Input, Brand } from '../components/ui'

export default function Login() {
  const login    = useAuthStore(s => s.login)
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ identifier: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.identifier, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero-gradient" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Decorative orbs */}
      <div style={{ position: 'fixed', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="page-in" style={{ maxWidth: 440, margin: '0 auto', padding: '60px 24px 40px', width: '100%', flex: 1 }}>
        <div style={{ marginBottom: 40 }}>
          <Brand size={24} />
          <div style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 8 }}>Real-money quiz. Compete and earn.</div>
        </div>

        <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
        <div style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 32 }}>Sign in to your QuizArena account</div>

        {error && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--red)', marginBottom: 20, animation: 'popIn 0.3s ease' }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <Input label="Email or phone" type="text" placeholder="08012345678 or you@email.com" value={form.identifier} onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))} required />
          <Input label="Password" type="password" placeholder="Your password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--indigo-lt)', cursor: 'pointer', fontFamily: 'var(--display)', fontWeight: 600 }}>Forgot password?</Link>
          </div>

          <Button type="submit" variant="primary" full size="lg" loading={loading}>
            Sign in
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--muted2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--indigo-lt)', fontWeight: 700, fontFamily: 'var(--display)' }}>Create one</Link>
        </div>
      </div>
    </div>
  )
}
