## Context

See proposal.md for motivation. Today Ember has two stacks that this change must keep apart:

- **Office runtime** (`server/index.ts`, `wsApi.ts`, `useExtensionMessages`, `OfficeState`): WebSocket messages with numeric display ids, layout/assets, and character simulation. `+ Agent` currently launches Claude.
- **Embers backend** (external): UUID agents, `snake_case` REST, `appearance` stored opaquely in `ui_settings.data`.

The frontend already redispatches server WebSocket frames as `window` `message` events. That is the stable visualization protocol this change will keep. The current Ember server must stop being the agent registry; it stays the asset/layout host.

`Character.id` is a number threaded through renderer, labels, overlays, and selection. Backend ids are UUID strings. Those two identities cannot be collapsed in this change without rewriting the simulation.

## Goals / Non-Goals

**Goals:**

- Isolate every Embers HTTP call in one UI-side client module.
- Keep `OfficeState` / `useExtensionMessages` as the only office mutators, fed by the existing message discriminants.
- Make create and edit one form; generate appearance only on create.
- Stop JSONL-driven membership without deleting the office server.

**Non-Goals:**

- Implementing the Embers API, database, or its WebSocket bus.
- Memory CRUD or `PUT /appearance` from the form (the client still exposes PUT for later).
- Changing `Character.id` to UUID.
- Proxying Embers routes through `server/index.ts`.
- Editing seats/palettes in the form.

## Decisions

### 1. Client lives in the webview, not in the Ember server

Put the client under `webview-ui/src/embers/` (config, types, `fetch` wrapper, agent/provider/tool methods). The browser calls `VITE_EMBERS_API_BASE` directly.

**Why not a server proxy?** The user forbade administering agents from the current Ember server. A proxy would re-couple Ember-server to Embers routes and leak that contract into `server/index.ts`. CORS is the backend’s problem; document that the UI origin must be allowed.

**Why not a shared Node package?** There is no second Ember consumer yet. A folder inside `webview-ui` is enough and keeps the boundary obvious: nothing outside `embers/` imports Embers URLs.

### 2. Bridge translates `AgentOut` → existing office messages

A catalog/bridge module (also allowed to sit beside the client, e.g. `webview-ui/src/embers/officeBridge.ts`) owns:

- Session map `backendUuid → displayId` (monotonic integers, starting at 1).
- Reverse map for edit/archive from a clicked character.
- Dispatch of `existingAgents` / `agentCreated` / `agentClosed` via the same `window` `message` path `useExtensionMessages` already consumes.

`useExtensionMessages` remains the office mutator. Two compatible extensions are required because the current hook cannot restore appearance after layout is ready:

- If `layoutReady` is already true, `existingAgents` must call `addAgent` immediately with `agentMeta` (today it only buffers for a future `layoutLoaded`).
- `agentCreated` may carry optional `palette`, `hueShift`, `seatId` so create can spawn with the generated look. `folderName` carries `AgentOut.name` so labels work without a new overlay field.

**Why not call `OfficeState.addAgent` from the form?** That bypasses the protocol we were asked to keep and duplicates membership state (`agents[]` in React vs `characters`).

**Why not adopt the Embers WebSocket (`hello`, `office.snapshot`)?** Out of scope. REST is the catalog source for this change.

### 3. Appearance JSON is Ember-owned and opaque to the backend

On create, generate and send:

```json
{
  "avatar": "palette-2",
  "color": "#4488CC",
  "desk": { "x": 3, "y": 11 },
  "palette": 2,
  "hue_shift": 0,
  "seat_id": "off1-chair-a"
}
```

`desk.x/y` are tile coordinates. `seat_id` is the chair uid when a free seat exists; otherwise `seat_id` is `null` and `desk` is a walkable tile. Palette selection reuses the existing diverse-palette rules (unique 0–5, then hue ≥ 45°).

Do not write `~/.pixel-agents/agent-seats.json` for catalog agents. `ui_settings` is the durable store. Seat reassignment in the office is not synced back in this change.

### 4. Form fields and actions

One modal, two modes. Visual language follows `SettingsModal` (pixel chrome, centered).

| Field | Create | Edit |
|---|---|---|
| name | required | required |
| provider + model_id | required, from `GET /providers` | required |
| identity.role | required | required |
| persona, tone, instructions | optional | optional |
| tools | multi-select from `GET /tools`; default all returned ids | current `AgentOut.tools` |
| appearance | hidden; generated | hidden; not patched |

`+ Agent` opens create. Clicking a catalog character (or an explicit edit control) opens edit with `GET /agents/{id}` when the cache is stale. The existing overlay close control archives via `DELETE`. Model params (`temperature`, `max_tokens`, `top_p`) are omitted from the first form; the client still accepts them in types.

### 5. Ember server stops emitting agent membership

Remove or no-op `fileAdded` → `agentCreated` and `fileRemoved` → `agentClosed`. Prefer not starting `JsonlWatcher` so stale transcripts cannot race the catalog. Keep `webviewReady` asset/layout/`existingAgents` (empty list) behavior.

`focusAgent` / `openClaude` / `closeAgent` server handlers are unused for catalog agents; the UI must not depend on them for CRUD.

### 6. Environment

| Variable | Required | Use |
|---|---|---|
| `VITE_EMBERS_API_BASE` | yes | Origin only, no trailing path, e.g. `http://localhost:8000` |
| `VITE_EMBERS_API_TOKEN` | no | Raw `Authorization` header value |

Add `.env.example` in `webview-ui`. Vite inlines `VITE_*` at build time.

## Risks / Trade-offs

- [CORS or backend down] → Client surfaces a readable error; office assets still load. No silent empty office without a message after a failed list.
- [Display ids reset on reload] → Acceptable; UUID + appearance persist. Do not persist display ids.
- [Empty `existingAgents` from Ember server races catalog hydrate] → Hydrate only after `layoutReady`; ignore empty server membership.
- [Appearance shape will evolve] → Keep extra Ember keys (`palette`, `seat_id`) now so later UI can edit without a migration.
- [Watcher leftover code] → Leaving files unused is cheaper than a rewrite; membership must be disabled, deletion can wait.

## Migration Plan

1. Ship client + form + bridge behind the existing UI.
2. Set `VITE_EMBERS_API_BASE` locally before `npm run dev`.
3. Disable JSONL membership in the same change so two sources cannot spawn duplicates.
4. Rollback: revert the change and restore watcher membership; Embers rows remain in the backend.

## Open Questions

- Whether later appearance editing should call `PUT /agents/{id}/appearance` on every seat drag, or only from a dedicated UI. Does not affect this change’s tasks.
