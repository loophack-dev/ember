export { getEmbersConfig, EmbersConfigError, toEmbersWebsocketUrl } from './config.js'
export {
  ensureEmbersTaskSocket,
  sendEmbersTask,
  subscribeEmbersTaskMessages,
} from './taskSocket.js'
export {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  putAppearance,
  listProviders,
  listTools,
  refreshArtifactDownload,
} from './client.js'
export {
  getCharacterStatus,
  isEmberIdle,
  setCharacterStatus,
  hydrateCharacterStatuses,
  applyCharacterPose,
} from './characterStatus.js'
export { EmbersApiError, embersErrorMessage, isEmbersError } from './http.js'
export type {
  AgentCreate,
  AgentIdentity,
  AgentOut,
  AgentUpdate,
  Appearance,
  CharacterStatus,
  ErrorBody,
  ListEnvelope,
  ModelConfig,
  Provider,
  ProviderOut,
  ToolOut,
} from './types.js'
