import { HUE_SHIFT_MIN_DEG, HUE_SHIFT_RANGE_DEG, PALETTE_COUNT } from '../constants.js'
import type { OfficeState } from '../office/engine/officeState.js'
import { CHARACTER_PALETTES } from '../office/sprites/spriteData.js'
import type { Appearance } from './types.js'

function pickDiversePalette(officeState: OfficeState): { palette: number; hueShift: number } {
  const counts = new Array(PALETTE_COUNT).fill(0) as number[]
  for (const ch of officeState.characters.values()) {
    if (ch.isSubagent) continue
    counts[ch.palette]++
  }
  const minCount = Math.min(...counts)
  const available: number[] = []
  for (let i = 0; i < PALETTE_COUNT; i++) {
    if (counts[i] === minCount) available.push(i)
  }
  const palette = available[Math.floor(Math.random() * available.length)]
  const hueShift = minCount > 0
    ? HUE_SHIFT_MIN_DEG + Math.floor(Math.random() * HUE_SHIFT_RANGE_DEG)
    : 0
  return { palette, hueShift }
}

function findFreeSeatId(officeState: OfficeState): string | null {
  for (const [uid, seat] of officeState.seats) {
    if (!seat.assigned) return uid
  }
  return null
}

export function mergeAppearanceForMove(
  current: Appearance | undefined,
  seatId: string | null,
  col: number,
  row: number,
): Appearance {
  return {
    ...current,
    seat_id: seatId,
    desk: { x: col, y: row },
  }
}

export function generateAppearance(officeState: OfficeState): Appearance {
  const { palette, hueShift } = pickDiversePalette(officeState)
  const color = CHARACTER_PALETTES[palette]?.shirt ?? '#4488CC'
  const seatId = findFreeSeatId(officeState)

  if (seatId) {
    const seat = officeState.seats.get(seatId)!
    return {
      avatar: `palette-${palette}`,
      color,
      desk: { x: seat.seatCol, y: seat.seatRow },
      palette,
      hue_shift: hueShift,
      seat_id: seatId,
    }
  }

  const spawn = officeState.walkableTiles.length > 0
    ? officeState.walkableTiles[Math.floor(Math.random() * officeState.walkableTiles.length)]
    : { col: 1, row: 1 }

  return {
    avatar: `palette-${palette}`,
    color,
    desk: { x: spawn.col, y: spawn.row },
    palette,
    hue_shift: hueShift,
    seat_id: null,
  }
}
