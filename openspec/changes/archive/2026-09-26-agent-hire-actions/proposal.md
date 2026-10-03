## Why

Clicking a catalog agent currently opens the edit form immediately, and the toolbar still says `+ Agent`. People need a clear hire/manage vocabulary and a chance to relocate or archive without accidentally editing — Fire in particular must not persist until they confirm.

## What Changes

- Clicking an existing catalog agent opens a three-action menu: **Edit**, **Move**, and **Fire**. It no longer opens the edit form on that click.
- **Edit** opens the existing create/edit form for that agent.
- **Move** puts that agent into a relocate mode so the user can place it on the office layout.
- **Fire** archives the agent through the existing `DELETE` path, but only after a confirmation modal. Front copy uses Fire; REST contracts and payloads stay the same.
- The toolbar create control is renamed to **Hire** (tooltip: Hire Agent). It still opens the same create form.
- The overlay close control must not archive without that same confirmation.

## Capabilities

### New Capabilities

- None. This is catalog UX on top of the existing agent catalog.

### Modified Capabilities

- `agent-catalog`: click path becomes an action menu; create control is Hire; archive requires a Fire confirmation; Move persists the new seat/tile through the existing appearance write.

## Impact

- Webview UI only: `App.tsx`, `BottomToolbar.tsx`, `ToolOverlay.tsx`, `OfficeCanvas.tsx` / `OfficeState` relocate path, and a new action menu plus Fire confirm modal.
- Reuses existing `DELETE /agents/{id}` and `PUT /agents/{id}/appearance`. No Embers contract, client types, or Ember-server protocol changes.
- Sub-agents stay out of this menu. Debug close, if kept, must use the same Fire confirmation.
