## MODIFIED Requirements

### Requirement: Status dot on the name label

The permanent name label SHALL show a colored status dot beside the Ember name. The dot MUST reflect that Ember’s `character_status`: idle is gray, waiting is blue, working is yellow. The name text remains the Ember name.

#### Scenario: Idle status on the name label

- **WHEN** a catalog Ember is idle
- **THEN** the name label shows that Ember’s name
- **AND** the status dot is gray

#### Scenario: Working status uses yellow

- **WHEN** a catalog Ember is working
- **THEN** the status dot is yellow

#### Scenario: Waiting status uses blue

- **WHEN** a catalog Ember is waiting
- **THEN** the status dot is blue
