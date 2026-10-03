## Context

See proposal.md for motivation and the delta specs for behavior.

`App.tsx` is a full-bleed relative root: `OfficeCanvas`, `ToolOverlay`, zoom, Hire / Layout / Settings, and editor chrome all share one `containerRef`. Overlay screen positions are computed from that box, so the ref MUST stay on the office pane after the split.

Catalog members already live in `agents[]` plus `officeBridge` (`getCachedAgent` has `identity.role`). Office status already exists as the overlay `statusDot` helper (approval / active+tools / idle). Character pixels are available through `getCharacterSprite` + `getCachedSprite`.

## Goals / Non-Goals

**Goals:**

- Split the webview 80/20 without breaking overlay math, camera, or hire actions.
- One shared status-dot helper for the name pill and the Embers list.
- Portrait from an existing idle sprite frame, with an initial-circle fallback.
- User-visible Agent/Agente → Ember with no REST or identifier rename.

**Non-Goals:**

- Wiring the instruction composer to any API or task queue.
- Showing Move in the list, or listing sub-agents.
- Renaming TypeScript types, hooks, or `/agents` paths.
- Responsive collapse of the sidebar.

## Decisions

### 1. Office pane owns `containerRef`

Root becomes a horizontal flex: left `width: 80%` (relative, overflow hidden) holds everything that is in the office today; right `width: 20%` is the sidebar. Move `containerRef` onto the left pane so `ToolOverlay` and canvas sizing keep using the office box, not the full window.

**Why not overlay the sidebar on the current 100% canvas?** The office would still render under the column and stay hard to pan/click. The user asked the current UI to *occupy* 80%.

### 2. Sidebar is a new component, two stacked halves

`EmbersSidebar`: column titled **Embers** on top (flex 1, overflow auto) and a visual instruction composer on the bottom (flex 1). Stay mounted in layout-edit mode so the 80/20 contract does not flip.

Rows are the `agents` display ids that have a non-subagent character. Name from `folderName` / cache; role from `getCachedAgent(getBackendId(id))?.identity.role` (empty string if missing). Edit / Fire call the same `handleEditAgent` / `requestFire` as the overlay. Clicking a row selects that ember (`selectedAgentId`) so the camera and overlay stay aligned. No Move button.

### 3. Shared status helper; sprite portrait

Lift `statusDot` out of `ToolOverlay` into a small shared module both surfaces import. Do not read Embers `character_status`.

Portrait: draw the character's current (or idle south) sprite via the existing sprite cache into a small canvas. If sprites are not ready, show a circle with the uppercase first letter of the name. Do not add image assets or `appearance.avatar` fetching.

### 4. Composer is inert chrome

A textarea (or equivalent) with Ember-worded placeholder. `preventDefault` on submit; no client call. Local typing may stay in React state; it MUST NOT persist or dispatch.

### 5. Copy pass, identifiers stay

Replace user-visible Agent/Agente in Hire tooltip, form titles, Fire confirm, overlay/debug fallbacks, and catalog error strings. Leave `AgentFormModal`, `deleteAgent`, and CSS var names as they are.

## Risks / Trade-offs

- [20% column is narrow] → Compact contact rows; stack name/role; keep Edit/Fire as small pixel buttons.
- [Moving `containerRef` breaks overlay alignment] → Keep the ref on the office pane only; verify labels still sit above sprites after the split.
- [Sprite portrait looks like a full-body stamp] → Prefer a tight crop of the sprite; fall back to the initial circle rather than a broken image.
- [Broader Ember copy misses a string] → Grep the webview for `Agent` / `Agente` in user-visible literals before calling the rename done.

## Migration Plan

1. Split the App shell and add the sidebar chrome.
2. Wire list data, status, portrait, Edit / Fire.
3. Replace user-visible Agent/Agente copy.
4. Rollback: restore the full-bleed App root and revert the copy.

## Open Questions

None. Instruction submit and any later “assign to selected ember” behavior wait for a follow-up change.
