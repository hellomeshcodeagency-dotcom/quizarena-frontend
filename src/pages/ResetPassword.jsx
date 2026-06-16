import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import { Button, Input } from '../components/ui'
import AuthLogo from '../components/ui/AuthLogo'

export default function ResetPassword() {
  const [searchParams]                   = useSearchParams()
  const navigate                         = useNavigate()
  const token                            = searchParams.get('token')

  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [done,            setDone]            = useState(false)
  const [error,           setError]           = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 8)          { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, newPassword })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <AuthLogo />
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h2 style={{ marginBottom: 10 }}>Invalid link</h2>
        <p style={{ color: 'var(--muted2)', marginBottom: 24 }}>This reset link is invalid or has expired.</p>
        <Link to="/forgot-password">
          <Button variant="primary">Request new link</Button>
        </Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '40px 24px' }}>
        <AuthLogo />

        {done ? (
          <div style={{ textAlign: 'center', animation: 'popIn 0.4s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ marginBottom: 10 }}>Password reset!</h2>
            <p style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 28, lineHeight: 1.6 }}>
              Your password has been changed. You can now log in with your new password.
            </p>
            <Button variant="primary" full size="lg" onClick={() => navigate('/login')}>
              Log in now
            </Button>
          </div>
        ) : (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: 6 }}>Create new password</h2>
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted2)', marginBottom: 32, lineHeight: 1.6 }}>
              Choose a strong password for your BrainBattle account.
            </p>

            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 20 }}>
                {error}{' '}
                {error.includes('expired') && (
                  <Link to="/forgot-password" style={{ color: 'var(--indigo-lt)', fontWeight: 700 }}>
                    Request new link
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={submit}>
              <Input
                label="New password"
                type="password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="Type it again"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />

              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2, transition: 'background 0.2s',
                        background: newPassword.length >= i * 2
                          ? i<=1 ? 'var(--red)' : i<=2 ? 'var(--gold)' : i<=3 ? 'var(--indigo)' : 'var(--teal)'
                          : 'var(--line2)',
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
                    {newPassword.length < 6 ? 'Too short' : newPassword.length < 8 ? 'Weak' : newPassword.length < 12 ? 'Good' : 'Strong'}
                  </div>
                </div>
              )}

              <Button type="submit" variant="primary" full size="lg" loading={loading}>
                Reset password
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
