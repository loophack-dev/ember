export function BrandHeader() {
  return (
    <header
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 52,
        padding: '0 12px',
        background: 'var(--pixel-bg)',
        borderBottom: '2px solid var(--pixel-border)',
      }}
    >
      <img
        src="./ember-logo.png"
        alt="Ember"
        width={36}
        height={36}
        style={{ display: 'block', imageRendering: 'auto' }}
      />
      <span style={{ fontSize: '24px', color: 'var(--pixel-text)', letterSpacing: 1 }}>
        Ember
      </span>
    </header>
  )
}
