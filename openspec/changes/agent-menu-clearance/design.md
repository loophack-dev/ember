## Context

See proposal.md for motivation. `ToolOverlay` already draws a column above the selected character: name/activity label first, then Edit / Move / Fire (or “Click a seat or tile”) with `marginTop: 4`. That second row sits on the sprite. The label itself is fine; the actions are in the wrong slot.

`AgentLabels.tsx` is unused. Do not add a second label system.

## Goals / Non-Goals

**Goals:**

- Keep the character and its name/activity label fully visible while hire actions or the relocate hint are open.
- Keep the same actions, triggers, and overlay chrome.

**Non-Goals:**

- Changing zoom, camera follow, or click hit-testing.
- A floating menu at the cursor or a side dock.
- Flipping the menu below the agent when near the top of the viewport (that would cover the sprite again).

## Decisions

### 1. Stack actions above the label, not below it

Render order in the overlay column (top → bottom):

1. Edit / Move / Fire, or the relocate hint
2. Name / activity label
3. Character (in the canvas, below the overlay cluster)

Raise the cluster so the bottom of the label still clears the sprite head (today’s `TOOL_OVERLAY_VERTICAL_OFFSET` plus the extra action-row height). A small gap between menu and label, and between label and sprite.

**Why not place the menu beside the agent?** Side placement collides with nearby desks, other labels, and sitting poses. Vertical stacking stays anchored to the same character.

**Why not only increase `marginTop` below the label?** That pushes the menu further onto the body. The menu has to move up, not down.

### 2. One overlay column still owns both chrome pieces

Keep menu and label in the same `ToolOverlay` positioned column (`translateX(-50%)` on the character). Reordering DOM children is enough; do not split into two absolutely positioned layers unless the extra offset still overlaps after a first pass.

## Risks / Trade-offs

- [Near the top of the viewport the menu may clip] → Accept for this change; do not flip under the sprite.
- [Sitting vs standing height] → Keep the existing sitting offset so the label still tracks the head.

## Migration Plan

1. Reorder and offset the overlay in the webview only.
2. Rollback: revert `ToolOverlay` (and any constant tweak).

## Open Questions

None. Menu stays above the label; label stays above the agent.
