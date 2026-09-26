import { getEmbersConfig } from './config.js'
import { parseTaskInbound, type TaskInbound, type TaskOutbound } from './taskTypes.js'

export type TaskSocketStatus = 'connecting' | 'open' | 'closed'

type MessageListener = (message: TaskInbound) => void
type StatusListener = (status: TaskSocketStatus) => void

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectMs = 1000
let started = false
let status: TaskSocketStatus = 'closed'

const messageListeners = new Set<MessageListener>()
const statusListeners = new Set<StatusListener>()

function setStatus(next: TaskSocketStatus): void {
  status = next
  for (const listener of statusListeners) listener(next)
}

function scheduleReconnect(): void {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    open()
  }, reconnectMs)
  reconnectMs = Math.min(reconnectMs * 2, 30_000)
}

function open(): void {
  let url: string
  try {
    url = getEmbersConfig().websocketUrl
  } catch {
    setStatus('closed')
    return
  }

  setStatus('connecting')
  const next = new WebSocket(url)
  socket = next

  next.onopen = () => {
    reconnectMs = 1000
    setStatus('open')
  }

  next.onmessage = (event) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(String(event.data))
    } catch {
      return
    }
    const message = parseTaskInbound(parsed)
    if (!message) return
    for (const listener of messageListeners) listener(message)
  }

  next.onerror = () => next.close()

  next.onclose = () => {
    if (socket === next) socket = null
    setStatus('closed')
    scheduleReconnect()
  }
}

export function ensureEmbersTaskSocket(): void {
  if (started) return
  started = true
  open()
}

export function getEmbersTaskSocketStatus(): TaskSocketStatus {
  return status
}

let lastOutbound: TaskOutbound | null = null

export function sendEmbersTask(message: TaskOutbound): boolean {
  lastOutbound = message
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
    return true
  }
  if (import.meta.env.DEV && status === 'open') return true
  return false
}

export function subscribeEmbersTaskMessages(listener: MessageListener): () => void {
  messageListeners.add(listener)
  return () => { messageListeners.delete(listener) }
}

export function subscribeEmbersTaskStatus(listener: StatusListener): () => void {
  statusListeners.add(listener)
  listener(status)
  return () => { statusListeners.delete(listener) }
}

export function deliverEmbersTaskInbound(raw: unknown): boolean {
  const message = parseTaskInbound(raw)
  if (!message) return false
  for (const listener of messageListeners) listener(message)
  return true
}

if (import.meta.env.DEV) {
  Object.assign(window, {
    __embersTaskDebug: {
      markOpen: () => setStatus('open'),
      deliver: deliverEmbersTaskInbound,
      send: sendEmbersTask,
      lastOutbound: () => lastOutbound,
    },
  })
}
