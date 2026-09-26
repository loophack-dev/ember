## 1. Embers task socket

- [x] 1.1 Add `VITE_EMBERS_WEBSOCKET_BASE` to config and `.env.example`
- [x] 1.2 Add typed envelopes (`delegate`, `answer`, `ack`, `error`, `ask`, `finish`) and a reconnecting client separate from `wsApi`

## 2. Tasks Pane UI

- [x] 2.1 Replace the Instructions block with Tasks Pane: event log above, chat composer + Send below
- [x] 2.2 Disable the pane (composer, Send, answers) unless a catalog Ember is selected
- [x] 2.3 Send a `delegate` for the selected Ember and append an outgoing log row with that Ember’s portrait

## 3. Event log and answers

- [x] 3.1 Render inbound `ack`, `error`, `ask`, and `finish` with distinct colors/styles and the related Ember portrait
- [x] 3.2 Patch outbound rows on `ack` / `error`; apply office working / queued / waiting / idle from those messages
- [x] 3.3 When the selected Ember has a pending `ask`, send `answer` (option or free text) and clear the question after ack

## 4. Verification

- [x] 4.1 Confirm the pane is disabled with no selection and sends `delegate` only when an Ember is selected
- [x] 4.2 Confirm outgoing vs incoming rows are distinct and each shows the Ember portrait
- [x] 4.3 Confirm `ack` updates the outbound row and Ember status, and `error` marks the send as rejected
- [x] 4.4 Confirm an `ask` can be answered and a `finish` appears as a distinct incoming row
