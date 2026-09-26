## Context

See proposal.md for motivation and the delta specs for behavior.

The lower sidebar is a local-only textarea (`EmbersSidebar`) that never sends work. Catalog CRUD already uses REST via `VITE_EMBERS_API_BASE`. Office layout traffic uses a **different** socket (`wsApi` → localhost:3456). The Embers task guide (`embers-guia-front.md`) defines a third channel: `ws://…/ws` with `delegate` / `answer` out and `ack` / `error` / `ask` / `finish` in. Backend ids are UUIDs already mapped in `officeBridge`.

## Goals / Non-Goals

**Goals:**

- One Embers task socket client, reconnect with backoff, typed envelopes.
- Tasks Pane as the only front for that socket: log + composer.
- Composer mode: `delegate` unless the selected Ember has a pending `ask`, then `answer`.
- Apply office status from task messages (`working` / `waiting` / `idle`) without inventing a second status system.

**Non-Goals:**

- `expected_output` picker (send `null`).
- Renewing expired artifact URLs.
- Merging this socket with `wsApi`.
- Full celebration/confusion animation sequences beyond status + existing bubbles.
- Per-Ember filtered log (the log is office-wide; each row carries that Ember).

## Decisions

### 1. New client, new env, keep `wsApi` alone

Add `VITE_EMBERS_WEBSOCKET_BASE` (origin or full `ws://host:port/ws`; normalize to `/ws`). The guide’s `VITE_EMBERS_WEBSCOKET_BASE` typo is not the env name. Token, if present, is not required for the demo.

**Why not extend `wsApi`?** That socket is the office/layout bridge. Mixing task envelopes would break `useExtensionMessages`.

Reconnect: 1s, 2s, 4s … cap 30s. On open, pending `ask`s from the backend appear as incoming rows.

### 2. Envelope and log model

Outbound: `{ type, request_id, data }`. Inbound: `{ type, request_id, ts, task_id, agent_id, data }`. Generate `request_id` (short unique string). Keep a map `request_id → log row` so `ack` / `error` patch the same card.

Each log row: direction (out/in), type, ember display id (via `getDisplayId(agent_id)`), portrait, summary, status (`pending` / `acked` / `error`), payload excerpt. Colors: outgoing `--pixel-accent` (or green), incoming `--pixel-border-light` (or blue); `error` and failed `finish` use danger; `ask` uses the existing permission/waiting yellow.

### 3. Composer: one field, two verbs

If the selected Ember has a pending `ask`, Send (and option chips on that `ask` card) emit `answer`. Otherwise Send emits `delegate` with `agent_id` + `instruction`. Empty send is ignored. Disabled when `selectedAgentId` is null or is a sub-agent.

The pane still **appends** incoming events when disabled so reconnect `ask`s are not dropped; only send/answer controls are inert.

### 4. Office status from the guide

| Message | Office |
|---|---|
| `ack` delegate `working` | `setAgentActive(id, true)` |
| `ack` delegate `queued` | no pose change; mark the event queued |
| `ask` | waiting bubble (`bubbleType: 'waiting'`) + not active |
| `ack` answer | active, clear waiting bubble |
| `finish` | idle, clear bubble |

Track per-ember `current_task_id`, queued ids, and at most one pending ask (as the guide). Do not drive status from Embers REST `character_status` except as a later reconcile if the socket and office diverge.

### 5. UI split

Replace the lower `EmbersSidebar` section with `TasksPane`. Title **Tasks Pane**. Event list `flex: 1; overflow: auto`. Composer row: textarea + Send. Option buttons render on the latest pending `ask` for the selected Ember.

## Risks / Trade-offs

- [Task socket down] → Show a disabled/error hint on the pane; do not emit. Office REST still works.
- [Two WebSockets confuse debugging] → Keep names (`office` vs `embers`) and env vars separate.
- [Ack never arrives] → Outbound row stays pending; user can send again (new `request_id`).
- [Ask for an unselected Ember] → Log it; enable answering only after selecting that Ember.

## Migration Plan

1. Add env + types + socket client.
2. Replace the inert composer with Tasks Pane and the log.
3. Wire status updates from inbound messages.
4. Rollback: restore the inert Instructions textarea and drop the Embers WS client.

## Open Questions

None. `expected_output` and artifact re-download wait for a follow-up.
