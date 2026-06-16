// ── REFERRAL ──────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { referralAPI, walletAPI } from '../services/api'
import useAuthStore from '../context/authStore'
import { Button, TxRow } from '../components/ui'

export function Referral() {
  const navigate = useNavigate()
  const user     = useAuthStore(s => s.user)
  const [referrals, setReferrals] = useState([])

  useEffect(() => {
    referralAPI.list().then(r => setReferrals(r.data.referrals)).catch(() => {})
  }, [])

  const copy = () => {
    navigator.clipboard?.writeText(user?.referralCode || '').catch(() => {})
    toast.success('Code copied!')
  }

  const completed  = referrals.filter(r => r.status === 'completed').length
  const pending    = referrals.filter(r => r.status === 'pending').length
  const totalCoins = referrals.reduce((a, r) => a + (r.coins_awarded || 0), 0)

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Refer friends</div>
        </div>
      </div>

      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: 20, background: 'var(--surface)', borderBottom: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            You earn per successful referral
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 42, fontWeight: 800, color: 'var(--amber)' }}>100 coins</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 8 }}>
            Your friend earns 50 coins when they sign up with your code.<br />No cash bonuses — coins are free to issue and genuinely valuable.
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div
            style={{ background: 'var(--surface2)', border: '1px dashed var(--line2)', borderRadius: 'var(--r)', padding: 18, textAlign: 'center', cursor: 'pointer', marginBottom: 14 }}
            onClick={copy}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Your referral code</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, color: 'var(--amber)', letterSpacing: 4, marginBottom: 4 }}>
              {user?.referralCode || '...'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Tap to copy</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <Button variant="primary" full onClick={() => { navigator.clipboard?.writeText(`Join me on BrainBattle! Use code ${user?.referralCode} and get 50 bonus coins. https://quizarena.com/register?ref=${user?.referralCode}`); toast.success('Link copied!') }}>
              Share link
            </Button>
            <Button variant="ghost" full onClick={copy}>Copy code</Button>
          </div>

          <div style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue-mid)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginBottom: 3 }}>Why coins instead of cash?</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5 }}>
              Cash bonuses cost the platform money upfront. Coins cost nothing to issue but are genuinely useful — use them for power-ups that help you win more real money.
            </div>
          </div>

          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>How it works</div>
          {[
            { n: 1, t: 'Share your code',       d: 'Send your link to friends via WhatsApp, Instagram or SMS' },
            { n: 2, t: 'Friend signs up',        d: 'They create a BrainBattle account using your referral code' },
            { n: 3, t: 'Friend makes a deposit', d: 'They get 50 bonus coins. You get 100 coins instantly.'    },
            { n: 4, t: 'No limit on referrals',  d: 'Refer 100 friends = 10,000 coins. Coins win you more cash.' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: step.n === 4 ? 'var(--green)' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, color: step.n === 4 ? '#000' : '#fff' }}>
                {step.n}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{step.t}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{step.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Your stats</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 16, marginBottom: 12 }}>
            {[
              { l: 'Total referred', v: `${completed} friends`, c: 'var(--amber)' },
              { l: 'Coins earned',   v: `${totalCoins} coins`,  c: 'var(--amber)' },
              { l: 'Pending',        v: `${pending} pending`,   c: 'var(--muted)' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 2 ? 8 : 0 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{row.l}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: row.c }}>{row.v}</span>
              </div>
            ))}
          </div>

          {referrals.map(r => (
            <TxRow
              key={r.id}
              type={r.status === 'completed' ? 'referral_coin' : 'deposit'}
              name={`${r.referred_username} ${r.status === 'completed' ? 'joined & deposited' : 'signed up (awaiting deposit)'}`}
              date={new Date(r.created_at).toLocaleDateString()}
              amount={r.coins_awarded || 0}
              currency="COINS"
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ── COINS ─────────────────────────────────────────────────
export function Coins() {
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)
  const [loading, setLoading] = useState(false)

  const PACKS = [
    { coins: 100,  price: 200  },
    { coins: 300,  price: 500,  hot: true  },
    { coins: 700,  price: 1000 },
    { coins: 2000, price: 2500, best: true },
  ]

  const buy = async (coins) => {
    setLoading(true)
    try {
      const { data } = await walletAPI.buyCoins(coins)
      updateUser({ balance: data.wallet.balance, coins: data.wallet.coins })
      toast.success(`${coins} coins added!`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Purchase failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Coins</div>
        </div>
      </div>

      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: 20, background: 'var(--surface)', borderBottom: '1px solid var(--line)', textAlign: 'center' }}>
          <div className="amount-label">Your balance</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 42, fontWeight: 800, color: 'var(--amber)' }}>◈ {user?.coins || 0}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Use coins for power-ups and cosmetics</div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Buy coins</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {PACKS.map(p => (
              <div
                key={p.coins}
                onClick={() => buy(p.coins)}
                style={{
                  background: p.hot ? 'var(--blue-dim)' : 'var(--surface)',
                  border: `2px solid ${p.hot ? 'var(--blue-mid)' : 'var(--line)'}`,
                  borderRadius: 'var(--r)', padding: 16, textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color .15s',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{'◈'.repeat(Math.min(4, Math.ceil(p.coins / 500) + 1))}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.coins} coins</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>₦{p.price.toLocaleString()}</div>
                {p.hot  && <div style={{ marginTop: 8, display: 'inline-block', background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid var(--blue-mid)', borderRadius: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Popular</div>}
                {p.best && <div style={{ marginTop: 8, display: 'inline-block', background: 'var(--amber-dim)', color: 'var(--amber)', borderRadius: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Best value</div>}
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>What coins unlock</div>
          {[
            { icon: '⏱', title: 'Extra time',      cost: '10 coins — +5 seconds on your timer'  },
            { icon: '⊘', title: '50 / 50',          cost: '20 coins — remove 2 wrong answers'    },
            { icon: '↷', title: 'Skip question',    cost: '15 coins — skip without penalty'      },
            { icon: '◈', title: 'Score shield',     cost: '30 coins — protect your score this round' },
            { icon: '▣', title: 'Profile frame',    cost: '100–500 coins — cosmetic upgrade'     },
            { icon: '⊡', title: 'Username colour',  cost: '200 coins — stand out on leaderboard' },
          ].map(u => (
            <div key={u.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 16, width: 32, textAlign: 'center', flexShrink: 0 }}>{u.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{u.title}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)' }}>{u.cost}</div>
              </div>
            </div>
          ))}

          <div style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue-mid)', borderRadius: 'var(--r)', padding: '12px 14px', marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginBottom: 4 }}>Earn free coins</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 10 }}>Refer a friend who deposits → earn 100 coins automatically.</div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/referral')}>Refer friends →</Button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── PRACTICE ──────────────────────────────────────────────
export function Practice() {
  const navigate = useNavigate()
  const user     = useAuthStore(s => s.user)

  const CATS = [
    { name: 'Sports',            emoji: '⚽', questions: 500 },
    { name: 'General Knowledge', emoji: '💡', questions: 400 },
    { name: 'Geography',         emoji: '🌍', questions: 400 },
    { name: 'Science',           emoji: '🔬', questions: 600 },
    { name: 'Nollywood',         emoji: '🎬', questions: 350 },
    { name: 'Technology',        emoji: '💻', questions: 280 },
  ]

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Practice</div>
        </div>
      </div>

      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-mid)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 3 }}>5 free games remaining today</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)' }}>
              Free users get 5 practice sessions daily.{' '}
              <span style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={() => navigate('/vip')}>Go VIP for unlimited.</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Choose category</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATS.map(c => (
              <div
                key={c.name}
                onClick={() => navigate('/lobby', { state: { category: c.name, mode: 'practice' } })}
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <div style={{ fontSize: 22, width: 36, textAlign: 'center', flexShrink: 0 }}>{c.emoji}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.questions}+ questions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ── LANDING ───────────────────────────────────────────────
export function Landing() {
  const navigate = useNavigate()
  const [prize,   setPrize]   = useState(2847500)
  const [players, setPlayers] = useState(4291)

  useEffect(() => {
    const iv = setInterval(() => {
      setPrize(p => p + Math.floor(Math.random() * 900) + 200)
      setPlayers(p => p + Math.floor(Math.random() * 3) - 1)
    }, 1100)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* TOPBAR */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <img src="/logo.png" alt="BrainBattle" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log in</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Sign up</Button>
        </div>
      </div>

      {/* HERO */}
      <div style={{ padding: '48px 20px 40px', borderBottom: '1px solid var(--line)' }}>
        {/* BIG LOGO - visible in hero on desktop */}
        <style>{`
          .hero-logo { display: none; }
          @media (min-width: 768px) {
            .hero-logo { display: block; margin-bottom: 28px; }
            .hero-logo img { height: 72px; width: auto; }
          }
          @media (min-width: 1024px) {
            .hero-logo img { height: 96px; }
          }
        `}</style>
        <div className="hero-logo">
          <img src="/logo.png" alt="BrainBattle" />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 4, background: 'var(--blue-dim)', border: '1px solid var(--blue-mid)', fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'blink 1.4s ease infinite', display: 'inline-block' }} />
          Live now
        </div>
        <h1 style={{ marginBottom: 14 }}>Answer questions.<br />Win real money.</h1>
        <p style={{ fontSize: 15, color: 'var(--muted2)', lineHeight: 1.65, marginBottom: 28, maxWidth: 300 }}>
          Nigeria's most trusted real-money quiz platform. Compete in 1v1 duels, group battles and tournaments.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="primary" size="lg" onClick={() => navigate('/register')}>Get started</Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/login')}>Log in</Button>
        </div>
      </div>

      {/* LIVE POOL */}
      <div style={{ padding: '24px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <div className="amount-label">Total prize pool · live</div>
        <div className="amount-display">₦{prize.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Across <span style={{ color: 'var(--text)', fontWeight: 600 }}>1,043</span> active matches and <span style={{ color: 'var(--text)', fontWeight: 600 }}>{players.toLocaleString()}</span> players online
        </div>
      </div>

      {/* MODES */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Game modes</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '⚔', name: '1 vs 1',    desc: 'Head-to-head against one opponent' },
            { icon: '⊞', name: 'Group',      desc: '10 · 20 · 30 · 50 players compete' },
            { icon: '◉', name: 'Tournament', desc: 'Bracket elimination, one winner'   },
            { icon: '◎', name: 'Practice',   desc: 'Sharpen skills, no entry fee'       },
          ].map(m => (
            <div
              key={m.name}
              onClick={() => navigate('/register')}
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 16, cursor: 'pointer', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
            >
              <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--blue-dim)', border: '1px solid var(--blue-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 10 }}>
                {m.icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '32px 20px', textAlign: 'center' }}>
        <Button variant="primary" size="lg" full onClick={() => navigate('/register')}>
          Create your account
        </Button>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
          No cash bonuses. No hidden fees. Fair play guaranteed.
        </div>
      </div>
    </div>
  )
}

// ── NOT FOUND ─────────────────────────────────────────────
export function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 80, fontWeight: 800, color: 'var(--blue)', marginBottom: 16 }}>404</div>
      <h2 style={{ marginBottom: 8 }}>Page not found</h2>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>The page you're looking for doesn't exist.</div>
      <Button variant="primary" onClick={() => navigate('/dashboard')}>Go home</Button>
    </div>
  )
}

export default Referral
