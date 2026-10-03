## Purpose

Lets a selected Ember take work over the Embers task socket: send instructions, answer questions, and show every inbound and outbound task event next to that Ember.

## ADDED Requirements

### Requirement: Tasks Pane layout

The lower sidebar section SHALL be titled Tasks Pane and split into an event log above and a chat composer with a Send control below. User-visible copy MUST use Ember, not Agent or Agente.

#### Scenario: Pane title and split

- **WHEN** the office sidebar is visible
- **THEN** the lower section is titled Tasks Pane
- **AND** the event log sits above the composer and Send control

### Requirement: Selection enables the pane

The Tasks Pane composer, Send control, and answer actions SHALL be enabled only when a catalog Ember is selected. When none is selected, the Tasks Pane MUST look disabled and MUST NOT emit `delegate` or `answer`.

#### Scenario: No Ember selected

- **WHEN** no catalog Ember is selected
- **THEN** the Tasks Pane appears disabled
- **AND** Send does not emit a socket message

#### Scenario: Ember selected

- **WHEN** the user selects a catalog Ember
- **THEN** the Tasks Pane composer and Send are enabled for that Ember

### Requirement: Send emits delegate

Sending a non-empty instruction for the selected Ember SHALL emit a WebSocket `delegate` with that Ember’s backend id and the instruction text, and SHALL append an outgoing event in the log for that Ember.

#### Scenario: Send instruction

- **WHEN** a catalog Ember is selected
- **AND** the user sends a non-empty instruction
- **THEN** a `delegate` message is emitted for that Ember
- **AND** an outgoing event appears in the log with that Ember’s portrait

### Requirement: Event log shows socket traffic

The event log SHALL show outgoing (`delegate`, `answer`) and incoming (`ack`, `error`, `ask`, `finish`) messages. Outgoing and incoming MUST use distinct colors. Each row MUST name the event type and show the related Ember’s portrait when that Ember is known.

#### Scenario: Incoming ask is distinct

- **WHEN** the backend sends `ask` for an Ember
- **THEN** the log shows an incoming `ask` row
- **AND** the row uses the incoming color
- **AND** the row shows that Ember’s portrait

#### Scenario: Incoming finish is distinct

- **WHEN** the backend sends `finish` for an Ember
- **THEN** the log shows an incoming `finish` row with that Ember’s portrait
- **AND** completed and failed finishes are visually distinct

### Requirement: Ack and error resolve outbound events

An `ack` SHALL update the matching outbound event (by `request_id`) and apply the Ember’s office status from the ack (`working` or `queued`). An `error` SHALL mark the matching outbound event as rejected and MUST NOT create a task.

#### Scenario: Delegate accepted

- **WHEN** the user sent a `delegate`
- **AND** an `ack` arrives with that `request_id`
- **THEN** the outbound event is marked accepted
- **AND** that Ember’s office status reflects working or queued as indicated

#### Scenario: Message rejected

- **WHEN** an `error` arrives for an outbound `request_id`
- **THEN** that outbound event is marked rejected
- **AND** the user can see the error
- **AND** no task is treated as created

### Requirement: Answer pending questions

When the selected Ember has a pending `ask`, the Tasks Pane SHALL let the user answer with a suggested option or free text. Submitting SHALL emit WebSocket `answer` for that `task_id` and `question_id`. After an `ack` for that answer, the pending question MUST no longer be interactive.

#### Scenario: Answer an ask

- **WHEN** the selected Ember has a pending `ask`
- **AND** the user sends an answer
- **THEN** an `answer` message is emitted
- **AND** an outgoing `answer` event appears in the log with that Ember’s portrait
