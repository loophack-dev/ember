---
type: "Reference"
title: "Quickstart"
openwiki_generated: true
verified:
  - by: openwiki/0.6.0
    at: 2026-09-26T16:48:54.278Z
sources:
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-836ff16d1e225fc08ce032d8
    resource: repo://server/index.ts
  - id: openwiki-source-36e171888d4401474d56af4a
    resource: repo://server/parser.ts
  - id: openwiki-source-abd2753e9e0f8ae553b152d6
    resource: repo://server/types.ts
  - id: openwiki-source-a9ca09cef7e84e21c8dad70e
    resource: repo://server/watcher.ts
  - id: openwiki-source-da6fff1366af1febda65e23b
    resource: repo://webview-ui/src/wsApi.ts
generated: { by: "openwiki/0.6.0", at: "2026-09-26T16:48:54.278Z" }
---


Pixel Agents Standalone is a local browser visualization for Claude Code sessions. Its standalone boundary is important when planning a change: the Node server discovers and interprets Claude JSONL transcripts, while the React/Vite client renders and edits the pixel office over a WebSocket connection. Use this page to get a working environment, choose the documentation for the subsystem you will change, and apply the minimum safety checks before delivery.

## Start here

There are two npm projects. Install dependencies at the repository root **and** in `webview-ui/`, then build and run the packaged application:

```bash
npm install
cd webview-ui && npm install && cd ..
npm run build
npm start
```

Open `http://localhost:3456`. The server watches `~/.claude/projects/` for Claude JSONL sessions; an active session should appear as an agent in the office. Use `npm run dev` for an interactive change: it starts the server through `tsx watch` and the UI through Vite concurrently. The development browser client connects to `ws://localhost:3456`, so keep that server reachable when changing `PORT` or developing remotely.

Before submitting a change, run the relevant build/lint checks and a scenario that crosses the boundary you modified:

```bash
npx tsc --noEmit
cd webview-ui && npm run lint && npm run build
cd .. && npm run build
```

The repository has no project-owned test script or first-party test suite. Compilation and linting are therefore checks for integration/type/build errors, not proof of parser, protocol, editor, or rendering behavior. See [Validation Strategy and Change Safety](/openwiki/testing/validation-and-change-safety.md) for the focused manual matrix.

## Choose the change path

| If your task concerns… | Start with | Key boundary to preserve |
| --- | --- | --- |
| Server startup, browser connection/reconnection, initial data ordering, WebSocket messages, shared state, or persistence | [Runtime Topology and WebSocket Protocol](/openwiki/architecture/runtime-and-protocol.md) | The browser adapter converts socket frames to the inherited `window` message interface. Bootstrap sends assets, then `existingAgents`, then `layoutLoaded`; agents are buffered until seats exist. |
| Claude JSONL discovery, parser semantics, activity/waiting/permission timers, tool results, or Task subagents | [Claude Transcript to Agent Visualization](/openwiki/workflows/transcript-to-agent-visualization.md) | Tailing must retain incomplete lines, and parser events must agree with the `ServerMessage` contract and UI handler. |
| Canvas simulation, tile/furniture changes, pathing, chairs/seats, editor actions, saved office compatibility, or cross-tab edits | [Office Layout, Editing, and Simulation Invariants](/openwiki/concepts/office-layout-and-simulation.md) | `OfficeLayout` is durable input; rebuild all derived state from it. Preserve row-major dimensions, furniture UIDs where seat identity matters, and the dirty-editor protection. |
| Local development, release layout, `dist/`, static files, asset loading/fallbacks, persistent files, or tileset extraction | [Development, Distribution, Persistence, and Assets](/openwiki/operations/development-build-and-assets.md) | Package `dist/server.js` with sibling `dist/public/`; server assets are decoded at startup and require restart/rebuild to refresh. |
| Claude filesystem assumptions, project names, SessionStart configuration, or the CMUX launcher | [Claude Code Session Integration and Auto-Launch](/openwiki/integrations/claude-code-sessions-and-autolaunch.md) | The integration consumes local `~/.claude/projects/` transcript files; the hook launches a built local service rather than adding a Claude transport API. |
| What commands and manual checks are appropriate for a patch | [Validation Strategy and Change Safety](/openwiki/testing/validation-and-change-safety.md) | Select the checks for the changed boundary; builds alone do not exercise time-dependent parser or visual editor behavior. |

