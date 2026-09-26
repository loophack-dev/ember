## Why

The sidebar instruction box is chrome only. People now need to send work to a selected Ember over the Embers WebSocket, see every inbound and outbound event, and answer questions — without mixing this channel with the office layout socket.

## What Changes

- Rename the lower sidebar section from Instructions to **Tasks Pane**.
- Split that pane: **event log** above, **chat composer + Send** below.
- The Tasks Pane (composer and interactive answers) is enabled only when a catalog Ember is selected; otherwise the whole section looks and behaves disabled.
- Sending an instruction emits a WebSocket `delegate` for the selected Ember. Answering an `ask` emits `answer`.
- Incoming `ack`, `error`, `ask`, and `finish` appear in the event log with a distinct style, direction color, and that Ember’s portrait. `ack` updates the matching outbound row and the Ember’s office status.
- Connect to the Embers task socket (`VITE_EMBERS_WEBSOCKET_BASE`), separate from the existing office/layout WebSocket.

## Capabilities

### New Capabilities

- `tasks-pane`: Tasks Pane UI, Embers task socket, event log, delegate/answer, and office status from task messages.

### Modified Capabilities

- `embers-sidebar`: the lower half is no longer a visual-only instruction field; it is the Tasks Pane described above.

## Impact

- Webview: `EmbersSidebar` lower half, a new Embers WS client and types, env (`VITE_EMBERS_WEBSOCKET_BASE`), event-log state, and office character status from `ack` / `ask` / `finish`.
- Does not change REST catalog CRUD, the office layout socket (`wsApi`), or Hire / Edit / Fire.
- Artifact download refresh (`GET /artifacts/{id}/download`) is out of scope except showing `download_url` on a `finish` row when present.
