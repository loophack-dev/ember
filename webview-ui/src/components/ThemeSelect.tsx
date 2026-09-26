import { useEffect, useRef, useState } from 'react'

interface ThemeSelectOption {
  value: string
  label: string
}

interface ThemeSelectProps {
  value: string
  options: ThemeSelectOption[]
  onChange: (value: string) => void
}

export function ThemeSelect({ value, options, onChange }: ThemeSelectProps) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)
  const label = selected?.label ?? (options[0]?.label ?? 'Select…')

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '6px 8px',
          fontSize: '18px',
          textAlign: 'left',
          color: 'var(--pixel-text)',
          background: '#2a2a3e',
          border: '2px solid var(--pixel-border)',
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            zIndex: 20,
            maxHeight: 200,
            overflowY: 'auto',
            background: '#2a2a3e',
            border: '2px solid var(--pixel-border)',
            boxShadow: 'var(--pixel-shadow)',
          }}
        >
          {options.map((option) => {
            const active = option.value === value
            const isHovered = hovered === option.value
            return (
              <button
                key={option.value || option.label}
                type="button"
                onMouseEnter={() => setHovered(option.value)}
                onMouseLeave={() => setHovered((prev) => (prev === option.value ? null : prev))}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '6px 8px',
                  fontSize: '16px',
                  textAlign: 'left',
                  color: '#e8e8f0',
                  background: active || isHovered ? '#3d3d58' : '#2a2a3e',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
