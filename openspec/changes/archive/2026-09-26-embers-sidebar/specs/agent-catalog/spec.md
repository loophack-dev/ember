## ADDED Requirements

### Requirement: Ember vocabulary in the UI

User-visible webview copy SHALL use Ember or Embers. It MUST NOT display the words Agent or Agente. REST paths, payload field names, and code identifiers MAY keep agent.

#### Scenario: Hire and form titles use Ember

- **WHEN** the user opens Hire or Edit
- **THEN** the visible titles and accessible Hire name use Ember
- **AND** they do not contain Agent or Agente

#### Scenario: Fire and fallbacks use Ember

- **WHEN** the Fire confirmation is shown, or a nameless catalog ember needs a fallback label
- **THEN** the copy uses Ember
- **AND** it does not contain Agent or Agente

### Requirement: Edit and Fire from the Embers list

Choosing Edit on an Embers row SHALL open the existing edit form for that catalog ember. Choosing Fire SHALL open the same Fire confirmation used from the office overlay. Confirming Fire MUST archive through the existing delete path. The list MUST NOT include Move.

#### Scenario: List Edit opens the form

- **WHEN** the user chooses Edit on an Embers row
- **THEN** the edit form opens for that ember
- **AND** Move is not shown in the list

#### Scenario: List Fire uses the same confirmation

- **WHEN** the user chooses Fire on an Embers row
- **THEN** the Fire confirmation modal is shown
- **AND** no archive request is sent yet
