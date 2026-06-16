const DIFFICULTIES = [
  { key: 'easy',   label: 'Easy',   emoji: '😊', color: 'var(--teal)',  desc: 'More time · simpler challenges · perfect for beginners' },
  { key: 'medium', label: 'Medium', emoji: '🤔', color: 'var(--gold)',  desc: 'Standard time · balanced challenge' },
  { key: 'hard',   label: 'Hard',   emoji: '🔥', color: 'var(--red)',   desc: 'Less time · tough challenges · experts only' },
]

export default function DifficultyPicker({ gameName, category, onSelect, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>🎮</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>
        {gameName} Practice
      </div>
      {category && (
        <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 28, textAlign: 'center' }}>
          Category: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{category}</span>
        </div>
      )}
      {!category && <div style={{ marginBottom: 28 }} />}

      <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        Select difficulty
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
        {DIFFICULTIES.map(d => (
          <div
            key={d.key}
            onClick={() => onSelect(d.key)}
            style={{
              background: 'var(--surface)',
              border: `2px solid ${d.color}33`,
              borderRadius: 14, padding: '18px 20px',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 16,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = d.color
              e.currentTarget.style.transform = 'scale(1.02)'
              e.currentTarget.style.boxShadow = `0 0 20px ${d.color}33`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = `${d.color}33`
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 12, background: `${d.color}18`, border: `1px solid ${d.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {d.emoji}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 800, color: d.color, marginBottom: 3 }}>
                {d.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5 }}>{d.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        style={{ marginTop: 24, fontSize: 13, color: 'var(--muted2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--display)', fontWeight: 600 }}
      >
        ← Back
      </button>
    </div>
  )
}
