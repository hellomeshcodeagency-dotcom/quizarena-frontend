// Centered, large logo for auth pages
export default function AuthLogo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 36 }}>
      <img
        src="/logo.png"
        alt="BrainBattle"
        style={{
          height: 80,
          width: 'auto',
          objectFit: 'contain',
          display: 'inline-block',
        }}
      />
    </div>
  )
}
