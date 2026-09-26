## Why

Status dots already follow `character_status` after inbound task messages, but they stay idle until the backend answers. Sending work or an answer does not update the Ember’s color, so the label lags behind what the user just did.

## What Changes

- When the office **emits** `delegate` or `answer` for an Ember, that Ember’s status (and label/list dots) becomes `working` (yellow) immediately.
- When the office **receives** task events, keep the same three colors: `ack` working → yellow, `ask` → waiting (blue), `finish` → idle (gray) or working if more tasks are queued, `error` on that send → idle if the Ember has no other work.
- `ack` with `queued` still does not change color (the Ember is already busy).
- Pose and busy-lock stay tied to the same status map (sit when not idle).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `character-status`: Status (and therefore dots) MUST update from both outbound task messages we emit and inbound messages we receive, not only from `GET /agents` and inbound `ack` / `ask` / `finish`.

## Impact

- `useEmbersTasks` `sendDelegate` / `sendAnswer` must call the same status + pose path as inbound handlers.
- Inbound `error` for a rejected `delegate` must revert idle when nothing else is queued.
- `statusDot` needs no new colors; it already reads the shared map.
- Apply MUST NOT start Vite or the office server; the user verifies locally.
