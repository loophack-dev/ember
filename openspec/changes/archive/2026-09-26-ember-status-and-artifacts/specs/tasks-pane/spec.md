## ADDED Requirements

### Requirement: Finish artifacts are download buttons

When a `finish` event includes one or more artifacts with a download URL, the finish log row SHALL show a button per artifact labeled with that artifact’s `title`. Multiple artifacts MUST sit in a scrollable strip. Clicking a button MUST open the artifact URL. If that URL has expired, the office MUST request a fresh link with `GET /artifacts/{id}/download` and open that instead.

#### Scenario: One artifact on finish

- **WHEN** a `finish` arrives with one artifact that has a `download_url` and a `title`
- **THEN** the finish row shows a button labeled with that title
- **AND** activating the button opens the artifact URL

#### Scenario: Several artifacts scroll

- **WHEN** a `finish` arrives with more than one artifact that has a URL
- **THEN** the finish row shows a button for each title
- **AND** the buttons are in a scrollable strip
