// ── Button ────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = '', full = false, loading = false, className = '', ...props }) {
  const cls = `btn btn-${variant}${size ? ' btn-' + size : ''}${full ? ' btn-full' : ''} ${className}`
  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : children}
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

// ── Card ──────────────────────────────────────────────────
export function Card({ children, variant = '', className = '', style, onClick }) {
  return (
    <div
      className={`card${variant ? ' card-' + variant : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ── Tag ───────────────────────────────────────────────────
export function Tag({ children, variant = 'blue' }) {
  return <span className={`tag tag-${variant}`}>{children}</span>
}

// ── Alert ─────────────────────────────────────────────────
export function Alert({ children, variant = 'blue', title }) {
  return (
    <div className={`alert alert-${variant}`}>
      {title && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{title}</div>}
      <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5 }}>{children}</div>
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

// ── Amount Display ────────────────────────────────────────
export function AmountDisplay({ label, amount, size = 36 }) {
  const formatted = typeof amount === 'number'
    ? '₦' + (amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })
    : amount
  return (
    <div>
      {label && <div className="amount-label">{label}</div>}
      <div className="amount-display" style={{ fontSize: size }}>{formatted}</div>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────
export function SectionHead({ title, action, onAction }) {
  return (
    <div className="sec-head">
      <span className="sec-title">{title}</span>
      {action && <span className="sec-link" onClick={onAction}>{action}</span>}
    </div>
  )
}

// ── Topbar ────────────────────────────────────────────────
export function Topbar({ left, right, title }) {
  return (
    <div className="topbar">
      <div>{left}</div>
      {title && <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700 }}>{title}</div>}
      <div>{right}</div>
    </div>
  )
}

// ── Brand ─────────────────────────────────────────────────
export function Brand({ size = 18 }) {
  return (
    <span className="topbar-brand" style={{ fontSize: size }}>
      Quiz<em>Arena</em>
    </span>
  )
}

// ── Wallet Chip ───────────────────────────────────────────
export function WalletChip({ balance, onClick }) {
  const formatted = typeof balance === 'number'
    ? '₦' + (balance / 100).toLocaleString()
    : '₦—'
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--surface2)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-sm)', padding: '6px 12px', cursor: 'pointer',
      }}
    >
      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--amber)' }}>
        {formatted}
      </span>
    </div>
  )
}

// ── Loading ───────────────────────────────────────────────
export function Loading({ text = 'Loading...' }) {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{text}</span>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────
export function Empty({ icon, title, body, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      {icon && <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>}
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {body && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{body}</div>}
      {action}
    </div>
  )
}

// ── Transaction Row ───────────────────────────────────────
export function TxRow({ type, name, date, amount, currency = 'NGN' }) {
  const icons = { win: '↑', loss: '↓', deposit: '↓', withdrawal: '↑', cashback: '↺', coin_purchase: '◈', referral_coin: '↗', vip: '◈' }
  const colors = { win: 'var(--green)', loss: 'var(--red)', deposit: 'var(--blue)', withdrawal: 'var(--muted)', cashback: 'var(--green)', coin_purchase: 'var(--amber)', referral_coin: 'var(--green)', vip: 'var(--purple)' }
  const dimBg  = { win: 'var(--green-dim)', loss: 'var(--red-dim)', deposit: 'var(--blue-dim)', withdrawal: 'var(--surface2)', cashback: 'var(--green-dim)', coin_purchase: 'var(--amber-dim)', referral_coin: 'var(--green-dim)', vip: 'var(--purple-dim)' }
  const positive = ['win','deposit','cashback','referral_coin'].includes(type)
  const amtFormatted = currency === 'COINS'
    ? `${positive ? '+' : '−'}${Math.abs(amount)} coins`
    : `${positive ? '+' : '−'}₦${(Math.abs(amount)/100).toLocaleString()}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: dimBg[type] || 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: colors[type] || 'var(--muted)', flexShrink: 0 }}>
        {icons[type] || '·'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{date}</div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: positive ? (currency === 'COINS' ? 'var(--amber)' : 'var(--green)') : 'var(--red)', whiteSpace: 'nowrap' }}>
        {amtFormatted}
      </div>
    </div>
  )
}

// ── Progress ──────────────────────────────────────────────
export function Progress({ value, max, color = 'var(--blue)' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-fill" style={{ width: pct + '%', background: color }} />
    </div>
  )
}
