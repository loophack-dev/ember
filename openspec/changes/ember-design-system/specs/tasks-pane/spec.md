## ADDED Requirements

### Requirement: Readable Tasks Pane type

The Tasks Pane title, event text, hints, artifact buttons, and composer MUST use type large enough to read at the 30% rail width. Event body text MUST be at least 18px. The composer MUST be at least 18px and taller than a single compact line.

#### Scenario: Event log is readable

- **WHEN** a task event is in the log
- **THEN** the event body text is at least 18px

#### Scenario: Composer is readable

- **WHEN** the Tasks Pane composer is visible
- **THEN** its text is at least 18px
- **AND** the input is tall enough for more than one short line
