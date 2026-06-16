import { useRef } from 'react'

// ── Button with ripple ────────────────────────────────────
export function Button({ children, variant = 'primary', size = '', full = false, loading = false, className = '', style, onClick, ...props }) {
  const ref = useRef(null)

  const handleClick = (e) => {
    // Ripple
    const btn = ref.current
    if (btn) {
      const circle = document.createElement('span')
      const d = Math.max(btn.clientWidth, btn.clientHeight)
      const rect = btn.getBoundingClientRect()
      circle.style.cssText = `
        position:absolute; width:${d}px; height:${d}px; border-radius:50%;
        background:rgba(255,255,255,0.15); pointer-events:none;
        left:${e.clientX - rect.left - d/2}px; top:${e.clientY - rect.top - d/2}px;
        animation:ripple 0.5s ease-out forwards; transform:scale(0);
      `
      btn.appendChild(circle)
      setTimeout(() => circle.remove(), 600)
    }
    onClick?.(e)
  }

  const cls = `btn btn-${variant}${size ? ' btn-' + size : ''}${full ? ' btn-full' : ''} ${className}`
  return (
    <button ref={ref} className={cls} style={style} disabled={loading || props.disabled} onClick={handleClick} {...props}>
      {loading ? <span className="spinner" style={{ width: 18, height: 18, borderTopColor: '#fff' }} /> : children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────
export function Input({ label, hint, error, className = '', ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input${error ? ' error' : ''} ${className}`} {...props} />
      {hint  && !error && <div className="form-hint">{hint}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}

// ── Brand ─────────────────────────────────────────────────
export function Brand({ size = 20 }) {
  return (
    <span className="topbar-brand" style={{ fontSize: size }}>
      Quiz<em>Arena</em>
    </span>
  )
}

// ── Wallet Chip ───────────────────────────────────────────
export function WalletChip({ balance, onClick }) {
  const formatted = typeof balance === 'number' ? '₦' + (balance / 100).toLocaleString() : '₦—'
  return (
    <div className="wallet-chip" onClick={onClick}>
      <span style={{ fontSize: 12, color: 'var(--muted2)' }}>BAL</span>
      <span className="wallet-chip-amount">{formatted}</span>
    </div>
  )
}

// ── Section Head ──────────────────────────────────────────
export function SectionHead({ title, action, onAction }) {
  return (
    <div className="sec-head">
      <span className="sec-title">{title}</span>
      {action && <span className="sec-link" onClick={onAction}>{action} →</span>}
    </div>
  )
}

// ── Stat Chip ─────────────────────────────────────────────
export function StatChip({ label, value, color }) {
  return (
    <div className="stat-chip">
      <div className="stat-value" style={{ color: color || 'var(--text)' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

// ── Tag ───────────────────────────────────────────────────
export function Tag({ children, variant = 'indigo' }) {
  return <span className={`tag tag-${variant}`}>{children}</span>
}

// ── Alert ─────────────────────────────────────────────────
export function Alert({ children, variant = 'indigo', title }) {
  const colors = { indigo: 'var(--indigo-lt)', teal: 'var(--teal)', red: 'var(--red)', gold: 'var(--gold)' }
  return (
    <div className={`alert alert-${variant}`}>
      {title && <div style={{ fontSize: 13, fontFamily: 'var(--display)', fontWeight: 700, color: colors[variant], marginBottom: 5 }}>{title}</div>}
      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

// ── Amount Display ────────────────────────────────────────
export function AmountDisplay({ label, amount, size = 38 }) {
  const formatted = typeof amount === 'number'
    ? '₦' + (amount / 100).toLocaleString('en-NG')
    : amount
  return (
    <div>
      {label && <div className="amount-label">{label}</div>}
      <div className="amount-display" style={{ fontSize: size }}>{formatted}</div>
    </div>
  )
}

// ── Progress ──────────────────────────────────────────────
export function Progress({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="progress-wrap">
      <div className="progress-fill" style={{ width: pct + '%', background: color }} />
    </div>
  )
}

// ── Loading ───────────────────────────────────────────────
export function Loading({ text = 'Loading...' }) {
  return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--display)' }}>{text}</span>
    </div>
  )
}

// ── Empty ─────────────────────────────────────────────────
export function Empty({ icon, title, body, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      {icon && <div style={{ fontSize: 44, marginBottom: 14, filter: 'grayscale(0.3)' }}>{icon}</div>}
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {body && <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 20, lineHeight: 1.6 }}>{body}</div>}
      {action}
    </div>
  )
}

// ── TxRow ─────────────────────────────────────────────────
export function TxRow({ type, name, date, amount, currency = 'NGN' }) {
  const icons = { win: '↑', loss: '↓', deposit: '↓', withdrawal: '↑', cashback: '↺', coin_purchase: '◈', referral_coin: '↗', vip: '★' }
  const colors = { win: 'var(--teal)', loss: 'var(--red)', deposit: 'var(--indigo-lt)', withdrawal: 'var(--muted2)', cashback: 'var(--teal)', coin_purchase: 'var(--gold)', referral_coin: 'var(--teal)', vip: 'var(--purple)' }
  const bgs    = { win: 'var(--teal-dim)', loss: 'var(--red-dim)', deposit: 'var(--indigo-dim)', withdrawal: 'var(--surface2)', cashback: 'var(--teal-dim)', coin_purchase: 'var(--gold-dim)', referral_coin: 'var(--teal-dim)', vip: 'var(--purple-dim)' }
  const positive = ['win','deposit','cashback','referral_coin'].includes(type)
  const amtStr = currency === 'COINS'
    ? `${positive ? '+' : '−'}${Math.abs(amount)} coins`
    : `${positive ? '+' : '−'}₦${(Math.abs(amount)/100).toLocaleString()}`

  return (
    <div className="tx-row">
      <div className="tx-icon" style={{ background: bgs[type] || 'var(--surface2)', border: `1px solid ${colors[type]}22`, color: colors[type] || 'var(--muted2)' }}>
        {icons[type] || '·'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{date}</div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: positive ? (currency === 'COINS' ? 'var(--gold)' : 'var(--teal)') : 'var(--red)', whiteSpace: 'nowrap' }}>
        {amtStr}
      </div>
    </div>
  )
}
