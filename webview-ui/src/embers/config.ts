export class EmbersConfigError extends Error {
  readonly code = 'configuration_error'

  constructor(message: string) {
    super(message)
    this.name = 'EmbersConfigError'
  }
}

export interface EmbersConfig {
  baseUrl: string
  token: string | null
  websocketUrl: string
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function toEmbersWebsocketUrl(raw: string): string {
  let url = trimSlash(raw.trim())
  if (url.startsWith('https://')) url = `wss://${url.slice('https://'.length)}`
  else if (url.startsWith('http://')) url = `ws://${url.slice('http://'.length)}`
  else if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
    url = `${url.startsWith('localhost') || url.startsWith('127.') ? 'ws' : 'wss'}://${url}`
  }
  if (!url.endsWith('/ws')) url += '/ws'
  return url
}

export function getEmbersConfig(): EmbersConfig {
  const raw = import.meta.env.VITE_EMBERS_API_BASE
  const baseUrl = typeof raw === 'string' ? trimSlash(raw.trim()) : ''
  if (!baseUrl) {
    throw new EmbersConfigError(
      'VITE_EMBERS_API_BASE is missing. Set it to the Embers API origin (for example http://localhost:8000).',
    )
  }

  const tokenRaw = import.meta.env.VITE_EMBERS_API_TOKEN
  const token = typeof tokenRaw === 'string' && tokenRaw.trim().length > 0 ? tokenRaw.trim() : null

  const wsRaw = import.meta.env.VITE_EMBERS_WEBSOCKET_BASE
  const websocketUrl = typeof wsRaw === 'string' && wsRaw.trim().length > 0
    ? toEmbersWebsocketUrl(wsRaw)
    : toEmbersWebsocketUrl(baseUrl)

  return { baseUrl, token, websocketUrl }
}
