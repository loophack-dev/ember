## Context

See proposal.md for motivation. Catalog CRUD already exists from `agent-rest-crud`:

- Hire/create still goes through `AgentFormModal` + `POST /agents`.
- Clicking a catalog character currently selects it and opens edit (`App.handleClick` / `handleSelectAgent`).
- Overlay `×` and debug close call `deleteAgent` immediately.
- The office already knows how to `reassignSeat`, `sendToSeat`, and `walkToTile`. Those moves are not written back to Embers (`putAppearance` exists but is unused). Seat clicks also still post `saveAgentSeats` to the Ember host.

Do not change Embers routes, payloads, or client types. Front copy only: Hire / Edit / Move / Fire.

## Goals / Non-Goals

**Goals:**

- Intercept catalog-agent click with a three-action menu before any form or archive.
- Reuse the existing form, `DELETE`, and `PUT /appearance` client methods.
- Persist Move through the existing appearance write (merge current cached appearance with new `seat_id` / `desk`).
- Require a Fire confirmation modal on every catalog archive path, including overlay `×` and debug close.

**Non-Goals:**

- New REST endpoints, status enums, or request-body fields.
- Changing `Character.id` or the visualization messages.
- Moving sub-agents or layout-edit furniture with this menu.
- Reworking right-click walk for agents that are only selected, not in Move mode.

## Decisions

### 1. Menu is an overlay on the selected catalog agent

Show Edit / Move / Fire as a small pixel popover anchored to the selected catalog character (same chrome family as `ToolOverlay` / `SettingsModal`). First click selects and opens the menu; it does not open the form.

**Why not open the form on first click?** That is the current behavior the user asked to replace.

**Why not a canvas context menu?** The three actions are the primary manage path, not a hidden right-click. Right-click walk can stay as a power gesture; it is not the Move action.

Dismiss the menu when the agent is deselected, another catalog agent is selected, layout edit mode starts, or the user opens Hire.

### 2. Edit / Fire / Hire stay on existing flows

- **Edit** sets `formMode` to `{ kind: 'edit', displayId }` and closes the menu.
- **Hire** is the toolbar label (`Hire`) with tooltip `Hire Agent`; it still opens create.
- **Fire** opens a confirm modal. Confirm calls the existing `deleteAgent` + `projectClosed` path. Cancel sends nothing.

Replace the overlay `×` immediate archive (and debug close) with the same confirm. Do not leave a second archive path that skips the modal.

Modal copy uses Fire (e.g. “Fire this agent?”). The HTTP method remains `DELETE`.

### 3. Move is an explicit relocate mode, then PUT appearance

Choosing Move sets a session flag (e.g. `relocatingAgentId`) and keeps the agent selected. The next valid target:

- free seat → existing `reassignSeat`
- walkable tile → existing `walkToTile` (and clear `seatId` when leaving a chair)

Then persist with `putAppearance(uuid, nextAppearance)`:

- Start from the cached `AgentOut.appearance` (palette, hue, avatar, etc.).
- Set `seat_id` to the new chair uid or `null`.
- Set `desk` to the target tile `{ x: col, y: row }`.

Update the cache from the PUT response. Do not invent a new appearance schema.

**Why not persist on every current seat click / right-click walk?** Those gestures exist today without a write. The user asked for an explicit Move action; only that path must persist. Avoid surprise PUTs from casual selection.

**Why not PATCH the agent?** Appearance is already a dedicated PUT. The user forbade contract changes.

Cancel relocate with Escape, deselect, choosing another menu action, or starting layout edit. A failed PUT leaves the in-office position and surfaces the existing catalog error banner.

Do not send `saveAgentSeats` for catalog Move; `ui_settings.data` is the store.

### 4. Sub-agents and layout edit stay excluded

Sub-agents keep today’s select/hover overlay and never get Edit / Move / Fire. In layout edit mode, canvas clicks stay on furniture tools; the hire menu does not open.

## Risks / Trade-offs

- [User expects any selected-agent seat click to persist] → Only Move persists. Document in the menu: choosing Move is what enables placement.
- [PUT appearance fails after a successful walk] → Character stays on the new tile; banner shows the error; next successful Move retries the write.
- [Stale cached appearance missing desk/palette] → Merge defensively: keep known keys, always write `seat_id` and `desk` for the new placement.
- [Overlay `×` users lose one-click archive] → Intentional; Fire confirm is required.

## Migration Plan

1. Ship the menu, Hire label, Fire modal, and Move persist in the webview only.
2. No backend deploy and no env-var changes.
3. Rollback: revert the UI change; catalog records and appearance writes already performed stay in Embers.

## Open Questions

None. Button label is **Hire** with tooltip **Hire Agent**. Fire is front copy only for the existing archive delete.
