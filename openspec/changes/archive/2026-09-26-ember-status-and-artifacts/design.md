## Context

See proposal.md for why. Labels and the Embers list still use `statusDot` from office tools / `isActive` / permission bubbles. `CharacterStatus` in `types.ts` still lists `thinking` | `writing` | `done` | `error`; the front guide and `GET /agents` use `idle` | `working` | `waiting`. `useEmbersTasks` already maps socket events to office `setAgentActive` / `setTaskWaiting`, but does not persist `character_status` or force sit/stand. `sendToSeat` exists for an assigned seat; there is no “nearest free chair” helper. Finish rows store `result_text` only — `TaskLogRow` has no artifacts.

## Goals / Non-Goals

**Goals:**

- One shared `character_status` per catalog Ember, hydrated from REST and patched by the task socket.
- Same three colors on the office name label and the Embers row.
- Busy → walk to a chair and sit; idle → stand immediately.
- Disable Ember Edit / Move / Fire and canvas walk/relocate while not idle; keep selection and Tasks Pane send.
- Finish artifacts as titled buttons in a scrollable strip, with expired-URL refresh.

**Non-Goals:**

- Starting Vite or the office server during apply (the user verifies locally).
- In-webview markdown preview of `md` artifacts (buttons download / open the URL).
- Changing Hire, Layout furniture editing, or queued-task counters on the sprite.
- Writing `character_status` back to Embers REST.

## Decisions

1. **`character_status` is the only label signal**  
   Narrow `CharacterStatus` to `idle` | `working` | `waiting`. Keep a map (backend id and display id) updated on catalog hydrate and on `ack` / `ask` / `finish`. `statusDot` reads that map, not tools.  
   *Alternative:* keep tool-based dots and overlay `character_status` — rejected; the user asked for the real backend status.

2. **Colors reuse existing tokens**  
   Idle → `--pixel-text-dim` (gray). Waiting → `--pixel-status-active` (blue). Working → `--pixel-status-permission` (yellow). Pulse only while `working`.  
   *Alternative:* new CSS tokens — unnecessary; the palette already matches the request.

3. **Nearest chair prefers the assigned seat**  
   If the Ember has a `seatId`, walk there. Otherwise pick the closest unoccupied seat by tile distance, assign it, and `sendToSeat`. Waiting sits (still on a task). Idle clears the sitting pose immediately (skip the inactive `seatTimer` delay) and does not auto-wander as part of this change.  
   *Alternative:* always steal the geometrically nearest seat — rejected; it would unseat another Ember.

4. **Busy lock is UI-only**  
   Edit / Move / Fire (overlay and list) and canvas walk / relocate no-op when status ≠ `idle`. Selection, camera follow, and Tasks Pane `delegate` stay enabled. Layout-editor furniture tools are unchanged.  
   *Alternative:* lock selection — rejected; the user still needs to send tasks.

5. **Artifact buttons on the finish row**  
   Parse `finish.data.artifacts` into the log row. Each item with a `title` and `download_url` (or `id`) is a button. Horizontal overflow scrolls. Click opens `download_url`; if `url_expires_at` is past, `GET /artifacts/{id}/download` then open the fresh URL.  
   *Alternative:* only show the first file — rejected; the user asked for scroll when there are several.

6. **Apply does not run the app**  
   Tasks that would have been “verify in the browser” are marked done only after the user confirms, or they stay as a short manual check the user owns.

## Risks / Trade-offs

- [REST and socket disagree] → `GET /agents` wins on hydrate; socket events win afterwards. Queued `ack` does not change status (guide).
- [No free chair] → sit / type in place (existing no-seat behavior); still lock Edit / Move / Fire.
- [Expired download in a hosted webview] → follow the refresh GET; if it fails, leave the button and show the error on that row.

## Migration Plan

Ship with the webview. No data migration. Rollback is revert of the status map, pose hooks, and finish-row buttons.

## Open Questions

None. Waiting-sits-as-busy, assigned-seat-first, and no apply-time server start are recorded above.
