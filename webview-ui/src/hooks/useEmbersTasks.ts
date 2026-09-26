import { useCallback, useEffect, useRef, useState } from 'react'
import type { OfficeState } from '../office/engine/officeState.js'
import { getDisplayId } from '../embers/officeBridge.js'
import { applyCharacterPose, setCharacterStatus } from '../embers/characterStatus.js'
import {
  ensureEmbersTaskSocket,
  getEmbersTaskSocketStatus,
  sendEmbersTask,
  subscribeEmbersTaskMessages,
  subscribeEmbersTaskStatus,
  type TaskSocketStatus,
} from '../embers/taskSocket.js'
import {
  nextRequestId,
  parseTaskArtifacts,
  type PendingAsk,
  type TaskInbound,
  type TaskLogRow,
} from '../embers/taskTypes.js'

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function asStringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const items = value.filter((item): item is string => typeof item === 'string')
  return items.length > 0 ? items : null
}

function newRow(partial: Omit<TaskLogRow, 'id'>): TaskLogRow {
  return { id: nextRequestId(), ...partial }
}

export function useEmbersTasks(officeState: OfficeState): {
  socketStatus: TaskSocketStatus
  log: TaskLogRow[]
  pendingAsks: Record<string, PendingAsk>
  sendDelegate: (agentId: string, instruction: string) => boolean
  sendAnswer: (ask: PendingAsk, answer: string) => boolean
} {
  const [socketStatus, setSocketStatus] = useState<TaskSocketStatus>(getEmbersTaskSocketStatus)
  const [log, setLog] = useState<TaskLogRow[]>([])
  const [pendingAsks, setPendingAsks] = useState<Record<string, PendingAsk>>({})
  const outboundRef = useRef(new Map<string, { type: 'delegate' | 'answer'; agentId: string }>())
  const queuesRef = useRef(new Map<string, string[]>())
  const currentTaskRef = useRef(new Map<string, string | null>())

  useEffect(() => {
    ensureEmbersTaskSocket()
    return subscribeEmbersTaskStatus(setSocketStatus)
  }, [])

  const applyOffice = useCallback((agentId: string | null, kind: 'working' | 'queued' | 'waiting' | 'idle') => {
    if (!agentId || kind === 'queued') return
    const displayId = getDisplayId(agentId)
    if (displayId === null) return
    setCharacterStatus(agentId, kind)
    applyCharacterPose(officeState, displayId, agentId)
  }, [officeState])

  useEffect(() => {
    return subscribeEmbersTaskMessages((message: TaskInbound) => {
      const displayId = message.agent_id ? getDisplayId(message.agent_id) : null
      const outbound = message.request_id ? outboundRef.current.get(message.request_id) : undefined

      if (message.type === 'ack') {
        const status = asString(message.data.status)
        const queued = status === 'queued'
        setLog((prev) => {
          const patched = prev.map((row) => {
            if (row.requestId !== message.request_id || row.direction !== 'out') return row
            return { ...row, status: queued ? 'queued' as const : 'acked' as const }
          })
          return [...patched, newRow({
            requestId: message.request_id,
            direction: 'in',
            type: 'ack',
            agentId: message.agent_id,
            displayId,
            summary: queued ? 'Queued' : 'Accepted',
            status: queued ? 'queued' : 'acked',
          })]
        })
        if (outbound?.type === 'delegate') {
          const taskId = asString(message.data.task_id) ?? message.task_id
          if (taskId && message.agent_id) {
            if (queued) {
              const list = queuesRef.current.get(message.agent_id) ?? []
              queuesRef.current.set(message.agent_id, [...list, taskId])
            } else {
              currentTaskRef.current.set(message.agent_id, taskId)
            }
          }
          applyOffice(message.agent_id, queued ? 'queued' : 'working')
        } else if (outbound?.type === 'answer') {
          if (outbound.agentId) {
            setPendingAsks((prev) => {
              if (!(outbound.agentId in prev)) return prev
              const next = { ...prev }
              delete next[outbound.agentId]
              return next
            })
          }
          applyOffice(message.agent_id ?? outbound.agentId, 'working')
        }
        return
      }

      if (message.type === 'error') {
        const errorMessage = asString(message.data.message) ?? asString(message.data.code) ?? 'Rejected'
        setLog((prev) => {
          const patched = prev.map((row) => {
            if (row.requestId !== message.request_id || row.direction !== 'out') return row
            return { ...row, status: 'error' as const, errorMessage }
          })
          return [...patched, newRow({
            requestId: message.request_id,
            direction: 'in',
            type: 'error',
            agentId: message.agent_id ?? outbound?.agentId ?? null,
            displayId: message.agent_id ? getDisplayId(message.agent_id) : (outbound ? getDisplayId(outbound.agentId) : null),
            summary: errorMessage,
            status: 'error',
            errorMessage,
          })]
        })
        const failedAgentId = message.agent_id ?? outbound?.agentId ?? null
        if (failedAgentId && (outbound?.type === 'delegate' || outbound?.type === 'answer')) {
          const queue = queuesRef.current.get(failedAgentId) ?? []
          const current = currentTaskRef.current.get(failedAgentId) ?? null
          if (queue.length === 0 && !current) applyOffice(failedAgentId, 'idle')
        }
        return
      }

      if (message.type === 'ask') {
        const questionId = asString(message.data.question_id)
        const question = asString(message.data.question)
        const taskId = message.task_id ?? asString(message.data.task_id)
        if (!message.agent_id || !questionId || !question || !taskId) return
        const ask: PendingAsk = {
          agentId: message.agent_id,
          taskId,
          questionId,
          question,
          options: asStringList(message.data.options),
        }
        setPendingAsks((prev) => ({ ...prev, [message.agent_id!]: ask }))
        setLog((prev) => [...prev, newRow({
          requestId: null,
          direction: 'in',
          type: 'ask',
          agentId: message.agent_id,
          displayId,
          summary: question,
          status: 'pending',
          ask,
        })])
        applyOffice(message.agent_id, 'waiting')
        return
      }

      if (message.type === 'finish') {
        const finishStatus = asString(message.data.status) === 'failed' ? 'failed' : 'completed'
        const resultText = asString(message.data.result_text)
        const err = message.data.error && typeof message.data.error === 'object'
          ? asString((message.data.error as Record<string, unknown>).message)
          : null
        setLog((prev) => [...prev, newRow({
          requestId: null,
          direction: 'in',
          type: 'finish',
          agentId: message.agent_id,
          displayId,
          summary: finishStatus === 'failed'
            ? (err ?? 'Failed')
            : (resultText ?? 'Completed'),
          status: finishStatus === 'failed' ? 'error' : 'acked',
          finishStatus,
          artifacts: parseTaskArtifacts(message.data),
        })])
        if (message.agent_id) {
          setPendingAsks((prev) => {
            if (!(message.agent_id! in prev)) return prev
            const next = { ...prev }
            delete next[message.agent_id!]
            return next
          })
          const queue = queuesRef.current.get(message.agent_id) ?? []
          const nextQueue = queue.slice(1)
          queuesRef.current.set(message.agent_id, nextQueue)
          currentTaskRef.current.set(message.agent_id, nextQueue[0] ?? null)
          applyOffice(message.agent_id, nextQueue.length > 0 ? 'working' : 'idle')
        }
      }
    })
  }, [applyOffice])

  const sendDelegate = useCallback((agentId: string, instruction: string): boolean => {
    const text = instruction.trim()
    if (!text) return false
    const request_id = nextRequestId()
    const sent = sendEmbersTask({
      type: 'delegate',
      request_id,
      data: { agent_id: agentId, instruction: text, expected_output: null },
    })
    if (!sent) return false
    outboundRef.current.set(request_id, { type: 'delegate', agentId })
    setLog((prev) => [...prev, newRow({
      requestId: request_id,
      direction: 'out',
      type: 'delegate',
      agentId,
      displayId: getDisplayId(agentId),
      summary: text,
      status: 'pending',
    })])
    applyOffice(agentId, 'working')
    return true
  }, [applyOffice])

  const sendAnswer = useCallback((ask: PendingAsk, answer: string): boolean => {
    const text = answer.trim()
    if (!text) return false
    const request_id = nextRequestId()
    const sent = sendEmbersTask({
      type: 'answer',
      request_id,
      data: { task_id: ask.taskId, question_id: ask.questionId, answer: text },
    })
    if (!sent) return false
    outboundRef.current.set(request_id, { type: 'answer', agentId: ask.agentId })
    setLog((prev) => [...prev, newRow({
      requestId: request_id,
      direction: 'out',
      type: 'answer',
      agentId: ask.agentId,
      displayId: getDisplayId(ask.agentId),
      summary: text,
      status: 'pending',
    })])
    applyOffice(ask.agentId, 'working')
    return true
  }, [applyOffice])

  return { socketStatus, log, pendingAsks, sendDelegate, sendAnswer }
}
