export type TaskOutboundType = 'delegate' | 'answer'
export type TaskInboundType = 'ack' | 'error' | 'ask' | 'finish'

export interface DelegateData {
  agent_id: string
  instruction: string
  expected_output: null
}

export interface AnswerData {
  task_id: string
  question_id: string
  answer: string
}

export interface TaskOutbound {
  type: TaskOutboundType
  request_id: string
  data: DelegateData | AnswerData
}

export interface TaskInbound {
  type: TaskInboundType
  request_id: string | null
  ts: string
  task_id: string | null
  agent_id: string | null
  data: Record<string, unknown>
}

export interface PendingAsk {
  agentId: string
  taskId: string
  questionId: string
  question: string
  options: string[] | null
}

export type TaskLogStatus = 'pending' | 'acked' | 'queued' | 'error'

export interface TaskArtifact {
  id: string
  title: string
  download_url: string | null
  url_expires_at: string | null
}

export interface TaskLogRow {
  id: string
  requestId: string | null
  direction: 'out' | 'in'
  type: TaskOutboundType | TaskInboundType
  agentId: string | null
  displayId: number | null
  summary: string
  status: TaskLogStatus
  errorMessage?: string
  ask?: PendingAsk
  finishStatus?: 'completed' | 'failed'
  artifacts?: TaskArtifact[]
}

export function parseTaskArtifacts(data: Record<string, unknown>): TaskArtifact[] {
  const raw = data.artifacts
  if (!Array.isArray(raw)) return []
  const items: TaskArtifact[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const rec = entry as Record<string, unknown>
    const id = typeof rec.id === 'string' ? rec.id : null
    const title = typeof rec.title === 'string' ? rec.title : null
    if (!id || !title) continue
    items.push({
      id,
      title,
      download_url: typeof rec.download_url === 'string' ? rec.download_url : null,
      url_expires_at: typeof rec.url_expires_at === 'string' ? rec.url_expires_at : null,
    })
  }
  return items
}

export function nextRequestId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function parseTaskInbound(value: unknown): TaskInbound | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.type !== 'ack' && raw.type !== 'error' && raw.type !== 'ask' && raw.type !== 'finish') {
    return null
  }
  return {
    type: raw.type,
    request_id: typeof raw.request_id === 'string' ? raw.request_id : null,
    ts: typeof raw.ts === 'string' ? raw.ts : '',
    task_id: typeof raw.task_id === 'string' ? raw.task_id : null,
    agent_id: typeof raw.agent_id === 'string' ? raw.agent_id : null,
    data: raw.data && typeof raw.data === 'object' ? raw.data as Record<string, unknown> : {},
  }
}
