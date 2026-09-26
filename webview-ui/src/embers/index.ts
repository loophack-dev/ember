export { getEmbersConfig, EmbersConfigError } from './config.js'
export {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  putAppearance,
  listProviders,
  listTools,
} from './client.js'
export { EmbersApiError, embersErrorMessage, isEmbersError } from './http.js'
export type {
  AgentCreate,
  AgentIdentity,
  AgentOut,
  AgentUpdate,
  Appearance,
  ErrorBody,
  ListEnvelope,
  ModelConfig,
  Provider,
  ProviderOut,
  ToolOut,
} from './types.js'
