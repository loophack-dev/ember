## Why

Each agent currently has two labels: a compact name that stays on screen, and a larger Idle/name card that appears on click or hover. The extra card is noise; status should live on the name people already use.

## What Changes

- Keep the permanent name label.
- Remove the secondary activity card that appears on click or hover (the two-line Idle + name box).
- Show character status as a colored dot beside the name on that permanent label.
- Edit / Move / Fire stay on select and still sit above the name label. No REST or protocol changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `agent-catalog`: agents keep one name label; click/hover must not open a second label; status is a color dot next to the name.

## Impact

- Webview overlay only: `ToolOverlay.tsx` (and unused `AgentLabels.tsx` if it is still leftover).
- Hire actions and Fire/Move flows stay as they are.
