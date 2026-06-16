import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'
import { walletAPI } from '../services/api'
import api from '../services/api'
import { Button, Input, StatChip, TxRow } from '../components/ui'

export default function Profile() {
  const navigate    = useNavigate()
  const user        = useAuthStore(s => s.user)
  const logout      = useAuthStore(s => s.logout)
  const updateUser  = useAuthStore(s => s.updateUser)

  const [tab,     setTab]     = useState('profile')
  const [pwForm,  setPwForm]  = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Logged out')
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      })
      toast.success('Password changed successfully')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const balance  = (user?.balance  || 0) / 100
  const earnings = (user?.totalEarned || 0) / 100
  const winRate  = user?.totalGames > 0
    ? Math.round((user.totalWins / user.totalGames) * 100)
    : 0

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      {/* TOPBAR */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700 }}>My Profile</div>
        </div>
        <button
          onClick={handleLogout}
          style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 'var(--r-sm)', padding: '6px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Logout
        </button>
      </div>

      {/* PROFILE HEADER */}
      <div style={{ padding: '28px 20px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--indigo), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, color: '#fff',
            boxShadow: '0 0 24px var(--indigo-glow)', flexShrink: 0,
          }}>
            {user?.avatarInitials || user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, marginBottom: 3 }}>
              {user?.username}
              {user?.isVip && (
                <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid rgba(255,184,0,0.25)', borderRadius: 100, padding: '2px 8px', fontWeight: 700 }}>
                  VIP
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted2)' }}>{user?.email}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Member since {joined}</div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          <StatChip label="Games"    value={user?.totalGames  || 0}                       />
          <StatChip label="Wins"     value={user?.totalWins   || 0} color="var(--teal)"   />
          <StatChip label="Win rate" value={`${winRate}%`}          color="var(--indigo-lt)" />
          <StatChip label="Earned"   value={`₦${Math.round(earnings).toLocaleString()}`}  color="var(--gold)" />
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line2)', background: 'var(--surface)' }}>
        {[
          { id: 'profile',  label: 'Profile'   },
          { id: 'security', label: 'Security'  },
          { id: 'referral', label: 'Referrals' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, height: 44,
              borderBottom: `2px solid ${tab === t.id ? 'var(--indigo)' : 'transparent'}`,
              color: tab === t.id ? 'var(--indigo-lt)' : 'var(--muted2)',
              fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13,
              background: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <div style={{ padding: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line2)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            {[
              { label: 'Username',     value: user?.username },
              { label: 'Email',        value: user?.email    },
              { label: 'Phone',        value: user?.phone || '—' },
              { label: 'Balance',      value: `₦${balance.toLocaleString()}`, color: 'var(--gold)' },
              { label: 'Coins',        value: `◈ ${user?.coins || 0}`,         color: 'var(--gold)' },
              { label: 'Referral code',value: user?.referralCode,              color: 'var(--indigo-lt)', mono: true },
              { label: 'VIP status',   value: user?.isVip ? `Active${user?.vipExpiresAt ? ' until ' + new Date(user.vipExpiresAt).toLocaleDateString() : ''}` : 'Not active', color: user?.isVip ? 'var(--teal)' : 'var(--muted)' },
              { label: 'Best streak',  value: `${user?.bestStreak || 0} wins`  },
              { label: 'Accuracy',     value: `${user?.accuracyPct || 0}%`     },
              { label: 'Global rank',  value: user?.globalRank ? `#${user.globalRank}` : 'Unranked' },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}
              >
                <span style={{ fontSize: 13, color: 'var(--muted2)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: row.color || 'var(--text)', fontFamily: row.mono ? 'var(--mono)' : 'inherit', letterSpacing: row.mono ? 2 : 0 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button variant="primary" full onClick={() => navigate('/wallet')}>Deposit / Withdraw</Button>
            <Button variant="ghost" full onClick={() => navigate('/vip')}>
              {user?.isVip ? 'Manage VIP' : 'Upgrade to VIP'}
            </Button>
            <Button
              variant="danger" full
              onClick={() => { if (window.confirm('Are you sure you want to logout?')) handleLogout() }}
            >
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* SECURITY TAB */}
      {tab === 'security' && (
        <div style={{ padding: 20 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Change password
          </div>
          <form onSubmit={changePassword}>
            <Input
              label="Current password"
              type="password"
              placeholder="Your current password"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              required
            />
            <Input
              label="New password"
              type="password"
              placeholder="Minimum 8 characters"
              value={pwForm.newPassword}
              onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="Type it again"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
              required
            />

            {/* Strength bar */}
            {pwForm.newPassword.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: pwForm.newPassword.length >= i * 2
                        ? i<=1 ? 'var(--red)' : i<=2 ? 'var(--gold)' : i<=3 ? 'var(--indigo)' : 'var(--teal)'
                        : 'var(--line2)',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
                  {pwForm.newPassword.length < 6 ? 'Too short' : pwForm.newPassword.length < 8 ? 'Weak' : pwForm.newPassword.length < 12 ? 'Good' : 'Strong'}
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" full size="lg" loading={loading}>
              Change password
            </Button>
          </form>

          <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--indigo-dim)', border: '1px solid var(--indigo-mid)', borderRadius: 12 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--indigo-lt)', marginBottom: 4 }}>
              Tips for a strong password
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              Use at least 12 characters · Mix letters, numbers and symbols · Never reuse passwords from other sites
            </div>
          </div>
        </div>
      )}

      {/* REFERRAL TAB */}
      {tab === 'referral' && (
        <div style={{ padding: 20 }}>
          <div style={{ background: 'var(--surface2)', border: '1px dashed var(--indigo-mid)', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16, cursor: 'pointer' }}
            onClick={() => { navigator.clipboard?.writeText(user?.referralCode || ''); toast.success('Code copied!') }}
          >
            <div style={{ fontSize: 11, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Your referral code
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 800, color: 'var(--gold)', letterSpacing: 4, marginBottom: 6 }}>
              {user?.referralCode}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Tap to copy</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            <Button variant="primary" full onClick={() => { navigator.clipboard?.writeText(`Join me on BrainBattle! Use code ${user?.referralCode} and get 50 bonus coins. ${window.location.origin}/register?ref=${user?.referralCode}`); toast.success('Link copied!') }}>
              Share link
            </Button>
            <Button variant="ghost" full onClick={() => navigate('/referral')}>
              View referrals
            </Button>
          </div>

          <div style={{ background: 'var(--teal-dim)', border: '1px solid var(--teal-mid)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>
              Earn 100 coins per referral
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              When a friend signs up with your code and makes their first deposit, you get 100 coins instantly. They get 50 coins too.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
