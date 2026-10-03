## Why

The Edit / Move / Fire menu currently sits under the name label, so it covers the character. The actions have to stay usable without hiding the agent or the label that identifies them.

## What Changes

- Place the hire action menu (and the relocate hint) so it does not overlap the character sprite.
- Keep the name / activity label fully visible at the same time — the menu must not cover the label either.
- No change to which actions exist, when they appear, or any REST contracts.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `agent-catalog`: the catalog agent action menu (and relocate hint) MUST leave both the character and its label unobstructed.

## Impact

- Webview overlay only: `ToolOverlay.tsx` (and constants if the vertical offset needs a tweak).
- No Embers API, office protocol, or form changes.
