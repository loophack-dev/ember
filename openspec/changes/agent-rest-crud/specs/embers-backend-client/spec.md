## Purpose

Provide the only Ember-side access path to the Embers REST backend so host, auth, routes, and contracts stay isolated from office UI and simulation.

## ADDED Requirements

### Requirement: Exclusive REST access layer

Ember SHALL perform every Embers REST request through a single backend client layer. Office simulation, React views, and the current Ember WebSocket server MUST NOT call Embers URLs, construct Embers request bodies, or parse Embers success payloads directly.

#### Scenario: UI asks to create an agent

- **WHEN** the create form submits a valid agent
- **THEN** only the backend client layer issues `POST /agents`
- **AND** the form receives a typed result or a mapped error without knowing the request URL

#### Scenario: Other modules cannot fetch Embers

- **WHEN** a developer inspects office, overlay, or Ember-server code
- **THEN** those modules contain no Embers REST paths such as `/agents` or `/providers`

### Requirement: Configurable backend host

The client layer SHALL read the Embers HTTP origin from the environment variable `VITE_EMBERS_API_BASE`. It MUST NOT hardcode the production or local host. When the variable is missing or empty, the client SHALL fail the request with a clear configuration error instead of calling a guessed URL.

#### Scenario: Host is configured

- **WHEN** `VITE_EMBERS_API_BASE` is `http://localhost:8000`
- **AND** the client lists agents
- **THEN** it requests `http://localhost:8000/agents`

#### Scenario: Host is missing

- **WHEN** `VITE_EMBERS_API_BASE` is unset or blank
- **AND** any Embers operation is attempted
- **THEN** the client does not send a network request
- **AND** the caller receives a configuration error describing the missing variable

### Requirement: Optional static authorization

When `VITE_EMBERS_API_TOKEN` is set and non-empty, every Embers request SHALL include `Authorization` with that token. When the variable is absent or blank, the client SHALL send no `Authorization` header.

#### Scenario: Token present

- **WHEN** `VITE_EMBERS_API_TOKEN` has a value
- **AND** the client calls any Embers route
- **THEN** the request includes the `Authorization` header with that token

#### Scenario: Token absent

- **WHEN** `VITE_EMBERS_API_TOKEN` is unset
- **AND** the client calls any Embers route
- **THEN** the request has no `Authorization` header

### Requirement: Agent REST operations

The client layer SHALL expose operations that match the Embers agent contract:

- `GET /agents` (default `include_archived=false`) returning the `items` list of `AgentOut`
- `POST /agents` with `AgentCreate`, expecting `201` and `AgentOut`
- `GET /agents/{id}` returning `AgentOut`
- `PATCH /agents/{id}` with `AgentUpdate` returning `AgentOut`
- `DELETE /agents/{id}` expecting `204`
- `PUT /agents/{id}/appearance` with `{ data }` returning `AgentOut`

Identifiers in these operations MUST be the backend UUID strings. Optional JSON fields that the backend sends as `null` MUST be preserved as `null` in the typed result.

#### Scenario: List active agents

- **WHEN** the client lists agents without asking for archived records
- **THEN** it calls `GET /agents` without `include_archived=true`
- **AND** it returns the `items` array

#### Scenario: Create agent

- **WHEN** the client creates an agent with name, model config, identity, and appearance
- **THEN** it sends `POST /agents` with those fields in `snake_case`
- **AND** it returns the created `AgentOut` including `id`, `appearance`, and `status`

#### Scenario: Archive agent

- **WHEN** the client deletes an agent by UUID
- **THEN** it sends `DELETE /agents/{id}`
- **AND** a `204` result is treated as success with no body

### Requirement: Provider and tool catalogs

The client layer SHALL load `GET /providers` and `GET /tools` and return their `items` lists so a caller can populate create/edit choices. It MUST NOT invent provider or tool ids that the backend did not return.

#### Scenario: Load catalogs for the form

- **WHEN** the client is asked for providers and tools
- **THEN** it requests `GET /providers` and `GET /tools`
- **AND** it returns the `items` from each response

### Requirement: Mapped REST errors

The client layer SHALL map a failed Embers response to a structured error that includes the backend `code` and `message` when the body is `{ error: { code, message, details } }`. For HTTP `422`, field `details` MUST be forwarded. Network failures and non-JSON bodies MUST become an `internal_error` (or equivalent configuration/network error) with a readable message.

#### Scenario: Validation error

- **WHEN** `POST /agents` returns HTTP 422 with `error.code` `validation_error` and field details
- **THEN** the caller receives that code, message, and details

#### Scenario: Missing agent

- **WHEN** `GET /agents/{id}` returns HTTP 404 with `error.code` `not_found`
- **THEN** the caller receives that code and message
