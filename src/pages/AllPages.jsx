// ─── RESULTS PAGE ─────────────────────────────────────────
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Brand } from '../components/ui'
import useAuthStore from '../context/authStore'

export function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const updateBalance = useAuthStore(s => s.updateBalance)
  const user = useAuthStore(s => s.user)
  const { result, stakeNaira = 0 } = location.state || {}

  if (!result) { navigate('/dashboard'); return null }

  const isWinner   = result.winnerId === user?.id
  const myScore    = result.scores?.[user?.id] || 0
  const prizeNaira = (result.prize || 0) / 100
  const feeNaira   = (result.platformFee || 0) / 100
  const lossNaira  = stakeNaira * 0.9
  const cashback   = Math.round(stakeNaira * 0.1)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '40px 20px 100px', textAlign: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 16, background: isWinner ? 'var(--green-dim)' : 'var(--red-dim)', border: `1px solid ${isWinner ? 'var(--green-mid)' : 'var(--red-mid)'}`, animation: 'pop .6s ease' }}>
        {isWinner ? 'W' : 'L'}
      </div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, color: isWinner ? 'var(--green)' : 'var(--red)', marginBottom: 4 }}>
        {isWinner ? 'You won' : 'Better luck next time'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        {myScore} points scored
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 42, fontWeight: 600, color: isWinner ? 'var(--amber)' : 'var(--red)', marginBottom: 20 }}>
        {isWinner ? `+₦${prizeNaira.toLocaleString()}` : `-₦${lossNaira.toLocaleString()}`}
      </div>

      <div style={{ width: '100%', maxWidth: 340, border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 18 }}>
        {[
          { l: 'Your score',      v: `${myScore} pts` },
          { l: 'Prize won',       v: isWinner ? `₦${prizeNaira.toLocaleString()}` : '—', c: isWinner ? 'var(--amber)' : undefined },
          { l: 'Platform fee (10%)', v: isWinner ? `₦${feeNaira.toLocaleString()}` : '—', c: 'var(--muted)' },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderBottom: i < 2 ? '1px solid var(--line)' : 'none' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{row.l}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: row.c || 'var(--text)' }}>{row.v}</span>
          </div>
        ))}
      </div>

      {!isWinner && (
        <div style={{ width: '100%', maxWidth: 340, background: 'var(--green-dim)', border: '1px solid var(--green-mid)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 3 }}>Cashback applied</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>₦{cashback.toLocaleString()} returned to your wallet</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 340 }}>
        <Button variant="primary" full size="lg" onClick={() => navigate('/lobby')}>Play again</Button>
        {isWinner && <Button variant="success" full onClick={() => navigate('/wallet')}>Withdraw winnings</Button>}
        <Button variant="ghost" full onClick={() => navigate('/tournaments')}>Join a tournament</Button>
        <Button variant="outline" full onClick={() => navigate('/dashboard')}>Back to home</Button>
      </div>
    </div>
  )
}

// ─── TOURNAMENTS PAGE ──────────────────────────────────────
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { tournamentAPI } from '../services/api'
import { SectionHead, Button, Tag, Progress, Brand } from '../components/ui'

export function Tournaments() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cdSecs, setCdSecs] = useState(45 * 60 + 22)

  useEffect(() => {
    tournamentAPI.list().then(r => setTournaments(r.data.tournaments)).finally(() => setLoading(false))
    const iv = setInterval(() => setCdSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(iv)
  }, [])

  const pad = n => String(n).padStart(2,'0')
  const h = Math.floor(cdSecs / 3600), m = Math.floor((cdSecs % 3600) / 60), s = cdSecs % 60

  const join = async (id) => {
    try {
      await tournamentAPI.register(id)
      toast.success('Registered for tournament!')
      tournamentAPI.list().then(r => setTournaments(r.data.tournaments))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register')
    }
  }

  const featured = tournaments[0]

  return (
    <>
      <div className="topbar">
        <Brand />
        <Tag variant="red"><span style={{ width:6,height:6,borderRadius:'50%',background:'var(--red)',animation:'blink 1.4s ease infinite',display:'inline-block'}}/>3 live</Tag>
      </div>
      <div className="page">
        {featured && (
          <div style={{ padding: '16px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)', marginBottom: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Featured · Today only
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{featured.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 600, color: 'var(--amber)', marginBottom: 12 }}>
              ₦{((featured.prize_pool_kobo || 0) / 100).toLocaleString()}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted2)', marginBottom: 12 }}>
              <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>{featured.registered_count || 0}</span> players</span>
              <span>Entry ₦{((featured.entry_fee_kobo||0)/100).toLocaleString() || 'Free'}</span>
              <span><span style={{ color: 'var(--red)', fontWeight: 600 }}>{featured.max_players - (featured.registered_count || 0)}</span> spots left</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[{ n: pad(h), l: 'hr' }, { n: pad(m), l: 'min' }, { n: pad(s), l: 'sec' }].map(u => (
                <div key={u.l} style={{ background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 4, padding: '6px 12px', textAlign: 'center', minWidth: 52 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, color: 'var(--amber)', lineHeight: 1 }}>{u.n}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{u.l}</div>
                </div>
              ))}
            </div>
            <Progress value={featured.registered_count || 0} max={featured.max_players} />
            <div style={{ marginTop: 12 }}>
              <Button variant="primary" full size="lg" onClick={() => join(featured.id)}>
                {featured.user_registered ? 'Registered ✓' : `Join for ₦${((featured.entry_fee_kobo||0)/100).toLocaleString()}`}
              </Button>
            </div>
          </div>
        )}

        <div style={{ padding: '20px 20px 0' }}>
          <SectionHead title="All tournaments" />
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Loading...</div>
          ) : (
            tournaments.slice(1).map(t => (
              <div key={t.id} style={{ background: 'var(--surface)', border: `1px solid ${t.is_vip_only ? 'var(--blue-mid)' : 'var(--line)'}`, borderRadius: 'var(--r)', padding: 16, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.category} · {t.max_players} players</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: 'var(--amber)' }}>
                      ₦{((t.prize_pool_kobo||0)/100).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Prize pool</div>
                  </div>
                </div>
                <Progress value={t.registered_count || 0} max={t.max_players} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {t.registered_count || 0} / {t.max_players} · {t.entry_fee_kobo === 0 ? 'Free' : `₦${((t.entry_fee_kobo||0)/100).toLocaleString()}`}
                  </span>
                  {t.is_vip_only ? (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/vip')}>VIP only</Button>
                  ) : t.user_registered ? (
                    <Tag variant="green">Registered</Tag>
                  ) : (
                    <Button variant={t.entry_fee_kobo === 0 ? 'success' : 'primary'} size="sm" onClick={() => join(t.id)}>
                      {t.entry_fee_kobo === 0 ? 'Join free' : 'Join'}
                    </Button>
                  )}
                </div>
                {t.sponsor_name && <div style={{ fontSize: 10, color: 'var(--blue)', marginTop: 6 }}>Sponsored by {t.sponsor_name}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

// ─── LEADERBOARD PAGE ──────────────────────────────────────
export function Leaderboard() {
  const user = useAuthStore(s => s.user)
  const [lb, setLb] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [period, setPeriod] = useState('weekly')

  useEffect(() => {
    gameAPI.leaderboard({ period }).then(r => {
      setLb(r.data.leaderboard)
      setUserRank(r.data.userRank)
    })
  }, [period])

  return (
    <>
      <div className="topbar">
        <Brand />
        <Tag variant="muted">Week 24</Tag>
      </div>
      <div className="page">
        <div style={{ padding: '10px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Weekly rankings</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>Sponsored by PalmPay</div>
        </div>

        {/* PERIOD TABS */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', overflow: 'auto', scrollbarWidth: 'none' }}>
          {['weekly','monthly','alltime'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: period === p ? 'var(--blue)' : 'var(--surface2)', color: period === p ? '#fff' : 'var(--muted2)', border: `1px solid ${period === p ? 'var(--blue)' : 'var(--line)'}` }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {lb.map((player, i) => (
          <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--line)', background: player.id === user?.id ? 'var(--blue-dim)' : 'transparent' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, width: 28, color: i < 3 ? 'var(--amber)' : 'var(--muted)', textAlign: 'right' }}>{i + 1}</span>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-dim)', border: '1px solid var(--blue-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>
              {player.avatar_initials || player.username?.substring(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{player.username} {player.id === user?.id ? '(you)' : ''}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{player.total_wins} wins · {player.accuracy_pct}% accuracy</div>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--amber)', whiteSpace: 'nowrap' }}>
              ₦{((player.total_earned_kobo || 0) / 100).toLocaleString()}
            </div>
          </div>
        ))}

        {userRank && (
          <div style={{ padding: '16px 20px', textAlign: 'center', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>You are ranked <span style={{ color: 'var(--text)', fontWeight: 600 }}>#{userRank}</span></div>
            <Button variant="primary" size="sm" onClick={() => navigate('/lobby')}>Play to climb</Button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── VIP PAGE ──────────────────────────────────────────────
import { vipAPI } from '../services/api'
export function Vip() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const [plan, setPlan] = useState('monthly')
  const [loading, setLoading] = useState(false)

  const PLANS = {
    weekly:  { name: 'VIP Weekly',  price: 500,   coins: 50,   days: 7   },
    monthly: { name: 'VIP Gold',    price: 1500,  coins: 200,  days: 30  },
    annual:  { name: 'VIP Annual',  price: 12000, coins: 2400, days: 365 },
  }
  const selected = PLANS[plan]

  const subscribe = async () => {
    setLoading(true)
    try {
      await vipAPI.subscribe(plan)
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
      <div className="page">
        <div style={{ padding: '28px 20px', borderBottom: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
            Unlock more.<br />Win more.
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>VIP members earn more from every match</div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
          {Object.keys(PLANS).map(p => (
            <button key={p} onClick={() => setPlan(p)} style={{ flex: 1, height: 44, borderBottom: `2px solid ${plan === p ? 'var(--blue)' : 'transparent'}`, color: plan === p ? 'var(--blue)' : 'var(--muted)', fontWeight: 700, fontSize: 13, textTransform: 'capitalize', background: 'none', cursor: 'pointer' }}>
              {p}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ background: 'var(--blue-dim)', border: '2px solid var(--blue-mid)', borderRadius: 'var(--r)', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Recommended</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{selected.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 600, color: 'var(--amber)' }}>₦{selected.price.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>/{plan === 'weekly' ? 'week' : plan === 'monthly' ? 'month' : 'year'}</span>
            </div>
            {[
              'Unlimited games per day',
              'Zero ads during gameplay',
              'Priority matchmaking',
              'All 15+ categories unlocked',
              '+10% bonus on every win',
              'VIP-only tournaments (₦1M prize)',
              `${selected.coins} free coins included`,
              'Animated profile frame',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--green)' }}>✓</span> {f}
              </div>
            ))}
          </div>
          <Button variant="primary" full size="lg" loading={loading} onClick={subscribe}>
            Start {selected.name} — ₦{selected.price.toLocaleString()}/{plan === 'weekly' ? 'wk' : plan === 'monthly' ? 'mo' : 'yr'}
          </Button>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Cancel anytime. No hidden charges.</div>
        </div>

        {/* COMPARISON TABLE */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden', margin: '0 20px 20px' }}>
          {[
            { f: 'Feature',          free: 'Free',        vip: 'VIP', header: true },
            { f: 'Daily games',      free: '5',           vip: 'Unlimited' },
            { f: 'Ads',              free: 'Yes',         vip: 'None',        vc: 'var(--green)', fc: 'var(--red)' },
            { f: 'Categories',       free: '6',           vip: '15+' },
            { f: 'Win bonus',        free: '—',           vip: '+10%',        vc: 'var(--green)' },
            { f: 'VIP tournaments',  free: 'No',          vip: 'Yes',         vc: 'var(--green)', fc: 'var(--red)' },
            { f: 'Monthly coins',    free: '—',           vip: `${selected.coins}`, vc: 'var(--amber)' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '10px 14px', borderBottom: i < 6 ? '1px solid var(--line)' : 'none', fontSize: row.header ? 11 : 12, fontWeight: row.header ? 700 : 400, background: row.header ? 'var(--surface2)' : 'transparent', textTransform: row.header ? 'uppercase' : 'none', letterSpacing: row.header ? '0.04em' : 0, color: row.header ? 'var(--muted2)' : 'var(--text)', alignItems: 'center' }}>
              <div style={{ color: row.header ? 'var(--muted2)' : 'var(--muted)' }}>{row.f}</div>
              <div style={{ textAlign: 'center', color: row.fc || (row.header ? 'var(--muted2)' : 'var(--muted)') }}>{row.free}</div>
              <div style={{ textAlign: 'center', color: row.vc || (row.header ? 'var(--blue)' : 'var(--text)'), fontWeight: row.header ? 700 : 600 }}>{row.vip}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── WALLET PAGE ───────────────────────────────────────────
import { walletAPI } from '../services/api'
export function Wallet() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const updateBalance = useAuthStore(s => s.updateUser)
  const [tab, setTab] = useState('deposit')
  const [transactions, setTransactions] = useState([])
  const [depAmt, setDepAmt] = useState(5000)
  const [loading, setLoading] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', accountNumber: '', bankName: '' })

  useEffect(() => {
    walletAPI.transactions({ limit: 20 }).then(r => setTransactions(r.data.transactions)).catch(() => {})
  }, [])

  const initDeposit = async () => {
    setLoading(true)
    try {
      const { data } = await walletAPI.initDeposit(depAmt)
      window.location.href = data.authorization_url
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  const doWithdraw = async () => {
    const { amount, accountNumber, bankName } = withdrawForm
    if (!amount || amount < 1000) { toast.error('Minimum withdrawal is ₦1,000'); return }
    setLoading(true)
    try {
      await walletAPI.withdraw({ amount: Number(amount), bankCode: '058', accountNumber, accountName: bankName })
      toast.success('Withdrawal request submitted')
      setWithdrawForm({ amount: '', accountNumber: '', bankName: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  const AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000]
  const balance = (user?.balance || 0) / 100

  return (
    <>
      <div className="topbar">
        <div className="flex gap-8">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Wallet</div>
        </div>
      </div>
      <div className="page">
        <div style={{ padding: 20, background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
          <div className="amount-label">Available balance</div>
          <div className="amount-display">₦{balance.toLocaleString()}</div>
          <div className="grid2" style={{ marginTop: 14 }}>
            <Button variant="primary" full onClick={() => setTab('deposit')}>Deposit</Button>
            <Button variant="outline" full onClick={() => setTab('withdraw')}>Withdraw</Button>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
          {['deposit','withdraw','history'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, height: 44, borderBottom: `2px solid ${tab === t ? 'var(--blue)' : 'transparent'}`, color: tab === t ? 'var(--blue)' : 'var(--muted)', fontWeight: 700, fontSize: 13, textTransform: 'capitalize', background: 'none', cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'deposit' && (
          <div style={{ padding: 20 }}>
            <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green-mid)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 3 }}>Deposit bonus active</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>Deposit ₦5,000+ and get 10% bonus cash + 50 coins instantly.</div>
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Choose amount</div>
            <div className="grid3" style={{ marginBottom: 16 }}>
              {AMOUNTS.map(a => (
                <div key={a} onClick={() => setDepAmt(a)} style={{ background: depAmt === a ? 'var(--blue-dim)' : 'var(--surface)', border: `1px solid ${depAmt === a ? 'var(--blue-mid)' : 'var(--line)'}`, borderRadius: 'var(--r)', padding: '12px 8px', textAlign: 'center', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: depAmt === a ? 'var(--amber)' : 'var(--text)' }}>
                  ₦{a.toLocaleString()}
                  {a >= 5000 && <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, marginTop: 2 }}>+₦{(a*0.1).toLocaleString()}</div>}
                </div>
              ))}
            </div>
            <Button variant="primary" full size="lg" loading={loading} onClick={initDeposit}>
              Deposit ₦{depAmt.toLocaleString()} via Paystack
            </Button>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>256-bit TLS encryption</div>
          </div>
        )}

        {tab === 'withdraw' && (
          <div style={{ padding: 20 }}>
            <Input label="Amount (₦)" type="number" placeholder="Minimum ₦1,000" value={withdrawForm.amount} onChange={e => setWithdrawForm(p => ({...p, amount: e.target.value}))} hint="Processed within 24 hours" />
            <Input label="Account number" type="text" placeholder="10-digit account number" value={withdrawForm.accountNumber} onChange={e => setWithdrawForm(p => ({...p, accountNumber: e.target.value}))} />
            <Input label="Bank name" type="text" placeholder="GTBank / Access / Zenith / UBA" value={withdrawForm.bankName} onChange={e => setWithdrawForm(p => ({...p, bankName: e.target.value}))} hint="KYC required for amounts above ₦50,000" />
            <Button variant="primary" full size="lg" loading={loading} onClick={doWithdraw}>
              Request withdrawal
            </Button>
          </div>
        )}

        {tab === 'history' && (
          <div style={{ padding: '0 20px' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No transactions yet</div>
            ) : transactions.map(tx => (
              <TxRow key={tx.id} type={tx.type} name={tx.description} date={new Date(tx.created_at).toLocaleDateString()} amount={tx.amount} currency={tx.currency} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── REFERRAL PAGE ─────────────────────────────────────────
import { referralAPI } from '../services/api'
export function Referral() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
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
        <div className="flex gap-8">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Refer friends</div>
        </div>
      </div>
      <div className="page">
        <div style={{ padding: 20, background: 'var(--surface)', borderBottom: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>You earn per successful referral</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 42, fontWeight: 800, color: 'var(--amber)' }}>100 coins</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 8 }}>Your friend earns 50 coins when they sign up with your code. No cash bonuses — coins are free to issue and valuable to earn.</div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ background: 'var(--surface2)', border: '1px dashed var(--line2)', borderRadius: 'var(--r)', padding: 18, textAlign: 'center', cursor: 'pointer', marginBottom: 14 }} onClick={copy}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Your referral code</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, color: 'var(--amber)', letterSpacing: 4, marginBottom: 4 }}>{user?.referralCode || '...'}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Tap to copy</div>
          </div>

          <div className="grid2" style={{ marginBottom: 16 }}>
            <Button variant="primary" full onClick={() => { navigator.clipboard?.writeText(`Join me on QuizArena! Use code ${user?.referralCode} for 50 bonus coins.`); toast.success('Link copied!') }}>Share link</Button>
            <Button variant="ghost" full onClick={copy}>Copy code</Button>
          </div>

          <div style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue-mid)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginBottom: 3 }}>Why coins, not cash?</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5 }}>Cash bonuses cost the platform real money upfront. Coins cost nothing to issue but are genuinely valuable — use them for power-ups that help you win more cash.</div>
          </div>

          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>How it works</div>
          {[
            { n: 1, t: 'Share your code', d: 'Send your link or code to friends via WhatsApp, Instagram or SMS' },
            { n: 2, t: 'Friend signs up', d: 'They create a QuizArena account using your referral code' },
            { n: 3, t: 'Friend deposits', d: 'They get 50 bonus coins. You get 100 coins instantly.' },
            { n: 4, t: 'No limit on referrals', d: 'Refer 100 friends = 10,000 coins. Use coins to win more cash.' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: step.n === 4 ? 'var(--green)' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, color: step.n === 4 ? '#000' : '#fff' }}>{step.n}</div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Total referred</span><span style={{ fontFamily: 'var(--mono)', color: 'var(--amber)' }}>{completed} friends</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>Coins earned</span><span style={{ fontFamily: 'var(--mono)', color: 'var(--amber)' }}>{totalCoins} coins</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>Pending</span><span style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{pending} pending</span></div>
          </div>
          {referrals.map(r => (
            <TxRow key={r.id} type={r.status === 'completed' ? 'referral_coin' : 'deposit'} name={`${r.referred_username} ${r.status === 'completed' ? 'joined & deposited' : 'signed up (awaiting deposit)'}`} date={new Date(r.created_at).toLocaleDateString()} amount={r.coins_awarded || 0} currency="COINS" />
          ))}
        </div>
      </div>
    </>
  )
}

// ─── COINS PAGE ────────────────────────────────────────────
export function Coins() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)
  const [loading, setLoading] = useState(false)

  const PACKS = [
    { coins: 100,  price: 200  },
    { coins: 300,  price: 500,  hot: true },
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
        <div className="flex gap-8">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Coins</div>
        </div>
      </div>
      <div className="page">
        <div style={{ padding: '20px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)', textAlign: 'center' }}>
          <div className="amount-label">Your balance</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 42, fontWeight: 800, color: 'var(--amber)' }}>◈ {user?.coins || 0}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Use coins for power-ups, cosmetics and features</div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Buy coins</div>
          <div className="grid2">
            {PACKS.map(p => (
              <div key={p.coins} onClick={() => buy(p.coins)} style={{ background: p.hot ? 'var(--blue-dim)' : 'var(--surface)', border: `2px solid ${p.hot ? 'var(--blue-mid)' : 'var(--line)'}`, borderRadius: 'var(--r)', padding: 16, textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{'◈'.repeat(Math.min(4, Math.ceil(p.coins/500)))}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.coins} coins</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>₦{p.price.toLocaleString()}</div>
                {p.hot  && <div style={{ marginTop: 6 }}><Tag variant="blue">Popular</Tag></div>}
                {p.best && <div style={{ marginTop: 6 }}><Tag variant="amber">Best value</Tag></div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>What coins unlock</div>
          {[
            { icon: '⏱', title: 'Extra time',     cost: '10 coins — +5 seconds on your timer'   },
            { icon: '⊘', title: '50 / 50',         cost: '20 coins — remove 2 wrong answers'     },
            { icon: '↷', title: 'Skip question',   cost: '15 coins — skip without penalty'       },
            { icon: '◈', title: 'Score shield',    cost: '30 coins — protect your score'         },
            { icon: '▣', title: 'Profile frame',   cost: '100–500 coins — cosmetic upgrade'      },
            { icon: '⊡', title: 'Username colour', cost: '200 coins — stand out on leaderboard'  },
          ].map(u => (
            <div key={u.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 16, width: 32, textAlign: 'center', flexShrink: 0 }}>{u.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{u.title}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)' }}>{u.cost}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue-mid)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginBottom: 4 }}>Earn free coins</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 10 }}>Refer a friend who deposits and earn 100 coins automatically.</div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/referral')}>Refer friends →</Button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── PRACTICE PAGE ─────────────────────────────────────────
export function Practice() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const user       = useAuthStore(s => s.user)

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
        <div className="flex gap-8">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Practice</div>
        </div>
      </div>
      <div className="page">
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
              <div key={c.name} onClick={() => navigate(`/game/practice-${Date.now()}`, { state: { category: c.name, stakeNaira: 0, playerCount: 1 } })} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color .15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
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

// ─── LANDING PAGE ──────────────────────────────────────────
export function Landing() {
  const navigate = useNavigate()
  const [prize, setPrize] = useState(2847500)
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
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <Brand />
        <div className="flex gap-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log in</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Sign up</Button>
        </div>
      </div>

      <div style={{ padding: '48px 20px 40px', borderBottom: '1px solid var(--line)' }}>
        <Tag variant="blue" style={{ marginBottom: 16, display: 'inline-flex' }}><span className="live-dot" />Live now</Tag>
        <h1 style={{ marginBottom: 14 }}>Answer questions.<br />Win real money.</h1>
        <p style={{ fontSize: 15, color: 'var(--muted2)', lineHeight: 1.65, marginBottom: 28, maxWidth: 300 }}>
          Nigeria's most trusted real-money quiz platform. Compete in 1v1 duels, group battles and tournaments.
        </p>
        <div className="flex gap-10">
          <Button variant="primary" size="lg" onClick={() => navigate('/register')}>Get started</Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/login')}>Log in</Button>
        </div>
      </div>

      <div style={{ padding: '24px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <div className="amount-label">Total prize pool · live</div>
        <div className="amount-display">₦{prize.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Across <span style={{ color: 'var(--text)', fontWeight: 600 }}>1,043</span> active matches and <span style={{ color: 'var(--text)', fontWeight: 600 }}>{players.toLocaleString()}</span> players online
        </div>
      </div>

      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Game modes</div>
        <div className="grid2">
          {[
            { icon: '⚔', name: '1 vs 1',     desc: 'Head-to-head against one opponent' },
            { icon: '⊞', name: 'Group',       desc: '10 · 20 · 30 · 50 players compete' },
            { icon: '◉', name: 'Tournament',  desc: 'Bracket elimination, one winner'   },
            { icon: '◎', name: 'Practice',    desc: 'Sharpen skills, no entry fee'       },
          ].map(m => (
            <div key={m.name} onClick={() => navigate('/register')} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 16, cursor: 'pointer', transition: 'border-color .15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--blue-dim)', border: '1px solid var(--blue-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 10 }}>{m.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '32px 20px', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
        <Button variant="primary" size="lg" onClick={() => navigate('/register')} style={{ width: '100%', maxWidth: 320 }}>
          Create your account
        </Button>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>No cash bonuses. No hidden fees. Fair play guaranteed.</div>
      </div>
    </div>
  )
}

// ─── NOT FOUND PAGE ────────────────────────────────────────
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

// ─── RE-EXPORTS ────────────────────────────────────────────
export { Results as default }

// Fix imports that need to be at top — these are inline for consolidation
// In the actual project each of these would be a separate file
import { gameAPI } from '../services/api'
import { Input, TxRow } from '../components/ui'
