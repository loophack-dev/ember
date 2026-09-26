## ADDED Requirements

### Requirement: Single permanent name label

Each catalog agent (and sub-agent) SHALL have one name label that stays visible while the character is on screen. Selecting or hovering MUST NOT replace that label with a second activity card, and MUST NOT show a second name line.

#### Scenario: Click keeps one label

- **WHEN** the user clicks a catalog agent
- **THEN** the agent is selected
- **AND** exactly one name label is shown for that agent
- **AND** no separate Idle or activity text card appears

#### Scenario: Hover does not add a second label

- **WHEN** the user hovers a catalog agent
- **THEN** that agent still has a single name label
- **AND** no extra activity card is shown

### Requirement: Status dot on the name label

The permanent name label SHALL show a colored status dot beside the agent name. The dot MUST reflect the character's current office status (needs approval, active work, or idle). The name text remains the agent name.

#### Scenario: Idle status on the name label

- **WHEN** a catalog agent is idle
- **THEN** the name label shows that agent's name
- **AND** a status dot is visible beside the name

#### Scenario: Active status uses a distinct color

- **WHEN** a catalog agent is actively working
- **THEN** the status dot uses a different color than idle

#### Scenario: Needs-approval status uses a distinct color

- **WHEN** a catalog agent is waiting for approval
- **THEN** the status dot uses a different color than idle and active
