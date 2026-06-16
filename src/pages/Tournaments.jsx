import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { tournamentAPI, gameAPI } from '../services/api'
import { Brand, Tag, Button, Progress, SectionHead } from '../components/ui'
import DepositModal from '../components/game/DepositModal'

export default function Tournaments() {
  const navigate = useNavigate()
  const [tournaments,  setTournaments]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [joining,      setJoining]      = useState(null)
  const [showDeposit,  setShowDeposit]  = useState(false)
  const [cdSecs,       setCdSecs]       = useState(45 * 60 + 22)

  useEffect(() => {
    load()
    const iv = setInterval(() => setCdSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(iv)
  }, [])

  const load = () => {
    tournamentAPI.list()
      .then(r => setTournaments(r.data.tournaments))
      .catch(() => toast.error('Failed to load tournaments'))
      .finally(() => setLoading(false))
  }

  const pad = n => String(n).padStart(2, '0')
  const h = Math.floor(cdSecs / 3600)
  const m = Math.floor((cdSecs % 3600) / 60)
  const s = cdSecs % 60

  // Register for tournament then find a match
  const joinTournament = async (tournament) => {
    if (joining) return
    setJoining(tournament.id)
    try {
      // Step 1: Register (deducts entry fee)
      if (!tournament.user_registered) {
        await tournamentAPI.register(tournament.id)
        toast.success('Registered! Finding your match...')
      }

      // Step 2: Find a match in this tournament category
      const stakeNaira = (tournament.entry_fee_kobo || 0) / 100
      const { data } = await gameAPI.findMatch({
        category:    tournament.category,
        stakeNaira:  stakeNaira > 0 ? stakeNaira : 100,
        playerCount: 2,
        gameType:    'quiz',
      })

      toast.success('Match found!')
      navigate(`/game/${data.roomId}`, {
        state: {
          stakeNaira:    stakeNaira > 0 ? stakeNaira : 100,
          category:      tournament.category,
          playerCount:   2,
          tournamentId:  tournament.id,
          tournamentName: tournament.name,
        }
      })
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to join'
      if (msg.includes('balance') || msg.includes('Insufficient')) {
        toast.error('Insufficient balance')
        setShowDeposit(true)
      } else {
        toast.error(msg)
      }
    } finally {
      setJoining(null)
      load()
    }
  }

  const featured = tournaments[0]
  const rest     = tournaments.slice(1)

  return (
    <>
      <div className="topbar">
        <Brand />
        <Tag variant="red">
          <span className="live-dot" /> Live
        </Tag>
      </div>

      <div style={{ paddingBottom: 80 }}>

        {/* FEATURED TOURNAMENT */}
        {featured && (
          <div style={{ padding: '20px 20px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--line2)' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--indigo-lt)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Featured · Today only
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              {featured.name}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--gold)', textShadow: '0 0 20px var(--gold-glow)', marginBottom: 14 }}>
              ₦{((featured.prize_pool_kobo || 0) / 100).toLocaleString()}
            </div>

            <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
              <span><span style={{ color: 'var(--text)', fontWeight: 700 }}>{featured.registered_count || 0}</span> players</span>
              <span>Entry: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{featured.entry_fee_kobo === 0 ? 'Free' : `₦${((featured.entry_fee_kobo||0)/100).toLocaleString()}`}</span></span>
              <span><span style={{ color: 'var(--red)', fontWeight: 700 }}>{Math.max(0, featured.max_players - (featured.registered_count||0))}</span> spots left</span>
            </div>

            {/* COUNTDOWN */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[{ n: pad(h), l: 'HR' }, { n: pad(m), l: 'MIN' }, { n: pad(s), l: 'SEC' }].map(u => (
                <div key={u.l} style={{ background: 'var(--surface2)', border: '1px solid var(--line2)', borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>{u.n}</div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{u.l}</div>
                </div>
              ))}
            </div>

            <Progress value={featured.registered_count || 0} max={featured.max_players} />

            <div style={{ marginTop: 14 }}>
              <Button
                variant="primary" full size="lg"
                loading={joining === featured.id}
                onClick={() => joinTournament(featured)}
              >
                {featured.user_registered
                  ? '▶ Play your match now'
                  : `Join for ${featured.entry_fee_kobo === 0 ? 'Free' : '₦' + ((featured.entry_fee_kobo||0)/100).toLocaleString()}`
                }
              </Button>
              {featured.user_registered && (
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--teal)', marginTop: 8 }}>
                  ✓ You're registered — click to find your match
                </div>
              )}
            </div>
          </div>
        )}

        {/* HOW TOURNAMENTS WORK */}
        <div style={{ padding: '16px 20px', background: 'var(--indigo-dim)', borderBottom: '1px solid var(--indigo-mid)' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'var(--indigo-lt)', marginBottom: 6 }}>
            How tournaments work
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
            Pay the entry fee → get matched with another player → win to advance → last player standing wins the prize pool.
          </div>
        </div>

        {/* REST OF TOURNAMENTS */}
        <div style={{ padding: '20px 20px 0' }}>
          <SectionHead title="All tournaments" />

          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Loading...
            </div>
          ) : rest.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No more tournaments right now</div>
          ) : (
            rest.map(t => (
              <div
                key={t.id}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${t.is_vip_only ? 'var(--indigo-mid)' : 'var(--line2)'}`,
                  borderRadius: 14, padding: 16, marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{t.category} · max {t.max_players} players</div>
                    {t.sponsor_name && <div style={{ fontSize: 10, color: 'var(--indigo-lt)', marginTop: 3 }}>Sponsored by {t.sponsor_name}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>
                      ₦{((t.prize_pool_kobo||0)/100).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Prize pool</div>
                  </div>
                </div>

                <Progress value={t.registered_count || 0} max={t.max_players} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted2)' }}>
                    {t.registered_count || 0} / {t.max_players} · {t.entry_fee_kobo === 0 ? 'Free entry' : `₦${((t.entry_fee_kobo||0)/100).toLocaleString()} entry`}
                  </span>

                  {t.is_vip_only ? (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/vip')}>VIP only</Button>
                  ) : (
                    <Button
                      variant={t.entry_fee_kobo === 0 ? 'teal' : 'primary'}
                      size="sm"
                      loading={joining === t.id}
                      onClick={() => joinTournament(t)}
                    >
                      {t.user_registered ? '▶ Play match' : t.entry_fee_kobo === 0 ? 'Join free' : 'Join'}
                    </Button>
                  )}
                </div>

                {t.user_registered && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--teal)' }}>
                    ✓ Registered — click Play match to start
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </>
  )
}