## A safe first-change workflow

1. **Classify the symptom or requirement by its first boundary.** For a missing character, determine whether the JSONL file was discovered, a parser event was emitted, the server broadcast it, the WebSocket frame arrived, or the UI applied it. Server logs, browser WebSocket frames, and the in-app debug view help locate the first absent transition.
2. **Read the route page before changing a wire or persisted shape.** In particular, messages span `server/types.ts`, server producers/receivers, `wsApi.ts`, and the UI message hook. Layouts also span editor actions, `OfficeState` rebuild logic, server persistence, and new-client initialization.
3. **Make the narrow change and run the local gate.** Use the commands above; rebuild the production artifact when a change affects packaging, public assets, or server/UI coupling.
4. **Manually reproduce the lifecycle you changed.** Reconnect for initial-sync changes, append representative complete and split JSONL records for watcher/parser changes, and save/reload—including a second tab where relevant—for layout changes. Observe timer paths rather than treating an immediate UI state as conclusive.
5. **Check state that survives or outlives the process.** Back up or use disposable `~/.pixel-agents/layout.json` and `agent-seats.json` when testing persistence. Agent IDs restart with the server, so seat metadata keyed by those IDs is not permanent Claude-session identity.

## Operational orientation

The root build bundles `server/index.ts` into `dist/server.js`, builds the UI into `dist/public`, and copies `webview-ui/public/assets` into that public directory. At runtime, the server serves its production public directory and runs a WebSocket server on the same HTTP server. It loads source-tree assets when available during development and otherwise loads packaged assets; missing optional asset classes are omitted from the initialization stream so the UI can use its fallbacks.

The server maintains in-memory agents keyed by Claude session ID, assigns display IDs sequentially, and tracks browser sockets. Its watcher performs an initial scan for recently modified session files, catches up from byte offset zero, then polls tracked files for appended complete lines. It removes a session when the transcript becomes stale, missing, or unreadable. These details explain common reports: a transcript must be recent to be discovered initially, an incomplete final JSONL line deliberately waits for its newline, and restarting the server reconstructs live sessions but resets transient display/activity state.

## High-value guardrails

- **Do not reorder initial synchronization casually.** The client needs the office layout to derive seats before it can apply buffered existing agents and their saved seat IDs.
- **Treat WebSocket `type` values as a cross-process contract.** Runtime JSON parsing does not validate message schemas. A new event needs compatible type definitions, server production, client handling, and a reconnect/bootstrap decision.
- **Treat layout edits as a full rebuild problem.** Tile maps, blocked tiles, seats, furniture instances, and walkable tiles are projections. Modify the serialized layout through the editor/layout path, then rebuild rather than patching a projection in isolation.
- **Test packaged assets separately from development assets.** The server chooses an asset root at startup; public asset changes need a server restart in development and a new build for `dist/`.
- **Expect local-only integration behavior.** The service uses an unauthenticated `ws://` connection and watches the current user’s Claude directory. Do not expose it as a remote service without designing the missing transport/security controls.

## Related documentation

- [Runtime Topology and WebSocket Protocol](/openwiki/architecture/runtime-and-protocol.md) — process topology, protocol, startup ordering, and connection behavior.
- [Claude Transcript to Agent Visualization](/openwiki/workflows/transcript-to-agent-visualization.md) — JSONL record-to-agent-event lifecycle.
- [Office Layout, Editing, and Simulation Invariants](/openwiki/concepts/office-layout-and-simulation.md) — durable layout model and canvas simulation rules.
- [Development, Distribution, Persistence, and Assets](/openwiki/operations/development-build-and-assets.md) — build artifact, asset contracts, persistent files, and recovery.
- [Claude Code Session Integration and Auto-Launch](/openwiki/integrations/claude-code-sessions-and-autolaunch.md) — watcher assumptions and SessionStart launcher setup.
- [Validation Strategy and Change Safety](/openwiki/testing/validation-and-change-safety.md) — focused validation scenarios for each subsystem.
