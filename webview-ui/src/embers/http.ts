import { EmbersConfigError, getEmbersConfig } from './config.js'
import type { ErrorResponse } from './types.js'

export class EmbersApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown> | null = null,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'EmbersApiError'
  }
}

export function isEmbersError(error: unknown): error is EmbersApiError | EmbersConfigError {
  return error instanceof EmbersApiError || error instanceof EmbersConfigError
}

export function embersErrorMessage(error: unknown): string {
  if (isEmbersError(error)) return error.message
  if (error instanceof Error) return error.message
  return 'Unexpected error talking to Embers'
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== 'object') return false
  const error = (value as ErrorResponse).error
  return !!error && typeof error.code === 'string' && typeof error.message === 'string'
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new EmbersApiError('internal_error', 'Embers returned a non-JSON response', null, response.status)
  }
}

export async function embersRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const { baseUrl, token } = getEmbersConfig()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
  }
  if (token) headers.Authorization = token
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new EmbersApiError('internal_error', 'Could not reach the Embers API. Check the host and that the backend is running.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await readJson(response)
  if (!response.ok) {
    if (isErrorResponse(payload)) {
      throw new EmbersApiError(
        payload.error.code,
        payload.error.message,
        payload.error.details ?? null,
        response.status,
      )
    }
    throw new EmbersApiError('internal_error', `Embers request failed (${response.status})`, null, response.status)
  }

  return payload as T
}
