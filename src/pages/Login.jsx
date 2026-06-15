// LOGIN PAGE
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'
import { Button, Input, Brand } from '../components/ui'

export function Login() {
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.identifier, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 20px', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <Brand size={22} />
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Real-money quiz. Compete and earn.</div>
        </div>

        <h2 style={{ marginBottom: 20 }}>Log in to your account</h2>

        {error && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
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
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--blue)', cursor: 'pointer' }}>Forgot password?</span>
          </div>
          <Button type="submit" variant="primary" full size="lg" loading={loading}>
            Log in
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--blue)', fontWeight: 600 }}>Sign up</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
