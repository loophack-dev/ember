## Purpose

Let people create, inspect, edit, and archive durable office agents through a form, then show those records as characters without using Claude sessions as the source of membership.

## ADDED Requirements

### Requirement: Catalog bootstrap from REST

After the office layout is ready, the system SHALL load active agents from the backend client and project each returned `AgentOut` into the office. Archived agents MUST NOT appear. If the list request fails, the office SHALL remain usable and the user MUST see a readable error.

#### Scenario: Existing agents appear after layout load

- **WHEN** the office layout becomes ready
- **AND** `GET /agents` returns two active agents
- **THEN** both agents appear as office characters
- **AND** each character uses the agent's stored appearance when present

#### Scenario: List failure

- **WHEN** the office layout becomes ready
- **AND** listing agents fails
- **THEN** no catalog agents are added
- **AND** the user is shown the error message

### Requirement: Create agent from the toolbar

The `+ Agent` control SHALL open a create form instead of launching Claude Code or picking a workspace folder. Submitting a valid create form SHALL call `POST /agents` through the backend client, including a generated `appearance`, and then project the created agent into the office.

#### Scenario: Open create form

- **WHEN** the user clicks `+ Agent`
- **THEN** the create form opens
- **AND** Claude Code is not launched

#### Scenario: Successful create

- **WHEN** the user submits a valid create form
- **THEN** the system sends `POST /agents` with the form fields plus a generated appearance
- **AND** a new character appears in the office using that appearance
- **AND** the form closes

### Requirement: Shared create and edit form

Create and edit SHALL use the same form fields. Edit mode SHALL load the selected agent's current catalog values and submit `PATCH /agents/{id}` without sending appearance. The form MUST collect at least: `name`, provider, `model_id`, `identity.role`, optional `identity.persona`, optional `identity.tone`, optional `instructions`, and `tools`. Provider and tool choices MUST come from the backend catalogs. Appearance, palette, seat, and desk position MUST NOT be editable in this form.

#### Scenario: Edit from an existing agent

- **WHEN** the user opens the form for an existing agent
- **THEN** the fields show that agent's current name, model, identity, instructions, and tools
- **AND** appearance controls are not shown

#### Scenario: Successful edit

- **WHEN** the user changes the agent's role and saves
- **THEN** the system sends `PATCH /agents/{id}` with the catalog fields
- **AND** the request body does not include appearance
- **AND** the office label uses the updated name if the name changed
- **AND** the form closes

### Requirement: Create-form validation

The form SHALL require `name` (1–60 characters), a provider, a `model_id`, and `identity.role` (1–80 characters) before submit. `instructions`, when present, MUST NOT exceed 8000 characters. On backend `validation_error`, the form MUST stay open and show the returned message (and field details when present).

#### Scenario: Missing required field

- **WHEN** the user submits create with an empty name
- **THEN** no REST create request is sent
- **AND** the form explains that name is required

#### Scenario: Backend rejects the payload

- **WHEN** create or edit returns `validation_error`
- **THEN** the form remains open
- **AND** the backend message is visible

### Requirement: Random appearance on create

On create only, the system SHALL generate an appearance object and send it as `AgentCreate.appearance` so the backend can store it in `ui_settings.data`. The generated object MUST include a random visual identity and an office position (a free seat when one exists, otherwise a walkable tile). The user MUST NOT have to enter appearance fields.

#### Scenario: Create with a free seat

- **WHEN** the user creates an agent and at least one seat is free
- **THEN** the create request includes an appearance with a position bound to a free seat
- **AND** the new character sits at that seat

#### Scenario: Create with no free seat

- **WHEN** the user creates an agent and no seat is free
- **THEN** the create request still includes a generated appearance with a walkable position
- **AND** the new character appears on a walkable tile

### Requirement: Archive removes the character

The system SHALL archive an agent with `DELETE /agents/{id}` through the backend client and then remove that agent's character from the office. A failed archive MUST keep the character visible and show the error.

#### Scenario: Successful archive

- **WHEN** the user archives an agent
- **THEN** the system calls `DELETE /agents/{id}`
- **AND** that character disappears from the office

#### Scenario: Failed archive

- **WHEN** archive returns an error
- **THEN** the character remains
- **AND** the user sees the error message

### Requirement: Office projection keeps the visualization protocol

Projecting a catalog agent into the office SHALL use the existing client visualization messages (`agentCreated`, `existingAgents` with optional appearance meta, and `agentClosed`). The office character display id MAY be a session-local number, but the backend UUID remains the identity used for every later REST call. Character labels MUST use `AgentOut.name`.

#### Scenario: Create uses visualization messages

- **WHEN** a create succeeds
- **THEN** the office receives an `agentCreated` (or equivalent existing visualization message) for that agent
- **AND** a later edit or archive of that character uses the same backend UUID

#### Scenario: Label shows the agent name

- **WHEN** an agent named `Analista` is projected
- **THEN** the office label text is `Analista`

### Requirement: Claude sessions are not the catalog source

The system MUST NOT add, update, or remove catalog agents because a Claude Code JSONL file appeared, changed, or aged out. The current Ember server MAY still serve office assets and layout over its existing WebSocket.

#### Scenario: JSONL file appears

- **WHEN** a new Claude transcript file is created under the watched projects directory
- **THEN** no catalog agent is created
- **AND** no office character is added from that file
