import { useState } from 'react'
import type { OfficeState } from '../office/engine/officeState.js'
import { refreshArtifactDownload } from '../embers/client.js'
import { getBackendId, getCachedAgent } from '../embers/officeBridge.js'
import type { PendingAsk, TaskArtifact, TaskLogRow } from '../embers/taskTypes.js'
import type { TaskSocketStatus } from '../embers/taskSocket.js'
import { EmberPortrait } from './EmberPortrait.js'

function artifactExpired(artifact: TaskArtifact): boolean {
  if (!artifact.url_expires_at) return !artifact.download_url
  const expires = Date.parse(artifact.url_expires_at)
  return Number.isNaN(expires) || expires <= Date.now()
}

async function openArtifact(artifact: TaskArtifact): Promise<void> {
  try {
    const url = !artifactExpired(artifact) && artifact.download_url
      ? artifact.download_url
      : await refreshArtifactDownload(artifact.id)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {
    if (artifact.download_url) window.open(artifact.download_url, '_blank', 'noopener,noreferrer')
  }
}

interface TasksPaneProps {
  officeState: OfficeState
  selectedId: number | null
  enabled: boolean
  socketStatus: TaskSocketStatus
  log: TaskLogRow[]
  pendingAsk: PendingAsk | null
  onDelegate: (instruction: string) => boolean
  onAnswer: (answer: string) => boolean
}

function rowAccent(row: TaskLogRow): string {
  if (row.type === 'error' || row.finishStatus === 'failed' || row.status === 'error') {
    return 'var(--pixel-danger-bg)'
  }
  if (row.type === 'ask') return 'var(--pixel-status-permission)'
  if (row.direction === 'out') return 'var(--pixel-green)'
  return 'var(--pixel-accent)'
}

function typeLabel(row: TaskLogRow): string {
  if (row.type === 'finish') return row.finishStatus === 'failed' ? 'finish failed' : 'finish'
  if (row.status === 'queued' && row.type === 'ack') return 'ack queued'
  return row.type
}

export function TasksPane({
  officeState,
  selectedId,
  enabled,
  socketStatus,
  log,
  pendingAsk,
  onDelegate,
  onAnswer,
}: TasksPaneProps) {
  const [draft, setDraft] = useState('')
  const answering = enabled && pendingAsk !== null
  const canSend = enabled && socketStatus === 'open' && draft.trim().length > 0

  const submit = () => {
    if (!canSend) return
    const ok = answering ? onAnswer(draft) : onDelegate(draft)
    if (ok) setDraft('')
  }

  return (
    <section
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        opacity: enabled ? 1 : 0.45,
      }}
    >
      <div style={{ fontSize: '22px', color: 'var(--pixel-text)', marginBottom: 8, flexShrink: 0 }}>
        Tasks Pane
      </div>
      {socketStatus !== 'open' && (
        <div style={{ fontSize: '16px', color: 'var(--pixel-text-dim)', marginBottom: 6, flexShrink: 0 }}>
          {socketStatus === 'connecting' ? 'Connecting to Embers…' : 'Task socket disconnected'}
        </div>
      )}
      {!enabled && (
        <div style={{ fontSize: '16px', color: 'var(--pixel-text-dim)', marginBottom: 6, flexShrink: 0 }}>
          Select an Ember to send work
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {log.length === 0 ? (
          <div style={{ fontSize: '17px', color: 'var(--pixel-text-dim)', padding: 6 }}>
            No task events yet
          </div>
        ) : (
          log.map((row) => {
            const ch = row.displayId !== null ? officeState.characters.get(row.displayId) : undefined
            const name = ch?.folderName
              || (row.agentId ? getCachedAgent(row.agentId)?.name : undefined)
              || (row.displayId !== null ? `Ember #${row.displayId}` : 'Ember')
            const isLiveAsk = answering
              && row.type === 'ask'
              && row.ask?.questionId === pendingAsk.questionId
            return (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: 8,
                  borderLeft: `3px solid ${rowAccent(row)}`,
                  background: 'var(--pixel-btn-bg)',
                }}
              >
                <EmberPortrait character={ch} name={name} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '14px', color: rowAccent(row), textTransform: 'uppercase' }}>
                    {row.direction === 'out' ? 'out' : 'in'} · {typeLabel(row)}
                    {row.status === 'pending' && row.direction === 'out' ? ' · pending' : ''}
                    {row.status === 'acked' && row.direction === 'out' ? ' · accepted' : ''}
                    {row.status === 'queued' && row.direction === 'out' ? ' · queued' : ''}
                    {row.status === 'error' && row.direction === 'out' ? ' · rejected' : ''}
                  </div>
                  <div style={{ fontSize: '18px', color: 'var(--pixel-text)', wordBreak: 'break-word', lineHeight: 1.4 }}>
                    {row.summary}
                  </div>
                  {row.artifacts && row.artifacts.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 4,
                        marginTop: 6,
                        overflowX: 'auto',
                        maxWidth: '100%',
                      }}
                    >
                      {row.artifacts.map((artifact) => (
                        <button
                          key={artifact.id}
                          type="button"
                          onClick={() => { void openArtifact(artifact) }}
                          style={{
                            flexShrink: 0,
                            padding: '4px 8px',
                            fontSize: '15px',
                            background: 'var(--pixel-btn-bg)',
                            color: 'var(--pixel-text)',
                            border: '2px solid var(--pixel-border)',
                            cursor: 'pointer',
                          }}
                        >
                          {artifact.title}
                        </button>
                      ))}
                    </div>
                  )}
                  {isLiveAsk && row.ask?.options && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {row.ask.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={!enabled || socketStatus !== 'open'}
                          onClick={() => onAnswer(option)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '15px',
                            background: 'var(--pixel-btn-bg)',
                            color: 'var(--pixel-text)',
                            border: '2px solid var(--pixel-border)',
                            cursor: enabled ? 'pointer' : 'default',
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      <form
        style={{ display: 'flex', gap: 8, marginTop: 10, flexShrink: 0 }}
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <textarea
          value={draft}
          disabled={!enabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={
            !enabled
              ? 'Select an Ember…'
              : answering
                ? 'Answer this Ember…'
                : 'Send work to this Ember…'
          }
          style={{
            flex: 1,
            minHeight: 88,
            resize: 'none',
            background: 'var(--pixel-btn-bg)',
            color: 'var(--pixel-text)',
            border: '2px solid var(--pixel-border)',
            borderRadius: 0,
            padding: 10,
            fontSize: '18px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!canSend}
          style={{
            alignSelf: 'stretch',
            padding: '0 16px',
            fontSize: '18px',
            background: 'var(--pixel-brand-bg)',
            color: 'var(--pixel-brand-text)',
            border: '2px solid var(--pixel-brand)',
            cursor: canSend ? 'pointer' : 'default',
            opacity: canSend ? 1 : 0.4,
          }}
        >
          Send
        </button>
      </form>
      {selectedId !== null && getBackendId(selectedId) === null && enabled && (
        <div style={{ fontSize: '16px', color: '#ff8a8a', marginTop: 6 }}>
          Could not find this Ember in the catalog
        </div>
      )}
    </section>
  )
}
