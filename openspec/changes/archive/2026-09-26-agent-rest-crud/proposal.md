## Why

Ember already visualizes agents in the office, but their lifecycle still comes from Claude Code JSONL files and the local watcher. The hackathon backend now owns agents as durable records (plus `ui_settings` appearance JSON), so Ember must create, list, edit, and archive them over REST without coupling the office UI to that backend.

## What Changes

- Add a **new decoupled backend client layer** as the only code that knows the Embers REST host, routes, payloads, and errors.
- Read the backend host (and optional static auth token) from environment variables.
- Implement agent CRUD against:
  - `GET` / `POST` `/agents`
  - `GET` / `PATCH` / `DELETE` `/agents/{id}`
  - `PUT` `/agents/{id}/appearance`
- Replace the `+ Agent` flow that launches Claude with a create/edit form. The same form serves both modes.
- On create, generate a random appearance and office position and send it as `appearance` so the backend stores it in `ui_settings.data`. Appearance fields stay out of the form for now.
- After a successful REST call, project the agent into the office through the **existing** client protocol (`agentCreated`, `existingAgents`, `agentClosed`, and related messages) so `OfficeState` and overlays keep working.
- Stop treating Claude JSONL discovery as the source of agent membership.

**Out of scope:** memory CRUD, the new backend WebSocket command/event bus (`hello`, `task.create`, `office.snapshot`, …), editing appearance in the form, and removing the current Ember server’s asset/layout transport.

## Capabilities

### New Capabilities

- `embers-backend-client`: Isolated REST client for the Embers backend. Owns base URL, optional auth header, agent/provider/tool contracts, and error mapping. UI and office simulation never call `fetch` against Embers.
- `agent-catalog`: Agent create/list/edit/archive UX, random appearance on create, and projection of `AgentOut` records into the office via the existing visualization protocol.

### Modified Capabilities

- None. `openspec/specs/` has no existing capabilities.

## Impact

- **Frontend:** `webview-ui` gains a backend client module, an agent form modal, and a catalog bootstrap on load. `BottomToolbar` `+ Agent` opens the form instead of `openClaude`. Click-to-edit and archive replace Claude-terminal focus/close for catalog agents.
- **Protocols kept:** existing window/WebSocket message shapes used by `useExtensionMessages` and `OfficeState` stay the visualization contract. The adapter translates UUID `AgentOut` records into those messages.
- **Current Ember server:** remains the office asset/layout/WebSocket host. It no longer creates or closes agents from `~/.claude/projects` JSONL files.
- **New backend:** assumed already running. Ember does not implement Supabase tables or REST handlers. CORS must allow the Ember UI origin, or the configured host must be reachable from the browser.
- **IDs:** backend agents are UUIDs; office characters stay numeric display IDs. The adapter owns that mapping for a session.
- **Env:** `VITE_EMBERS_API_BASE` (required host, e.g. `http://localhost:8000`) and optional `VITE_EMBERS_API_TOKEN`.
