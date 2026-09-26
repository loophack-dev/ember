import { useEffect, useState } from 'react'
import { createAgent, getAgent, listProviders, listTools, updateAgent } from '../embers/client.js'
import { generateAppearance } from '../embers/appearance.js'
import { embersErrorMessage, isEmbersError } from '../embers/http.js'
import {
  cacheAgent,
  getBackendId,
  getCachedAgent,
  projectCreated,
  projectNameUpdated,
} from '../embers/officeBridge.js'
import type { AgentOut, Provider, ProviderOut, ToolOut } from '../embers/types.js'
import type { OfficeState } from '../office/engine/officeState.js'

export type AgentFormMode = { kind: 'create' } | { kind: 'edit'; displayId: number }

interface AgentFormModalProps {
  mode: AgentFormMode | null
  officeState: OfficeState
  onClose: () => void
}

interface FormValues {
  name: string
  provider: string
  model_id: string
  role: string
  persona: string
  tone: string
  instructions: string
  tools: string[]
}

const emptyValues: FormValues = {
  name: '',
  provider: '',
  model_id: '',
  role: '',
  persona: '',
  tone: '',
  instructions: '',
  tools: [],
}

function valuesFromAgent(agent: AgentOut): FormValues {
  return {
    name: agent.name,
    provider: agent.model_config.provider,
    model_id: agent.model_config.model_id,
    role: agent.identity.role,
    persona: agent.identity.persona ?? '',
    tone: agent.identity.tone ?? '',
    instructions: agent.instructions ?? '',
    tools: [...agent.tools],
  }
}

function validate(values: FormValues): string | null {
  const name = values.name.trim()
  if (name.length < 1 || name.length > 60) return 'Name must be 1–60 characters'
  if (!values.provider) return 'Provider is required'
  if (!values.model_id.trim()) return 'Model is required'
  const role = values.role.trim()
  if (role.length < 1 || role.length > 80) return 'Role must be 1–80 characters'
  if (values.instructions.length > 8000) return 'Instructions must be 8000 characters or fewer'
  return null
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '16px',
  color: 'var(--pixel-text-dim)',
  marginBottom: 4,
}

const fieldInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 8px',
  fontSize: '18px',
  color: 'var(--pixel-text)',
  background: 'var(--pixel-btn-bg)',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
}

