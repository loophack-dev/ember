import { useEffect, useState } from 'react'
import type { ToolActivity } from '../office/types.js'
import type { OfficeState } from '../office/engine/officeState.js'
import { statusDot } from '../office/statusDot.js'
import { getBackendId, getCachedAgent } from '../embers/officeBridge.js'
import { EmberPortrait } from './EmberPortrait.js'

interface EmbersSidebarProps {
  officeState: OfficeState
  agents: number[]
  agentTools: Record<number, ToolActivity[]>
  onSelect: (id: number) => void
  onEdit: (id: number) => void
  onFire: (id: number) => void
}

const rowBtn: React.CSSProperties = {
  padding: '2px 6px',
  fontSize: '14px',
  background: 'var(--pixel-btn-bg)',
  color: 'var(--pixel-text)',
  border: '2px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
}

export function EmbersSidebar({
  officeState,
  agents,
  agentTools,
  onSelect,
  onEdit,
  onFire,
}: EmbersSidebarProps) {
  const [, setTick] = useState(0)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    let rafId = 0
    const tick = () => {
      setTick((n) => n + 1)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const rows = agents.filter((id) => {
    const ch = officeState.characters.get(id)
    return !!ch && !ch.isSubagent
  })
  const selectedId = officeState.selectedAgentId

  return (
    <aside
      style={{
        width: '20%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--pixel-bg)',
        borderLeft: '2px solid var(--pixel-border)',
        minWidth: 0,
      }}
    >
      <section
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          borderBottom: '2px solid var(--pixel-border)',
        }}
      >
        <div
          style={{
            padding: '8px 10px 6px',
            fontSize: '20px',
            color: 'var(--pixel-text)',
            borderBottom: '1px solid var(--pixel-border)',
            flexShrink: 0,
          }}
        >
          Embers
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 6 }}>
          {rows.length === 0 ? (
            <div style={{ padding: 8, fontSize: '14px', color: 'var(--pixel-text-dim)' }}>
              No Embers in the office
            </div>
          ) : (
            rows.map((id) => {
              const ch = officeState.characters.get(id)
              const cached = getCachedAgent(getBackendId(id) ?? '')
              const name = ch?.folderName || cached?.name || `Ember #${id}`
              const role = cached?.identity.role ?? ''
              const { color: dotColor, pulse } = statusDot(id, officeState, agentTools)
              const isSelected = selectedId === id
              return (
                <div
                  key={id}
                  onClick={() => onSelect(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 6px',
                    marginBottom: 4,
                    background: isSelected ? 'var(--pixel-active-bg)' : 'transparent',
                    border: isSelected
                      ? '2px solid var(--pixel-accent)'
                      : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <EmberPortrait character={ch} name={name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span
                        className={pulse ? 'pixel-agents-pulse' : undefined}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: dotColor,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '15px',
                          color: 'var(--pixel-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {name}
                      </span>
                    </div>
                    {role ? (
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--pixel-text-dim)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: 1,
                        }}
                      >
                        {role}
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                      <button
                        type="button"
                        style={rowBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(id)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{ ...rowBtn, color: 'var(--pixel-close-text)' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onFire(id)
                        }}
                      >
                        Fire
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
      <section
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 8,
        }}
      >
        <div style={{ fontSize: '16px', color: 'var(--pixel-text)', marginBottom: 6 }}>
          Instructions
        </div>
        <form
          style={{ flex: 1, minHeight: 0, display: 'flex' }}
          onSubmit={(e) => e.preventDefault()}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) e.preventDefault()
            }}
            placeholder="Assign instructions to an Ember…"
            style={{
              flex: 1,
              minHeight: 0,
              resize: 'none',
              background: 'var(--pixel-btn-bg)',
              color: 'var(--pixel-text)',
              border: '2px solid var(--pixel-border)',
              borderRadius: 0,
              padding: 8,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </form>
      </section>
    </aside>
  )
}
