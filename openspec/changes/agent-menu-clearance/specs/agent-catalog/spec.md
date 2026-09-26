## ADDED Requirements

### Requirement: Action menu leaves agent and label visible

When Edit, Move, and Fire (or the relocate hint) are shown, they MUST NOT overlap the selected catalog agent's character sprite and MUST NOT overlap that agent's name or activity label. The label MUST remain readable and the character MUST remain fully visible.

#### Scenario: Menu does not cover the character

- **WHEN** the user selects a catalog agent
- **THEN** Edit, Move, and Fire are visible
- **AND** the character sprite is not covered by those actions

#### Scenario: Menu does not cover the label

- **WHEN** the user selects a catalog agent
- **THEN** the agent's name label remains fully visible
- **AND** the action menu does not overlap that label

#### Scenario: Relocate hint follows the same clearance

- **WHEN** the user chooses Move
- **THEN** the relocate hint does not cover the character
- **AND** the relocate hint does not cover the name label
