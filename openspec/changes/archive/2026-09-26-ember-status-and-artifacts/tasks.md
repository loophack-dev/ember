## 1. Character status source

- [x] 1.1 Narrow `CharacterStatus` to `idle` | `working` | `waiting`
- [x] 1.2 Hydrate a shared status map from `GET /agents` `character_status`
- [x] 1.3 Patch that map from the task socket (`ack` working, `ask` waiting, answer `ack` working, `finish` idle or working if queued; ignore queued `ack`)

## 2. Status dots

- [x] 2.1 Point `statusDot` (office name label and Embers row) at the status map: idle gray, waiting blue, working yellow
- [x] 2.2 Stop using office tools / permission bubbles as the label color

## 3. Pose and busy lock

- [x] 3.1 On `working` or `waiting`, walk the Ember to their assigned seat or the nearest free chair and sit
- [x] 3.2 On `idle`, stand the Ember immediately (no sit timer)
- [x] 3.3 Disable Edit, Move, and Fire on the overlay and Embers list while not idle; keep the row selectable
- [x] 3.4 Ignore canvas walk and relocate while the Ember is not idle

## 4. Finish artifacts

- [x] 4.1 Parse `finish.data.artifacts` onto the log row
- [x] 4.2 Render a scrollable strip of buttons labeled with each artifact `title`
- [x] 4.3 Open `download_url` on click; if expired, refresh with `GET /artifacts/{id}/download`

## 5. Check (user runs the app)

- [x] 5.1 Idle / waiting / working dots match gray / blue / yellow on the label and the list
- [x] 5.2 Busy Embers sit; idle Embers stand; Edit / Move / Fire stay off while busy; selection still works
- [x] 5.3 A finish with files shows titled buttons that open (and refresh if needed)
