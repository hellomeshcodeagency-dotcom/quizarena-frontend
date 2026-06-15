import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { tournamentAPI } from '../services/api'
import { Brand, Tag, Button, Progress, SectionHead } from '../components/ui'

export default function Tournaments() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [cdSecs,      setCdSecs]      = useState(45 * 60 + 22)

  useEffect(() => {
    tournamentAPI.list()
      .then(r => setTournaments(r.data.tournaments))
      .catch(() => toast.error('Failed to load tournaments'))
      .finally(() => setLoading(false))

    const iv = setInterval(() => setCdSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(iv)
  }, [])

  const pad = n => String(n).padStart(2, '0')
  const h = Math.floor(cdSecs / 3600)
  const m = Math.floor((cdSecs % 3600) / 60)
  const s = cdSecs % 60

  const join = async (id, entryFeeKobo) => {
    try {
      await tournamentAPI.register(id)
      toast.success('Registered!')
      tournamentAPI.list().then(r => setTournaments(r.data.tournaments))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register')
    }
  }

  const featured = tournaments[0]
  const rest     = tournaments.slice(1)

  return (
    <>
      <div className="topbar">
        <Brand />
        <Tag variant="red">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'blink 1.4s ease infinite', display: 'inline-block' }} />
          {' '}Live
        </Tag>
      </div>

      <div style={{ paddingBottom: 80 }}>
        {/* FEATURED */}
        {featured && (
          <div style={{ padding: '16px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Featured · Today only
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              {featured.name}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 600, color: 'var(--amber)', marginBottom: 12 }}>
              ₦{((featured.prize_pool_kobo || 0) / 100).toLocaleString()}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted2)', marginBottom: 12 }}>
              <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>{featured.registered_count || 0}</span> players</span>
              <span>Entry {featured.entry_fee_kobo === 0 ? 'Free' : `₦${((featured.entry_fee_kobo || 0) / 100).toLocaleString()}`}</span>
              <span><span style={{ color: 'var(--red)', fontWeight: 600 }}>{featured.max_players - (featured.registered_count || 0)}</span> spots left</span>
            </div>

            {/* COUNTDOWN */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[{ n: pad(h), l: 'hr' }, { n: pad(m), l: 'min' }, { n: pad(s), l: 'sec' }].map(u => (
                <div key={u.l} style={{ background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 4, padding: '6px 12px', textAlign: 'center', minWidth: 52 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, color: 'var(--amber)', lineHeight: 1 }}>{u.n}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{u.l}</div>
                </div>
              ))}
            </div>

            <Progress value={featured.registered_count || 0} max={featured.max_players} />

            <div style={{ marginTop: 14 }}>
              {featured.user_registered ? (
                <Button variant="ghost" full size="lg" disabled>Registered ✓</Button>
              ) : (
                <Button variant="primary" full size="lg" onClick={() => join(featured.id, featured.entry_fee_kobo)}>
                  {featured.entry_fee_kobo === 0 ? 'Join free' : `Join for ₦${((featured.entry_fee_kobo || 0) / 100).toLocaleString()}`}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* REST */}
        <div style={{ padding: '20px 20px 0' }}>
          <SectionHead title="All tournaments" />

          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Loading...</div>
          ) : rest.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No more tournaments right now</div>
          ) : (
            rest.map(t => (
              <div key={t.id} style={{
                background: 'var(--surface)',
                border: `1px solid ${t.is_vip_only ? 'var(--blue-mid)' : 'var(--line)'}`,
                borderRadius: 'var(--r)', padding: 16, marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.category} · {t.max_players} players max</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: 'var(--amber)' }}>
                      ₦{((t.prize_pool_kobo || 0) / 100).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Prize pool</div>
                  </div>
                </div>

                <Progress value={t.registered_count || 0} max={t.max_players} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {t.registered_count || 0} / {t.max_players} · {t.entry_fee_kobo === 0 ? 'Free entry' : `₦${((t.entry_fee_kobo || 0) / 100).toLocaleString()}`}
                  </span>
                  {t.is_vip_only ? (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/vip')}>VIP only</Button>
                  ) : t.user_registered ? (
                    <Tag variant="green">Registered</Tag>
                  ) : (
                    <Button
                      variant={t.entry_fee_kobo === 0 ? 'success' : 'primary'}
                      size="sm"
                      onClick={() => join(t.id, t.entry_fee_kobo)}
                    >
                      {t.entry_fee_kobo === 0 ? 'Join free' : 'Join'}
                    </Button>
                  )}
                </div>

                {t.sponsor_name && (
                  <div style={{ fontSize: 10, color: 'var(--blue)', marginTop: 6 }}>
                    Sponsored by {t.sponsor_name}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
