import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { createAgent, getAgent, listProviders, listTools, putAppearance, updateAgent } from '../embers/client.js'
import { generateAppearance } from '../embers/appearance.js'
import { embersErrorMessage, isEmbersError } from '../embers/http.js'
import {
  cacheAgent,
  getBackendId,
  getCachedAgent,
  projectCreated,
  projectNameUpdated,
} from '../embers/officeBridge.js'
import { CHARACTER_PALETTES } from '../office/sprites/spriteData.js'
import type { AgentIdentity, AgentOut, Appearance, Provider, ProviderOut } from '../embers/types.js'
import type { OfficeState } from '../office/engine/officeState.js'
import { CharacterCarousel } from './CharacterCarousel.js'
import { MarkdownField } from './MarkdownField.js'
import { ThemeSelect } from './ThemeSelect.js'

export type AgentFormMode = { kind: 'create' } | { kind: 'edit'; displayId: number }

type FormTab = 'tools' | 'contract' | 'guardrails' | 'memory' | 'artefacts' | 'a2a'

const TABS: { id: FormTab; label: string }[] = [
  { id: 'tools', label: 'Tools & MCPs' },
  { id: 'contract', label: 'Contract' },
  { id: 'guardrails', label: 'Guardrails' },
  { id: 'memory', label: 'Memory' },
  { id: 'artefacts', label: 'Artefacts' },
  { id: 'a2a', label: 'A2A Manifest' },
]

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
  instructions: string
  tools: string[]
  palette: number
}

const emptyValues: FormValues = {
  name: '',
  provider: '',
  model_id: '',
  role: '',
  instructions: '',
  tools: [],
  palette: 0,
}

function valuesFromAgent(agent: AgentOut): FormValues {
  return {
    name: agent.name,
    provider: agent.model_config.provider,
    model_id: agent.model_config.model_id,
    role: agent.identity.role,
    instructions: agent.instructions ?? '',
    tools: [...agent.tools],
    palette: typeof agent.appearance.palette === 'number' ? agent.appearance.palette : 0,
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

const fieldLabel: CSSProperties = {
  display: 'block',
  fontSize: '16px',
  color: 'var(--pixel-text-dim)',
  marginBottom: 4,
}

const fieldInput: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 8px',
  fontSize: '18px',
  color: 'var(--pixel-text)',
  background: '#2a2a3e',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
}

function identityForSave(role: string, existing?: AgentIdentity): AgentIdentity {
  return {
    role,
    persona: existing?.persona ?? null,
    tone: existing?.tone ?? null,
  }
}

export function AgentFormModal({ mode, officeState, onClose }: AgentFormModalProps) {
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [providers, setProviders] = useState<ProviderOut[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [tab, setTab] = useState<FormTab>('contract')
  const [previewInstructions, setPreviewInstructions] = useState(true)
  const [existingIdentity, setExistingIdentity] = useState<AgentIdentity | null>(null)
  const [existingAppearance, setExistingAppearance] = useState<Appearance | null>(null)

  useEffect(() => {
    if (!mode) return
    let cancelled = false
    setError(null)
    setTab('contract')
    setPreviewInstructions(true)
    setExistingIdentity(null)
    setExistingAppearance(null)
    setCatalogLoading(true)

    const load = async () => {
      try {
        const [providerList, toolList] = await Promise.all([listProviders(), listTools()])
        if (cancelled) return
        setProviders(providerList)

        if (mode.kind === 'create') {
          const firstProvider = providerList[0]
          setValues({
            ...emptyValues,
            provider: firstProvider?.provider ?? '',
            model_id: firstProvider?.models[0]?.id ?? '',
            tools: toolList.map((t) => t.id),
            palette: 0,
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
        setExistingIdentity(agent.identity)
        setExistingAppearance(agent.appearance)
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validation = validate(values)
    if (validation) {
      setError(validation)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const identity = identityForSave(values.role.trim(), existingIdentity ?? undefined)
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
          appearance: generateAppearance(officeState, values.palette),
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
      const paletteChanged = existingAppearance?.palette !== values.palette
      let saved = updated
      if (paletteChanged) {
        saved = await putAppearance(uuid, {
          ...existingAppearance,
          ...updated.appearance,
          palette: values.palette,
          avatar: `palette-${values.palette}`,
          color: CHARACTER_PALETTES[values.palette]?.shirt ?? updated.appearance.color,
        })
      }
      cacheAgent(saved)
      const displayId = projectNameUpdated(saved.id, saved.name)
      if (displayId !== null) {
        officeState.setAgentFolderName(displayId, saved.name)
        if (paletteChanged) {
          officeState.setAgentLook(displayId, values.palette, saved.appearance.hue_shift ?? 0)
        }
      }
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
          width: 560,
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
            {mode.kind === 'create' ? 'New Ember' : 'Config Ember'}
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

        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '0 8px 8px',
            overflowX: 'auto',
            borderBottom: '1px solid var(--pixel-border)',
            marginBottom: 8,
          }}
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              style={{
                flexShrink: 0,
                padding: '4px 8px',
                fontSize: '14px',
                background: tab === item.id ? 'var(--pixel-active-bg)' : 'var(--pixel-btn-bg)',
                color: 'var(--pixel-text)',
                border: tab === item.id ? '2px solid var(--pixel-accent)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {catalogLoading ? (
          <div style={{ padding: 12, color: 'var(--pixel-text-dim)', fontSize: '18px' }}>Loading…</div>
        ) : tab !== 'contract' ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--pixel-text-dim)', fontSize: '18px' }}>
            Comming soon
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 8px' }}>
            <label>
              <span style={fieldLabel}>Character</span>
              <CharacterCarousel palette={values.palette} onChange={(palette) => setField('palette', palette)} />
            </label>
            <label>
              <span style={fieldLabel}>Name</span>
              <input style={fieldInput} value={values.name} maxLength={60} onChange={(e) => setField('name', e.target.value)} />
            </label>
            <label>
              <span style={fieldLabel}>Provider</span>
              <ThemeSelect
                value={values.provider}
                options={
                  providers.length === 0
                    ? [{ value: '', label: 'No providers' }]
                    : providers.map((p) => ({
                      value: p.provider,
                      label: p.available ? p.provider : `${p.provider} (unavailable)`,
                    }))
                }
                onChange={(provider) => {
                  const next = providers.find((p) => p.provider === provider)
                  setValues((prev) => ({
                    ...prev,
                    provider,
                    model_id: next?.models[0]?.id ?? '',
                  }))
                }}
              />
            </label>
            <label>
              <span style={fieldLabel}>Model</span>
              <ThemeSelect
                value={values.model_id}
                options={
                  models.length === 0
                    ? [{ value: '', label: 'No models' }]
                    : models.map((m) => ({ value: m.id, label: m.label }))
                }
                onChange={(modelId) => setField('model_id', modelId)}
              />
            </label>
            <label>
              <span style={fieldLabel}>Role</span>
              <input style={fieldInput} value={values.role} maxLength={80} onChange={(e) => setField('role', e.target.value)} />
            </label>
            <div>
              <span style={fieldLabel}>Instructions (optional)</span>
              <MarkdownField
                value={values.instructions}
                onChange={(next) => setField('instructions', next)}
                maxLength={8000}
                preview={previewInstructions}
                onPreviewChange={setPreviewInstructions}
              />
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
