## Context

See proposal.md for why. `ember-status-and-artifacts` already hydrates `character_status` and patches it on inbound `ack` / `ask` / `finish`. `sendDelegate` and `sendAnswer` only append a log row; they do not call `applyOffice`. Dots already read the shared map, so they will move as soon as emit sets `working`.

## Goals / Non-Goals

**Goals:**

- One `applyOffice` path for both emit and receive.
- Immediate yellow on successful send of `delegate` or `answer`.
- `error` on that request returns idle when the Ember has no other task.

**Non-Goals:**

- A fourth “pending” color.
- Changing the gray / blue / yellow tokens.
- Starting Vite or the office server during apply.

## Decisions

1. **Optimistic `working` on emit**  
   After `sendEmbersTask` returns true, set `working` and apply pose. Do not wait for `ack`.  
   *Alternative:* wait for inbound only — rejected; the user asked for colors on what we emit.

2. **Reuse `applyOffice`**  
   `sendDelegate` / `sendAnswer` call `applyOffice(id, 'working')`. Inbound handlers stay as they are, plus `error` → idle when `queuesRef` and `currentTaskRef` are empty for that Ember.  
   *Alternative:* a separate emit-only helper — rejected; pose and lock must stay in sync.

3. **Queued ack still no-ops**  
   If we already set working on emit, a later `queued` ack leaves yellow, which matches “already busy.”

## Risks / Trade-offs

- [Optimistic working then `error`] → revert idle only if no current/queued task; otherwise keep working.
- [Answer emit while waiting] → yellow immediately; inbound answer `ack` confirms working.

## Migration Plan

Ship with the webview. Rollback is removing the emit-side `applyOffice` calls.

## Open Questions

None.
