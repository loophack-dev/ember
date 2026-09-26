## 1. Hire label and click menu

- [x] 1.1 Rename the toolbar create control to `Hire` with tooltip `Hire Agent`; it still opens the existing create form
- [x] 1.2 Stop opening the edit form on catalog-agent click (`App.handleClick` / `handleSelectAgent`); click only selects the agent
- [x] 1.3 Add a pixel action menu (Edit, Move, Fire) anchored to the selected catalog agent; hide it for sub-agents, layout edit mode, and when the agent is deselected

## 2. Edit and Fire

- [x] 2.1 Wire Edit to open the existing edit form for that display id and close the action menu
- [x] 2.2 Add a Fire confirmation modal (pixel chrome, cancel leaves the agent, no request until confirm)
- [x] 2.3 On confirm, call existing `deleteAgent` + `projectClosed`; on failure keep the character and show the catalog error
- [x] 2.4 Route overlay `×` and debug close through the same Fire confirmation so no catalog archive skips the modal

## 3. Move and persist

- [x] 3.1 Choosing Move enters relocate mode for that agent (keep selection; cancel on Escape, deselect, another menu action, or layout edit)
- [x] 3.2 In relocate mode, the next free seat uses `reassignSeat` and the next walkable tile uses `walkToTile` (clear `seatId` when leaving a chair)
- [x] 3.3 After placement, merge cached appearance with new `seat_id` and `desk`, `PUT` via existing `putAppearance`, update the cache, and leave relocate mode; do not send `saveAgentSeats`
- [x] 3.4 If the appearance write fails, keep the in-office position and show the catalog error

## 4. Verification

- [x] 4.1 Confirm click shows Edit / Move / Fire and does not open the form; Edit opens the form; Hire opens create
- [x] 4.2 Confirm Fire cancel sends no DELETE; confirm sends DELETE and removes the character
- [x] 4.3 Confirm Move to a seat and to a walkable tile persist through `PUT /appearance` without changing client contracts
