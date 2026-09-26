import { useLayoutEffect, useRef, useState } from 'react'
import { Direction } from '../office/types.js'
import type { Character } from '../office/types.js'
import { getCharacterSprites } from '../office/sprites/spriteData.js'
import { getCachedSprite } from '../office/sprites/spriteCache.js'

interface EmberPortraitProps {
  character: Character | undefined
  name: string
  size?: number
}

export function EmberPortrait({ character, name, size = 36 }: EmberPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showSprite, setShowSprite] = useState(false)
  const initial = (name.trim()[0] || 'E').toUpperCase()

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !character) {
      setShowSprite(false)
      return
    }
    try {
      const sprites = getCharacterSprites(character.palette, character.hueShift)
      const frame = sprites.walk[Direction.DOWN][1]
      if (!frame?.[0]?.length) {
        setShowSprite(false)
        return
      }
      const source = getCachedSprite(frame, 3)
      const cropH = Math.max(1, Math.floor(source.height * 0.5))
      canvas.width = source.width
      canvas.height = cropH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setShowSprite(false)
        return
      }
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(source, 0, 0, source.width, cropH, 0, 0, source.width, cropH)
      setShowSprite(true)
    } catch {
      setShowSprite(false)
    }
  }, [character])

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        background: 'var(--pixel-btn-bg)',
        border: '1px solid var(--pixel-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: showSprite ? 'block' : 'none',
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          objectFit: 'cover',
        }}
      />
      {!showSprite && (
        <span style={{ fontSize: Math.round(size * 0.5), color: 'var(--pixel-text)' }}>{initial}</span>
      )}
    </div>
  )
}
