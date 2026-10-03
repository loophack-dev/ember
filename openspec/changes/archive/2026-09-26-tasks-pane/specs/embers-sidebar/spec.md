## REMOVED Requirements

### Requirement: Instruction composer is visual only

**Reason**: The lower sidebar is now the Tasks Pane and must send work over the Embers task socket.

**Migration**: Use the Tasks Pane composer, event log, and socket flows in `tasks-pane`.

## ADDED Requirements

### Requirement: Lower half is the Tasks Pane

The lower half of the sidebar SHALL host the Tasks Pane (event log plus chat composer). It MUST NOT remain an inert instruction field that never sends work.

#### Scenario: Lower half is interactive when an Ember is selected

- **WHEN** a catalog Ember is selected
- **THEN** the lower sidebar is the Tasks Pane
- **AND** the user can send an instruction from that pane
