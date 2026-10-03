## Why

The office currently fills the whole webview. People need a persistent roster of who is in the office, with status and the same Edit / Fire actions, plus a place that will later take instructions — without covering the floor or inventing a second product vocabulary.

## What Changes

- The existing office UI (canvas, overlays, Hire / Layout / Settings, editor chrome) occupies the left **80%** of the webview width.
- A right-hand **20%** column is split in half:
  - **Top — Embers:** a scrollable contact-style list of catalog embers currently in the office. Each row shows a portrait (character sprite when available, otherwise a circle with the name initial), name, role, office status as the same colored dot used on the name pill, and **Edit** / **Fire**.
  - **Bottom — instruction input:** a visual composer to assign instructions to embers. This change ships the chrome only; sending instructions is out of scope.
- User-visible UI copy MUST say **Ember** / **Embers**, not Agent or Agente. REST paths, types, and code identifiers stay as they are.
- Overlay Edit / Move / Fire on the selected character stay. The list adds Edit and Fire only (Move stays on the office).

## Capabilities

### New Capabilities

- `embers-sidebar`: 80/20 office + sidebar shell; Embers roster; visual-only instruction composer.

### Modified Capabilities

- `agent-catalog`: user-facing Agent/Agente copy becomes Ember; Edit and Fire are also available from the Embers list and reuse the existing form and Fire confirmation.

## Impact

- Webview layout and chrome only: `App.tsx` shell, a new sidebar component, catalog cache for role, existing `statusDot` signals, sprite portrait helper, and user-visible strings in Hire tooltip, form titles, Fire confirm, overlay fallbacks, and Debug View.
- No Embers REST, appearance, or protocol changes. Instruction submit is not wired.
