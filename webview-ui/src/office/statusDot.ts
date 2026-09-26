import type { ToolActivity } from './types.js'
import type { OfficeState } from './engine/officeState.js'

export function statusDot(
  id: number,
  officeState: OfficeState,
  agentTools: Record<number, ToolActivity[]>,
): { color: string; pulse: boolean } {
  const ch = officeState.characters.get(id)
  if (!ch) return { color: 'var(--pixel-text-dim)', pulse: false }

  const tools = agentTools[id]
  const hasPermission = (ch.isSubagent && ch.bubbleType === 'permission')
    || tools?.some((t) => t.permissionWait && !t.done)
  if (hasPermission) return { color: 'var(--pixel-status-permission)', pulse: false }

  const hasActiveTools = tools?.some((t) => !t.done)
  if (ch.isActive && hasActiveTools) return { color: 'var(--pixel-status-active)', pulse: true }

  return { color: 'var(--pixel-text-dim)', pulse: false }
}
