import { getBackendId } from '../embers/officeBridge.js'
import { getCharacterStatus } from '../embers/characterStatus.js'

export function statusDot(id: number): { color: string; pulse: boolean } {
  const uuid = getBackendId(id)
  const status = uuid ? getCharacterStatus(uuid) : 'idle'
  if (status === 'working') return { color: 'var(--pixel-status-permission)', pulse: true }
  if (status === 'waiting') return { color: 'var(--pixel-status-active)', pulse: false }
  return { color: 'var(--pixel-text-dim)', pulse: false }
}
