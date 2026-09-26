## 1. Embers backend client

- [x] 1.1 Add `webview-ui/.env.example` with `VITE_EMBERS_API_BASE` and optional `VITE_EMBERS_API_TOKEN`
- [x] 1.2 Create `webview-ui/src/embers/` config that reads those env vars and fails with a configuration error when the base URL is missing (no hardcoded host, no network call)
- [x] 1.3 Add TypeScript types for Embers agent/provider/tool contracts (`AgentCreate`, `AgentUpdate`, `AgentOut`, `Appearance`, list `{ items }`, `ErrorBody`) using `snake_case` and preserving `null`
- [x] 1.4 Implement the shared `fetch` wrapper: optional `Authorization`, JSON encode/decode, map `{ error }` bodies (including 422 `details`), treat network/non-JSON as a readable `internal_error`, treat `204` as success with no body
- [x] 1.5 Expose client operations: list agents (no `include_archived=true` by default), get, create, patch, delete, put appearance, list providers, list tools
- [x] 1.6 Confirm no Embers paths (`/agents`, `/providers`, `/tools`) exist outside `webview-ui/src/embers/`

## 2. Visualization protocol and office bridge

- [x] 2.1 Extend `useExtensionMessages` so `existingAgents` adds characters immediately when the layout is already ready, using `agentMeta` for palette, hue, and seat
- [x] 2.2 Allow optional `palette`, `hueShift`, and `seatId` on `agentCreated` and pass them to `OfficeState.addAgent`
- [x] 2.3 Implement `officeBridge` with session maps UUID ↔ numeric display id, dispatch `existingAgents` / `agentCreated` / `agentClosed` as window messages, and put `AgentOut.name` in `folderName`
- [x] 2.4 Map stored appearance (`palette`, `hue_shift`, `seat_id`) into `agentMeta` when hydrating; skip `saveAgentSeats` for catalog agents

## 3. Random appearance

- [x] 3.1 Add an appearance generator that picks a diverse palette/hue (same rules as current office palettes) and a free seat, or a walkable tile when no seat is free
- [x] 3.2 Shape the payload as `{ avatar, color, desk: {x,y}, palette, hue_shift, seat_id }` with tile coordinates; do not collect appearance in the form

## 4. Create and edit form

- [x] 4.1 Build one modal (create + edit) styled like `SettingsModal` with fields: name, provider, model, role, optional persona/tone/instructions, tools; no appearance controls
- [x] 4.2 Load provider and tool choices from the client when the form opens; default create tools to all returned ids
- [x] 4.3 Validate name (1–60), provider, model_id, role (1–80), and instructions ≤ 8000 before calling the client
- [x] 4.4 Create: generate appearance, `POST /agents` through the client, project via the bridge, close on success; keep the form open and show mapped errors on failure
- [x] 4.5 Edit: populate from cached `AgentOut` or `GET /agents/{id}`, `PATCH` without appearance, update the office label if the name changed, close on success

## 5. Catalog UX and bootstrap

- [x] 5.1 Change `+ Agent` to open the create form; remove Claude launch and workspace-folder picker from that button
- [x] 5.2 After `layoutReady`, list active agents through the client and hydrate via the bridge; show a readable error if the list fails without adding characters
- [x] 5.3 Open the edit form when the user clicks a catalog character
- [x] 5.4 Wire overlay close to `DELETE /agents/{id}` through the client, then `agentClosed`; keep the character and show the error if archive fails

## 6. Stop JSONL membership

- [x] 6.1 Stop starting or emitting `agentCreated` / `agentClosed` from `JsonlWatcher` in `server/index.ts`; keep asset/layout WebSocket behavior
- [x] 6.2 Remove UI dependence on `openClaude`, `focusAgent`, and `closeAgent` for catalog CRUD

## 7. Verification

- [x] 7.1 Exercise create (with and without a free seat), edit, archive, reload hydrate, missing env, and a 422 — using the running Embers API when available
- [x] 7.2 If the Embers API is unavailable, verify the client/form error paths and that the office still loads assets/layout
