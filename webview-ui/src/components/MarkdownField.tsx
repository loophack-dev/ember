import { useMemo, type CSSProperties } from 'react'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderInline(value: string): string {
  return value
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let inList = false
  let inCode = false
  let code: string[] = []

  const closeList = () => {
    if (inList) {
      html.push('</ul>')
      inList = false
    }
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        html.push(`<pre><code>${code.join('\n')}</code></pre>`)
        code = []
        inCode = false
      } else {
        closeList()
        inCode = true
      }
      continue
    }
    if (inCode) {
      code.push(escapeHtml(line))
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      closeList()
      const level = heading[1].length
      html.push(`<h${level}>${renderInline(escapeHtml(heading[2]))}</h${level}>`)
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html.push('<ul>')
        inList = true
      }
      html.push(`<li>${renderInline(escapeHtml(line.replace(/^[-*]\s+/, '')))}</li>`)
      continue
    }

    closeList()
    if (line.trim() === '') {
      html.push('')
      continue
    }
    html.push(`<p>${renderInline(escapeHtml(line))}</p>`)
  }
  closeList()
  if (inCode) html.push(`<pre><code>${code.join('\n')}</code></pre>`)
  return html.join('')
}

interface MarkdownFieldProps {
  value: string
  onChange: (value: string) => void
  maxLength: number
  preview: boolean
  onPreviewChange: (preview: boolean) => void
}

export function MarkdownField({ value, onChange, maxLength, preview, onPreviewChange }: MarkdownFieldProps) {
  const html = useMemo(() => renderMarkdown(value), [value])

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        <button
          type="button"
          onClick={() => onPreviewChange(true)}
          style={modeBtn(preview)}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => onPreviewChange(false)}
          style={modeBtn(!preview)}
        >
          Edit
        </button>
      </div>
      {preview ? (
        <div
          className="ember-md-preview"
          style={{
            minHeight: 240,
            maxHeight: 360,
            overflowY: 'auto',
            padding: '8px 10px',
            background: 'var(--pixel-btn-bg)',
            border: '2px solid var(--pixel-border)',
            color: 'var(--pixel-text)',
            fontSize: '16px',
            lineHeight: 1.45,
          }}
          dangerouslySetInnerHTML={{ __html: html || '<p style="opacity:.6">Nothing to preview</p>' }}
        />
      ) : (
        <textarea
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            minHeight: 240,
            resize: 'vertical',
            padding: '8px 10px',
            fontSize: '16px',
            color: 'var(--pixel-text)',
            background: 'var(--pixel-btn-bg)',
            border: '2px solid var(--pixel-border)',
            borderRadius: 0,
          }}
        />
      )}
    </div>
  )
}

function modeBtn(active: boolean): CSSProperties {
  return {
    padding: '2px 8px',
    fontSize: '14px',
    background: active ? 'var(--pixel-active-bg)' : 'var(--pixel-btn-bg)',
    color: 'var(--pixel-text)',
    border: active ? '2px solid var(--pixel-accent)' : '2px solid var(--pixel-border)',
    cursor: 'pointer',
  }
}
