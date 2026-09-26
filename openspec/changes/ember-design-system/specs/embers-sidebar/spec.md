## MODIFIED Requirements

### Requirement: Office occupies eighty percent width

The existing office UI (canvas, character overlays, Hire / Layout / Settings, zoom, and layout-editor chrome) SHALL occupy the left 70% of the webview width. The remaining 30% SHALL be the Embers sidebar. The office MUST remain fully usable in that pane.

#### Scenario: Office sits in the left pane

- **WHEN** the webview is showing the office
- **THEN** the office canvas and its existing chrome are confined to the left 70% of the width
- **AND** the right 30% is the Embers sidebar

## ADDED Requirements

### Requirement: Readable Embers list type

Embers list titles, names, roles, and row actions MUST use type large enough to read at the 30% rail width (list title at least 22px, names at least 18px).

#### Scenario: List names are readable

- **WHEN** a catalog ember appears in the Embers list
- **THEN** the ember name is at least 18px
- **AND** the list title is at least 22px
