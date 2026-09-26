import type { AgentOut, Appearance } from './types.js'

const uuidToDisplay = new Map<string, number>()
const displayToUuid = new Map<number, string>()
const agentCache = new Map<string, AgentOut>()
let nextDisplayId = 1

function dispatch(data: unknown): void {
  window.dispatchEvent(new MessageEvent('message', { data }))
}

function ensureDisplayId(uuid: string): number {
  const existing = uuidToDisplay.get(uuid)
  if (existing !== undefined) return existing
  const id = nextDisplayId++
  uuidToDisplay.set(uuid, id)
  displayToUuid.set(id, uuid)
  return id
}

export function appearanceToMeta(appearance: Appearance | undefined): {
  palette?: number
  hueShift?: number
  seatId?: string
} {
  if (!appearance) return {}
  return {
    palette: typeof appearance.palette === 'number' ? appearance.palette : undefined,
    hueShift: typeof appearance.hue_shift === 'number' ? appearance.hue_shift : undefined,
    seatId: typeof appearance.seat_id === 'string' ? appearance.seat_id : undefined,
  }
}

export function cacheAgent(agent: AgentOut): void {
  agentCache.set(agent.id, agent)
}

export function getCachedAgent(uuid: string): AgentOut | undefined {
  return agentCache.get(uuid)
}

export function getBackendId(displayId: number): string | null {
  return displayToUuid.get(displayId) ?? null
}

export function getDisplayId(uuid: string): number | null {
  return uuidToDisplay.get(uuid) ?? null
}

export function hydrateAgents(agents: AgentOut[]): void {
  const ids: number[] = []
  const folderNames: Record<number, string> = {}
  const agentMeta: Record<number, { palette?: number; hueShift?: number; seatId?: string }> = {}

  for (const agent of agents) {
    cacheAgent(agent)
    const id = ensureDisplayId(agent.id)
    ids.push(id)
    folderNames[id] = agent.name
    agentMeta[id] = appearanceToMeta(agent.appearance)
  }

  dispatch({ type: 'existingAgents', agents: ids, folderNames, agentMeta })
}

export function projectCreated(agent: AgentOut): void {
  cacheAgent(agent)
  const id = ensureDisplayId(agent.id)
  const meta = appearanceToMeta(agent.appearance)
  dispatch({
    type: 'agentCreated',
    id,
    folderName: agent.name,
    palette: meta.palette,
    hueShift: meta.hueShift,
    seatId: meta.seatId,
  })
}

export function projectClosed(uuid: string): void {
  const id = uuidToDisplay.get(uuid)
  if (id === undefined) return
  uuidToDisplay.delete(uuid)
  displayToUuid.delete(id)
  agentCache.delete(uuid)
  dispatch({ type: 'agentClosed', id })
}

export function projectNameUpdated(uuid: string, name: string): number | null {
  const cached = agentCache.get(uuid)
  if (cached) cacheAgent({ ...cached, name })
  return getDisplayId(uuid)
}
