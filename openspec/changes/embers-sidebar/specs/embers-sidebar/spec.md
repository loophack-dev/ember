## Purpose

Splits the webview so the office stays on the left and a dedicated Embers column on the right lists who is in the office and shows a visual instruction composer.

## ADDED Requirements

### Requirement: Office occupies eighty percent width

The existing office UI (canvas, character overlays, Hire / Layout / Settings, zoom, and layout-editor chrome) SHALL occupy the left 80% of the webview width. The remaining 20% SHALL be the Embers sidebar. The office MUST remain fully usable in that pane.

#### Scenario: Office sits in the left pane

- **WHEN** the webview is showing the office
- **THEN** the office canvas and its existing chrome are confined to the left 80% of the width
- **AND** the right 20% is the Embers sidebar

### Requirement: Embers list of office catalog members

The top half of the sidebar SHALL be titled Embers and list every catalog ember currently in the office. The list MUST scroll when it overflows. Sub-agents MUST NOT appear in this list.

#### Scenario: Catalog ember appears in the list

- **WHEN** a catalog ember is present in the office
- **THEN** that ember appears in the Embers list
- **AND** the row shows a portrait, the ember name, the ember role, a status dot, Edit, and Fire

#### Scenario: Empty office list

- **WHEN** no catalog ember is in the office
- **THEN** the Embers list is empty or shows an empty state
- **AND** it does not use the word Agent or Agente

#### Scenario: Long list scrolls

- **WHEN** more embers are in the office than fit in the top half
- **THEN** the Embers list scrolls
- **AND** the instruction composer below stays visible

### Requirement: Row portrait and status

Each Embers row SHALL show a portrait of that character when a sprite snapshot is available, otherwise a circle containing the first letter of the ember name. The row SHALL show the same office status dot colors used on the office name pill (needs approval, active work, idle).

#### Scenario: Portrait fallback to initial

- **WHEN** a catalog ember is in the list
- **AND** a character sprite snapshot is not available
- **THEN** the row shows a circle with the first letter of that ember's name

#### Scenario: Status dot matches office status

- **WHEN** a catalog ember is idle, actively working, or waiting for approval
- **THEN** the Embers row shows a status dot using the same color language as that ember's office name pill

### Requirement: Instruction composer is visual only

The bottom half of the sidebar SHALL show an instruction input for assigning work to embers. In this change the control MUST be visible and MUST NOT send instructions, create tasks, or call the backend.

#### Scenario: Composer does not submit

- **WHEN** the user types or presses enter in the instruction input
- **THEN** no instruction or task request is sent
- **AND** the office and catalog are unchanged
