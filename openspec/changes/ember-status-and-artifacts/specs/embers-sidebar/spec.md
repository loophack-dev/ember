## MODIFIED Requirements

### Requirement: Row portrait and status

Each Embers row SHALL show a portrait of that character when a sprite snapshot is available, otherwise a circle containing the first letter of the ember name. The row SHALL show the same `character_status` colors as the office name label: idle gray, waiting blue, working yellow.

#### Scenario: Portrait fallback to initial

- **WHEN** a catalog ember is in the list
- **AND** a character sprite snapshot is not available
- **THEN** the row shows a circle with the first letter of that ember's name

#### Scenario: Status dot matches office status

- **WHEN** a catalog ember is idle, working, or waiting
- **THEN** the Embers row shows a status dot using the same color as that ember's office name label

## ADDED Requirements

### Requirement: Busy row actions are disabled

While a listed Ember is not idle, that row’s Edit, Move, and Fire controls MUST be disabled. The row MUST remain clickable so the Ember can be selected.

#### Scenario: Working Ember cannot be fired from the list

- **WHEN** a catalog Ember is working
- **THEN** Fire on that row does not fire the Ember
- **AND** clicking the row still selects the Ember
