## MODIFIED Requirements

### Requirement: Status values

An Ember’s character status SHALL be one of `idle`, `working`, or `waiting`. The office MUST hydrate that status from `GET /agents` (`character_status`). It MUST also update status from task traffic the office emits and receives:

- Emit `delegate` or `answer` → `working`
- Receive `ack` with `working` → `working`
- Receive `ask` → `waiting`
- Receive `ack` of `answer` → `working`
- Receive `finish` → `idle`, or `working` if that Ember still has queued work
- Receive `error` for a `delegate` or `answer` that created no work → `idle` if that Ember has no current or queued task
- Receive `ack` with `queued` MUST NOT change status

The name-label and Embers-list dots MUST follow this status (idle gray, waiting blue, working yellow).

#### Scenario: Hydrate from the catalog

- **WHEN** the office loads catalog Embers
- **THEN** each Ember’s character status is the `character_status` returned by `GET /agents`

#### Scenario: Send work turns the Ember working

- **WHEN** the user sends a `delegate` for an idle Ember
- **THEN** that Ember’s status becomes `working`
- **AND** the name label and Embers row dots are yellow

#### Scenario: Send an answer turns the Ember working

- **WHEN** the selected Ember is waiting
- **AND** the user sends an `answer`
- **THEN** that Ember’s status becomes `working`
- **AND** the dots are yellow

#### Scenario: Received ask turns the Ember waiting

- **WHEN** the backend sends `ask` for an Ember
- **THEN** that Ember’s status becomes `waiting`
- **AND** the dots are blue

#### Scenario: Finish with a queued task

- **WHEN** a `finish` arrives for an Ember that still has queued tasks
- **THEN** that Ember’s character status becomes `working`

#### Scenario: Rejected delegate returns to idle

- **WHEN** the office sent a `delegate` for an Ember that had no other work
- **AND** an `error` arrives for that `request_id`
- **THEN** that Ember’s status becomes `idle`
- **AND** the dots are gray
