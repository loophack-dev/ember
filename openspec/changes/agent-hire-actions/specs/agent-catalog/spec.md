## ADDED Requirements

### Requirement: Catalog agent action menu

Clicking an existing catalog agent SHALL select that agent and show three actions: Edit, Move, and Fire. That click MUST NOT open the edit form. Sub-agents MUST NOT receive this menu.

#### Scenario: Click shows the three actions

- **WHEN** the user clicks a catalog agent
- **THEN** the agent is selected
- **AND** the user sees Edit, Move, and Fire
- **AND** the edit form is not open

#### Scenario: Sub-agent click has no hire actions

- **WHEN** the user clicks a sub-agent
- **THEN** Edit, Move, and Fire are not shown

### Requirement: Move relocates the agent on the layout

Choosing Move SHALL put the selected catalog agent into relocate mode. The next valid placement (a free seat or a walkable tile) MUST move that agent there. After a successful placement the system SHALL persist the new position through the existing appearance write and leave relocate mode. A failed persist MUST keep the agent visible in the new office position and show the error.

#### Scenario: Move to a free seat

- **WHEN** the user chooses Move on a catalog agent
- **AND** then clicks a free seat
- **THEN** that agent is assigned to that seat
- **AND** the stored appearance is updated with the new seat
- **AND** relocate mode ends

#### Scenario: Move to a walkable tile

- **WHEN** the user chooses Move on a catalog agent
- **AND** then clicks a walkable tile that is not a free seat
- **THEN** that agent walks to that tile
- **AND** the stored appearance is updated with the new tile position
- **AND** relocate mode ends

### Requirement: Fire confirmation before archive

Choosing Fire SHALL open a confirmation modal. The system MUST NOT send the archive request until the user confirms. Canceling the modal MUST leave the agent in the office and send no archive request. Front copy MAY say Fire; the archive request itself MUST stay the existing delete/archive contract.

#### Scenario: Fire asks for confirmation

- **WHEN** the user chooses Fire
- **THEN** a confirmation modal is shown
- **AND** no archive request is sent yet

#### Scenario: Cancel Fire

- **WHEN** the Fire confirmation modal is open
- **AND** the user cancels
- **THEN** the agent remains in the office
- **AND** no archive request is sent

## MODIFIED Requirements

### Requirement: Create agent from the toolbar

The Hire control SHALL open a create form instead of launching Claude Code or picking a workspace folder. The visible label MUST be `Hire` (accessible name MAY be Hire Agent). Submitting a valid create form SHALL call `POST /agents` through the backend client, including a generated `appearance`, and then project the created agent into the office.

#### Scenario: Open create form

- **WHEN** the user clicks Hire
- **THEN** the create form opens
- **AND** Claude Code is not launched

#### Scenario: Successful create

- **WHEN** the user submits a valid create form
- **THEN** the system sends `POST /agents` with the form fields plus a generated appearance
- **AND** a new character appears in the office using that appearance
- **AND** the form closes

### Requirement: Archive removes the character

The system SHALL archive an agent with `DELETE /agents/{id}` through the backend client only after the user confirms Fire, and then remove that agent's character from the office. A failed archive MUST keep the character visible and show the error. No other catalog-agent control MAY archive without that confirmation.

#### Scenario: Successful archive

- **WHEN** the user confirms Fire on an agent
- **THEN** the system calls `DELETE /agents/{id}`
- **AND** that character disappears from the office

#### Scenario: Failed archive

- **WHEN** the user confirms Fire
- **AND** archive returns an error
- **THEN** the character remains
- **AND** the user sees the error message
