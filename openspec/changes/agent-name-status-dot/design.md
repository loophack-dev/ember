## Context

See proposal.md for motivation. `ToolOverlay` currently renders two label chrome states:

- Unselected: compact name pill (the one to keep).
- Selected or hovered: a larger card with activity text (`Idle`, tool status, `Needs approval`) plus the name and an optional status dot.

Edit / Move / Fire already sit above that stack. `AgentLabels.tsx` is unused leftover with a similar name + dot idea; do not resurrect a second label system.

Status today comes from office activity (`isActive`, open tools, permission wait), not from Embers `character_status`. This change keeps that existing derivation so we do not add REST or protocol work.

## Goals / Non-Goals

**Goals:**

- One name label per character, always the compact pill.
- Status as a color dot to the left of the name on that pill.
- Keep hire actions and the relocate hint above the name label.

**Non-Goals:**

- Wiring Embers `character_status` or new status enums.
- Showing activity text (`Idle`, tool names) on the office overlay.
- Changing Debug View status copy.

## Decisions

### 1. Delete the details card; keep one pill

Remove the `showDetails` branch. Always render the compact name pill. Hover no longer swaps chrome. Select still shows Edit / Move / Fire above the same pill.

### 2. Dot uses existing overlay status colors

Compute the dot for every character, not only on select:

| Office state | Dot |
|---|---|
| Waiting for approval | `--pixel-status-permission` (yellow) |
| Active with work | `--pixel-status-active` (blue), pulse |
| Idle / otherwise | dim/neutral (`--pixel-text-dim` or equivalent) so a dot is always present |

Place the dot in a horizontal row with the name (`[dot] Name`), not above the pill.

**Why not Embers `character_status`?** The overlay does not read it today. Mapping idle/thinking/working/writing/done/error would be a new contract surface. The user asked for a visual swap of the status they already see (`Idle` → a dot).

### 3. Sub-agents stay on the same pill

Sub-agents keep a single italic name (or subtask label) plus the same dot rules. They still get no hire menu.

## Risks / Trade-offs

- [Users lose readable “Idle” / tool status on hover] → Intentional; the dot is the status. Debug view still has text.
- [Idle vs active is only a color] → Keep pulse on active so the two states stay distinguishable.

## Migration Plan

1. Change `ToolOverlay` only.
2. Rollback: restore the details card branch.

## Open Questions

None. Status source stays the existing office activity signals.