export function AgentFormModal({ mode, officeState, onClose }: AgentFormModalProps) {
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [providers, setProviders] = useState<ProviderOut[]>([])
  const [tools, setTools] = useState<ToolOut[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(false)

  useEffect(() => {
    if (!mode) return
    let cancelled = false
    setError(null)
    setCatalogLoading(true)

    const load = async () => {
      try {
        const [providerList, toolList] = await Promise.all([listProviders(), listTools()])
        if (cancelled) return
        setProviders(providerList)
        setTools(toolList)

        if (mode.kind === 'create') {
          const firstProvider = providerList[0]
          setValues({
            ...emptyValues,
            provider: firstProvider?.provider ?? '',
            model_id: firstProvider?.models[0]?.id ?? '',
            tools: toolList.map((t) => t.id),
          })
          return
        }

        const uuid = getBackendId(mode.displayId)
        if (!uuid) {
          setError('Could not find this Ember in the catalog')
          return
        }
        const cached = getCachedAgent(uuid)
        const agent = cached ?? await getAgent(uuid)
        if (cancelled) return
        cacheAgent(agent)
        setValues(valuesFromAgent(agent))
      } catch (err) {
        if (!cancelled) setError(embersErrorMessage(err))
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [mode])

  if (!mode) return null

  const selectedProvider = providers.find((p) => p.provider === values.provider)
  const models = selectedProvider?.models ?? []

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validate(values)
    if (validation) {
      setError(validation)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const identity = {
        role: values.role.trim(),
        persona: values.persona.trim() || null,
        tone: values.tone.trim() || null,
      }
      const model_config = {
        provider: values.provider as Provider,
        model_id: values.model_id.trim(),
      }

      if (mode.kind === 'create') {
        const created = await createAgent({
          name: values.name.trim(),
          model_config,
          identity,
          instructions: values.instructions,
          tools: values.tools,
          appearance: generateAppearance(officeState),
        })
        projectCreated(created)
        onClose()
        return
      }

      const uuid = getBackendId(mode.displayId)
      if (!uuid) {
        setError('Could not find this Ember in the catalog')
        return
      }
      const updated = await updateAgent(uuid, {
        name: values.name.trim(),
        model_config,
        identity,
        instructions: values.instructions,
        tools: values.tools,
      })
      cacheAgent(updated)
      const displayId = projectNameUpdated(updated.id, updated.name)
      if (displayId !== null) officeState.setAgentFolderName(displayId, updated.name)
      onClose()
    } catch (err) {
      if (isEmbersError(err) && err.code === 'validation_error' && 'details' in err && err.details) {
        setError(`${err.message}: ${JSON.stringify(err.details)}`)
      } else {
        setError(embersErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleTool = (id: string) => {
    setField('tools', values.tools.includes(id)
      ? values.tools.filter((t) => t !== id)
      : [...values.tools, id])
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 49,
        }}
      />
      <form
        onSubmit={handleSubmit}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
          background: 'var(--pixel-bg)',
          border: '2px solid var(--pixel-border)',
          borderRadius: 0,
          padding: 8,
          boxShadow: 'var(--pixel-shadow)',
          width: 420,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px 8px',
            borderBottom: '1px solid var(--pixel-border)',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.9)' }}>
            {mode.kind === 'create' ? 'New Ember' : 'Edit Ember'}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '24px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            X
          </button>
        </div>

        {catalogLoading ? (
          <div style={{ padding: 12, color: 'var(--pixel-text-dim)', fontSize: '18px' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 8px' }}>
            <label>
              <span style={fieldLabel}>Name</span>
              <input style={fieldInput} value={values.name} maxLength={60} onChange={(e) => setField('name', e.target.value)} />
            </label>
            <label>
              <span style={fieldLabel}>Provider</span>
              <select
                style={fieldInput}
                value={values.provider}
                onChange={(e) => {
                  const provider = e.target.value
                  const next = providers.find((p) => p.provider === provider)
                  setValues((prev) => ({
                    ...prev,
                    provider,
                    model_id: next?.models[0]?.id ?? '',
                  }))
                }}
              >
                {providers.length === 0 && <option value="">No providers</option>}
                {providers.map((p) => (
                  <option key={p.provider} value={p.provider}>
                    {p.provider}{p.available ? '' : ' (unavailable)'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span style={fieldLabel}>Model</span>
              <select style={fieldInput} value={values.model_id} onChange={(e) => setField('model_id', e.target.value)}>
                {models.length === 0 && <option value="">No models</option>}
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span style={fieldLabel}>Role</span>
              <input style={fieldInput} value={values.role} maxLength={80} onChange={(e) => setField('role', e.target.value)} />
            </label>
            <label>
              <span style={fieldLabel}>Persona (optional)</span>
              <input style={fieldInput} value={values.persona} maxLength={600} onChange={(e) => setField('persona', e.target.value)} />
            </label>
            <label>
              <span style={fieldLabel}>Tone (optional)</span>
              <input style={fieldInput} value={values.tone} maxLength={120} onChange={(e) => setField('tone', e.target.value)} />
            </label>
            <label>
              <span style={fieldLabel}>Instructions (optional)</span>
              <textarea
                style={{ ...fieldInput, minHeight: 80, resize: 'vertical' }}
                value={values.instructions}
                maxLength={8000}
                onChange={(e) => setField('instructions', e.target.value)}
              />
            </label>
            <div>
              <span style={fieldLabel}>Tools</span>
              {tools.length === 0 && (
                <div style={{ fontSize: '16px', color: 'var(--pixel-text-dim)' }}>No tools available</div>
              )}
              {tools.map((tool) => (
                <label key={tool.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '18px', color: 'var(--pixel-text)', marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={values.tools.includes(tool.id)}
                    onChange={() => toggleTool(tool.id)}
                  />
                  {tool.id}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '8px', color: '#ff8a8a', fontSize: '16px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 12px',
              fontSize: '18px',
              background: 'var(--pixel-btn-bg)',
              color: 'var(--pixel-text)',
              border: '2px solid var(--pixel-border)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || catalogLoading}
            style={{
              padding: '6px 12px',
              fontSize: '18px',
              background: 'var(--pixel-agent-bg)',
              color: 'var(--pixel-agent-text)',
              border: '2px solid var(--pixel-agent-border)',
              cursor: loading || catalogLoading ? 'default' : 'pointer',
              opacity: loading || catalogLoading ? 0.6 : 1,
            }}
          >
            {loading ? 'Saving…' : mode.kind === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </>
  )
}
