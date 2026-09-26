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
}

export function getEmbersConfig(): EmbersConfig {
  const raw = import.meta.env.VITE_EMBERS_API_BASE
  const baseUrl = typeof raw === 'string' ? raw.trim().replace(/\/+$/, '') : ''
  if (!baseUrl) {
    throw new EmbersConfigError(
      'VITE_EMBERS_API_BASE is missing. Set it to the Embers API origin (for example http://localhost:8000).',
    )
  }

  const tokenRaw = import.meta.env.VITE_EMBERS_API_TOKEN
  const token = typeof tokenRaw === 'string' && tokenRaw.trim().length > 0 ? tokenRaw.trim() : null
  return { baseUrl, token }
}
