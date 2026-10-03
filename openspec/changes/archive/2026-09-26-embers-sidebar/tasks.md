## 1. Office + sidebar shell

- [x] 1.1 Split the webview into a left 80% office pane and a right 20% sidebar; keep `containerRef` on the office pane
- [x] 1.2 Add `EmbersSidebar` with a top Embers half and a bottom instruction half; keep it visible in layout-edit mode

## 2. Embers roster

- [x] 2.1 Extract the overlay status-dot helper and use it on both the name pill and each list row
- [x] 2.2 Render catalog office embers (not sub-agents) with portrait or initial, name, role, status dot, and a scrollable list
- [x] 2.3 Wire row click to select, Edit to the existing form, Fire to the existing confirmation; do not add Move

## 3. Composer and Ember copy

- [x] 3.1 Add the instruction input as visual-only chrome (no submit, no backend call)
- [x] 3.2 Replace user-visible Agent / Agente copy with Ember / Embers (Hire tooltip, form titles, Fire confirm, fallbacks, errors, Debug View)

## 4. Verification

- [x] 4.1 Confirm the office chrome lives in the left 80% and name pills still sit on the characters
- [x] 4.2 Confirm an Embers row shows portrait/initial, name, role, status dot, Edit, and Fire, and that Fire asks for confirmation
- [x] 4.3 Confirm typing/enter in the instruction input does not change the office or catalog
- [x] 4.4 Confirm visible UI copy has no Agent or Agente
