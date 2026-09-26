import { useState, useEffect } from 'react'
import type { ToolActivity } from '../types.js'
import type { OfficeState } from '../engine/officeState.js'
import type { SubagentCharacter } from '../../hooks/useExtensionMessages.js'
import { TILE_SIZE, CharacterState } from '../types.js'
import { TOOL_OVERLAY_VERTICAL_OFFSET, CHARACTER_SITTING_OFFSET_PX } from '../../constants.js'
import { statusDot } from '../statusDot.js'
import { getBackendId } from '../../embers/officeBridge.js'
import { isEmberIdle } from '../../embers/characterStatus.js'

interface ToolOverlayProps {
  officeState: OfficeState
  agents: number[]
  agentTools: Record<number, ToolActivity[]>
  subagentCharacters: SubagentCharacter[]
  containerRef: React.RefObject<HTMLDivElement | null>
  zoom: number
  panRef: React.RefObject<{ x: number; y: number }>
  onEditAgent: (id: number) => void
  onMoveAgent: (id: number) => void
  onFireAgent: (id: number) => void
  showHireActions: boolean
  isRelocating: boolean
}

export function ToolOverlay({
  officeState,
  agents,
  agentTools: _agentTools,
  subagentCharacters,
  containerRef,
  zoom,
  panRef,
  onEditAgent,
  onMoveAgent,
  onFireAgent,
  showHireActions,
  isRelocating,
}: ToolOverlayProps) {
  const [, setTick] = useState(0)
  useEffect(() => {
    let rafId = 0
    const tick = () => {
      setTick((n) => n + 1)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const el = containerRef.current
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const canvasW = Math.round(rect.width * dpr)
  const canvasH = Math.round(rect.height * dpr)
  const layout = officeState.getLayout()
  const mapW = layout.cols * TILE_SIZE * zoom
  const mapH = layout.rows * TILE_SIZE * zoom
  const deviceOffsetX = Math.floor((canvasW - mapW) / 2) + Math.round(panRef.current.x)
  const deviceOffsetY = Math.floor((canvasH - mapH) / 2) + Math.round(panRef.current.y)

  const selectedId = officeState.selectedAgentId
  const allIds = [...agents, ...subagentCharacters.map((s) => s.id)]

  return (
    <>
      {allIds.map((id) => {
        const ch = officeState.characters.get(id)
        if (!ch) return null

        const isSelected = selectedId === id
        const isSub = ch.isSubagent
        const showActions = isSelected && !isSub && showHireActions
        const sittingOffset = ch.state === CharacterState.TYPE ? CHARACTER_SITTING_OFFSET_PX : 0
        const screenX = (deviceOffsetX + ch.x * zoom) / dpr
        const screenY = (deviceOffsetY + (ch.y + sittingOffset - TOOL_OVERLAY_VERTICAL_OFFSET) * zoom) / dpr
        const displayName = ch.folderName
          || (isSub ? (subagentCharacters.find((s) => s.id === id)?.label ?? 'Subtask') : `Ember #${id}`)
        const { color: dotColor, pulse } = statusDot(id)
        const actionsEnabled = isEmberIdle(getBackendId(id))

        return (
          <div
            key={id}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              transform: 'translate(-50%, -100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingBottom: 4,
              pointerEvents: isSelected ? 'auto' : 'none',
              zIndex: isSelected ? 'var(--pixel-overlay-selected-z)' : 'var(--pixel-overlay-z)',
            }}
          >
            {showActions && (
              isRelocating ? (
                <div
                  style={{
                    marginBottom: 4,
                    background: 'var(--pixel-bg)',
                    border: '2px solid var(--pixel-accent)',
                    padding: '3px 8px',
                    boxShadow: 'var(--pixel-shadow)',
                    fontSize: '16px',
                    color: 'var(--pixel-text)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Click a seat or tile
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    gap: 2,
                    marginBottom: 4,
                    background: 'var(--pixel-bg)',
                    border: '2px solid var(--pixel-border)',
                    padding: 2,
                    boxShadow: 'var(--pixel-shadow)',
                  }}
                >
                  {([
                    ['Edit', () => onEditAgent(id)],
                    ['Move', () => onMoveAgent(id)],
                    ['Fire', () => onFireAgent(id)],
                  ] as const).map(([label, handler]) => (
                    <button
                      key={label}
                      type="button"
                      disabled={!actionsEnabled}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!actionsEnabled) return
                        handler()
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '18px',
                        background: 'var(--pixel-btn-bg)',
                        color: label === 'Fire' ? 'var(--pixel-close-text)' : 'var(--pixel-text)',
                        border: '2px solid transparent',
                        borderRadius: 0,
                        cursor: actionsEnabled ? 'pointer' : 'default',
                        opacity: actionsEnabled ? 1 : 0.4,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--pixel-bg)',
                border: isSelected
                  ? '2px solid var(--pixel-border-light)'
                  : '1px solid var(--pixel-border)',
                padding: '1px 6px',
                boxShadow: 'var(--pixel-shadow)',
                whiteSpace: 'nowrap',
              }}
            >
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
                  fontSize: '16px',
                  fontStyle: isSub ? 'italic' : undefined,
                  color: 'var(--pixel-text-dim)',
                }}
              >
                {displayName}
              </span>
            </div>
          </div>
        )
      })}
    </>
  )
}
