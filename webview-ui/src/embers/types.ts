export type Provider = 'anthropic' | 'openai' | 'gemini' | 'bedrock'
export type AgentRecordStatus = 'active' | 'archived'
export type CharacterStatus = 'idle' | 'working' | 'waiting'
export type ArtifactType = 'docx' | 'pptx' | 'md'

export interface ModelParams {
  temperature?: number | null
  max_tokens?: number | null
  top_p?: number | null
}

export interface ModelConfig {
  provider: Provider
  model_id: string
  params?: ModelParams | null
}

export interface AgentIdentity {
  role: string
  persona?: string | null
  tone?: string | null
}

export interface Appearance {
  avatar?: string
  color?: string
  desk?: { x: number; y: number } | null
  palette?: number
  hue_shift?: number
  seat_id?: string | null
}

export interface AgentCreate {
  name: string
  model_config: ModelConfig
  identity: AgentIdentity
  instructions?: string
  tools?: string[]
  appearance?: Appearance | null
}

export interface AgentUpdate {
  name?: string | null
  model_config?: ModelConfig | null
  identity?: AgentIdentity | null
  instructions?: string | null
  tools?: string[] | null
}

export interface AgentOut {
  id: string
  name: string
  model_config: ModelConfig
  identity: AgentIdentity
  instructions: string
  tools: string[]
  status: AgentRecordStatus
  version: number
  appearance: Appearance
  character_status: CharacterStatus
  current_task_id: string | null
  queued_task_ids: string[]
  created_at: string
  updated_at: string
}

export interface AppearanceUpdate {
  data: Appearance
}

export interface ProviderModelOut {
  id: string
  label: string
}

export interface ProviderOut {
  provider: Provider
  available: boolean
  models: ProviderModelOut[]
}

export interface ToolOut {
  id: string
  description: string
  artifact_type?: ArtifactType | null
}

export interface ListEnvelope<T> {
  items: T[]
}

export interface ErrorBody {
  code: string
  message: string
  details?: Record<string, unknown> | null
}

export interface ErrorResponse {
  error: ErrorBody
}
