## Purpose

Keeps each Ember’s office pose and busy-lock aligned with Embers `character_status` so a working Ember sits, an idle Ember stands, and a busy Ember cannot be moved, edited, or fired.

## ADDED Requirements

### Requirement: Status values

An Ember’s character status SHALL be one of `idle`, `working`, or `waiting`. The office MUST hydrate that status from `GET /agents` (`character_status`) and MUST update it from the task socket: `ack` with `working` → `working`, `ask` → `waiting`, `ack` of `answer` → `working`, `finish` → `idle` unless that Ember still has queued work, in which case it becomes `working`. An `ack` with `queued` MUST NOT change the Ember’s character status.

#### Scenario: Hydrate from the catalog

- **WHEN** the office loads catalog Embers
- **THEN** each Ember’s character status is the `character_status` returned by `GET /agents`

#### Scenario: Finish with a queued task

- **WHEN** a `finish` arrives for an Ember that still has queued tasks
- **THEN** that Ember’s character status becomes `working`

### Requirement: Sit when busy, stand when idle

While an Ember is `working` or `waiting`, the office SHALL send that Ember to the nearest chair and sit them there. While an Ember is `idle`, the office SHALL stand them up. Waiting is treated as busy (still on a task).

#### Scenario: Working walks to a chair

- **WHEN** an Ember’s character status becomes `working`
- **THEN** that Ember walks to the nearest chair
- **AND** sits when they arrive

#### Scenario: Idle stands

- **WHEN** an Ember’s character status becomes `idle`
- **THEN** that Ember stands up

### Requirement: Busy Embers cannot be edited, moved, or fired

While an Ember is not `idle`, Edit, Move, and Fire MUST be disabled, and the office MUST ignore walk and relocate commands for that Ember. The Ember MUST remain selectable so the user can send more tasks.

#### Scenario: Busy Ember stays selectable

- **WHEN** a catalog Ember is `working` or `waiting`
- **THEN** the user can still select that Ember
- **AND** Edit, Move, and Fire do not run for that Ember

#### Scenario: Idle Ember can be edited

- **WHEN** a catalog Ember is `idle`
- **THEN** Edit, Move, and Fire remain available for that Ember
