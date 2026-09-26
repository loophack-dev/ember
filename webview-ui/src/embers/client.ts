import { embersRequest } from './http.js'
import type { AgentCreate, AgentOut, AgentUpdate, Appearance, ListEnvelope, ProviderOut, ToolOut } from './types.js'

export function listAgents(): Promise<AgentOut[]> {
  return embersRequest<ListEnvelope<AgentOut>>('GET', '/agents').then((body) => body.items)
}

export function getAgent(id: string): Promise<AgentOut> {
  return embersRequest<AgentOut>('GET', `/agents/${id}`)
}

export function createAgent(input: AgentCreate): Promise<AgentOut> {
  return embersRequest<AgentOut>('POST', '/agents', input)
}

export function updateAgent(id: string, input: AgentUpdate): Promise<AgentOut> {
  return embersRequest<AgentOut>('PATCH', `/agents/${id}`, input)
}

export function deleteAgent(id: string): Promise<void> {
  return embersRequest<void>('DELETE', `/agents/${id}`)
}

export function putAppearance(id: string, data: Appearance): Promise<AgentOut> {
  return embersRequest<AgentOut>('PUT', `/agents/${id}/appearance`, { data })
}

export function listProviders(): Promise<ProviderOut[]> {
  return embersRequest<ListEnvelope<ProviderOut>>('GET', '/providers').then((body) => body.items)
}

export function listTools(): Promise<ToolOut[]> {
  return embersRequest<ListEnvelope<ToolOut>>('GET', '/tools').then((body) => body.items)
}
