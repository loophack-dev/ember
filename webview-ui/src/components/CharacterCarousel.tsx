import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { PALETTE_COUNT } from '../constants.js'
import { Direction } from '../office/types.js'
import { getCharacterSprites } from '../office/sprites/spriteData.js'
import { getCachedSprite } from '../office/sprites/spriteCache.js'

interface CharacterCarouselProps {
  palette: number
  hueShift?: number
  onChange: (palette: number) => void
}

function drawLook(canvas: HTMLCanvasElement | null, palette: number, hueShift: number): void {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  try {
    const sprites = getCharacterSprites(palette, hueShift)
    const frame = sprites.walk[Direction.DOWN][1]
    if (!frame?.[0]?.length) return
    const source = getCachedSprite(frame, 4)
    canvas.width = source.width
    canvas.height = source.height
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, 0, 0)
  } catch {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

export function CharacterCarousel({ palette, hueShift = 0, onChange }: CharacterCarouselProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const index = ((palette % PALETTE_COUNT) + PALETTE_COUNT) % PALETTE_COUNT

  useLayoutEffect(() => {
    drawLook(canvasRef.current, index, hueShift)
  }, [index, hueShift])

  const step = (delta: number) => {
    onChange((index + delta + PALETTE_COUNT) % PALETTE_COUNT)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <button type="button" onClick={() => step(-1)} style={arrowBtn} aria-label="Previous character">
        ‹
      </button>
      <div
        style={{
          width: 88,
          height: 88,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--pixel-btn-bg)',
          border: '2px solid var(--pixel-border)',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: 64, height: 64, imageRendering: 'pixelated' }}
        />
      </div>
      <button type="button" onClick={() => step(1)} style={arrowBtn} aria-label="Next character">
        ›
      </button>
    </div>
  )
}

const arrowBtn: CSSProperties = {
  width: 32,
  height: 56,
  fontSize: '28px',
  lineHeight: 1,
  background: 'var(--pixel-btn-bg)',
  color: 'var(--pixel-text)',
  border: '2px solid var(--pixel-border)',
  cursor: 'pointer',
}
