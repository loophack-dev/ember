import type { OfficeState } from '../office/engine/officeState.js'
import type { AgentOut, CharacterStatus } from './types.js'

const byBackend = new Map<string, CharacterStatus>()
const listeners = new Set<() => void>()

export function parseCharacterStatus(value: unknown): CharacterStatus {
  if (value === 'working' || value === 'waiting') return value
  return 'idle'
}

function notify(): void {
  for (const listener of listeners) listener()
}

export function subscribeCharacterStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function getCharacterStatus(uuid: string): CharacterStatus {
  return byBackend.get(uuid) ?? 'idle'
}

export function isEmberIdle(uuid: string | null): boolean {
  if (!uuid) return true
  return getCharacterStatus(uuid) === 'idle'
}

export function setCharacterStatus(uuid: string, status: CharacterStatus): void {
  if (byBackend.get(uuid) === status) return
  byBackend.set(uuid, status)
  notify()
}

export function hydrateCharacterStatuses(agents: AgentOut[]): void {
  byBackend.clear()
  for (const agent of agents) {
    byBackend.set(agent.id, parseCharacterStatus(agent.character_status))
  }
  notify()
}

export function applyCharacterPose(
  officeState: OfficeState,
  displayId: number,
  uuid: string | null,
): void {
  const status = uuid ? getCharacterStatus(uuid) : 'idle'
  if (status === 'idle') {
    officeState.standIdle(displayId)
    return
  }
  officeState.sitForTask(displayId)
  if (status === 'waiting') officeState.setTaskWaiting(displayId)
  else officeState.clearTaskWaiting(displayId)
}
