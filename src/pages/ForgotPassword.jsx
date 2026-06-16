import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Button, Input } from '../components/ui'
import AuthLogo from '../components/ui/AuthLogo'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '40px 24px' }}>
        <AuthLogo />

        {sent ? (
          <div style={{ textAlign: 'center', animation: 'popIn 0.4s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📧</div>
            <h2 style={{ marginBottom: 10 }}>Check your email</h2>
            <p style={{ fontSize: 14, color: 'var(--muted2)', lineHeight: 1.7, marginBottom: 28 }}>
              If <strong style={{ color: 'var(--text)' }}>{email}</strong> is registered, we've sent a reset link. Check your inbox and spam folder.
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>
              The link expires in <strong style={{ color: 'var(--gold)' }}>1 hour</strong>.
            </p>
            <Link to="/login">
              <Button variant="primary" full size="lg">Back to login</Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: 6 }}>Forgot your password?</h2>
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted2)', marginBottom: 32, lineHeight: 1.6 }}>
              Enter your email and we'll send you a link to reset your password.
            </p>

            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={submit}>
              <Input
                label="Email address"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" full size="lg" loading={loading} style={{ marginTop: 4 }}>
                Send reset link
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--muted2)' }}>
              Remember your password?{' '}
              <Link to="/login" style={{ color: 'var(--indigo-lt)', fontWeight: 700, fontFamily: 'var(--display)' }}>
                Log in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
