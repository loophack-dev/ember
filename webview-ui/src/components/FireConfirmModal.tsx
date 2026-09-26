interface FireConfirmModalProps {
  agentName: string
  onCancel: () => void
  onConfirm: () => void
  busy?: boolean
}

const btnStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '22px',
  background: 'var(--pixel-btn-bg)',
  color: 'var(--pixel-text)',
  border: '2px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
}

export function FireConfirmModal({ agentName, onCancel, onConfirm, busy }: FireConfirmModalProps) {
  return (
    <>
      <div
        onClick={busy ? undefined : onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 120,
        }}
      />
      <div
        role="dialog"
        aria-labelledby="fire-confirm-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 121,
          background: 'var(--pixel-bg)',
          border: '2px solid var(--pixel-border)',
          borderRadius: 0,
          padding: 8,
          boxShadow: 'var(--pixel-shadow)',
          minWidth: 280,
        }}
      >
        <div
          style={{
            padding: '4px 8px 8px',
            borderBottom: '1px solid var(--pixel-border)',
            marginBottom: 8,
          }}
        >
          <span id="fire-confirm-title" style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.9)' }}>
            Fire this Ember?
          </span>
        </div>
        <p style={{ margin: '0 8px 12px', fontSize: '18px', color: 'var(--pixel-text-dim)' }}>
          {agentName} will be archived and leave the office.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 8px 4px' }}>
          <button type="button" style={btnStyle} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{
              ...btnStyle,
              background: 'var(--pixel-danger-bg)',
              color: '#fff',
              opacity: busy ? 0.6 : 1,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            Fire
          </button>
        </div>
      </div>
    </>
  )
}
