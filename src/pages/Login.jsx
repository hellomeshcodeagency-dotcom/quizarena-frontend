import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'
import { Button, Input } from '../components/ui'
import AuthLogo from '../components/ui/AuthLogo'

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '40px 24px' }}>
        <AuthLogo />

        <h2 style={{ textAlign: 'center', marginBottom: 6 }}>Welcome back</h2>
        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted2)', marginBottom: 32 }}>
          Sign in to your BrainBattle account
        </div>

        {error && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 20, animation: 'popIn 0.3s ease' }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <Input
            label="Email or phone"
            type="text"
            placeholder="08012345678 or you@email.com"
            value={form.identifier}
            onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required
          />

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: 13, color: 'var(--indigo-lt)', fontFamily: 'var(--display)', fontWeight: 600 }}
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" full size="lg" loading={loading}>
            Sign in
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--muted2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--indigo-lt)', fontWeight: 700, fontFamily: 'var(--display)' }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  )
}
