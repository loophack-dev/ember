## Why

Ember labels still infer office activity (tools, `isActive`, permission bubbles) instead of the backend `character_status` (`idle` | `working` | `waiting`). Busy Embers can still be moved, edited, or fired, and a finished task with files has no way to open those documents from the Tasks Pane.

## What Changes

- Drive the Ember name-label and Embers-list status dots from `character_status`: idle gray, waiting blue, working yellow.
- Hydrate that status from `GET /agents` and keep it in sync with task-socket `ack` / `ask` / `finish`.
- When an Ember is `working` or `waiting`, walk them to the nearest chair and sit; when `idle`, stand them up.
- Disable Edit, Move, and Fire (and canvas walk/relocate) while not idle. Selection stays allowed so more work can still be sent.
- On a `finish` event, show a scrollable row of buttons named from each artifact `title` that open the artifact URL.

## Capabilities

### New Capabilities

- `character-status`: Office pose and interaction lock from Embers `character_status` (`idle` / `working` / `waiting`).

### Modified Capabilities

- `agent-catalog`: The permanent name-label status dot uses `character_status` colors (idle gray, waiting blue, working yellow) instead of office-tool activity.
- `embers-sidebar`: The list status dot matches those colors. Edit, Move, and Fire are disabled while the Ember is not idle; the row remains selectable.
- `tasks-pane`: A `finish` row shows artifact download buttons (filename = `title`) in a scrollable strip when `artifacts` is non-empty.

## Impact

- Types: `CharacterStatus` must match the guide (`idle` | `working` | `waiting`).
- `statusDot`, office name labels, and `EmbersSidebar` read catalog `character_status` (plus live task updates).
- `officeState` / character poses: nearest-seat walk + sit for busy, stand for idle; ignore user walk/relocate while busy.
- `TasksPane` / `useEmbersTasks`: parse `finish.data.artifacts` and render download buttons.
- Expired URLs use `GET /artifacts/{id}/download` as in the front guide.
- No new npm dependencies. User will verify locally; apply MUST NOT start Vite or the office server.
