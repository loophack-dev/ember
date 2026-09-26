## Purpose

Gives the office Ember product chrome from the Flame Design System: favicon, top logo, page title, and brand color tokens.

## ADDED Requirements

### Requirement: Favicon and page title

The standalone office page SHALL use the flame/`<>` logo as its favicon. The document title MUST be Ember.

#### Scenario: Browser tab shows Ember

- **WHEN** the office page is open
- **THEN** the tab title is Ember
- **AND** the tab icon is the flame logo

### Requirement: Header logo

The office SHALL show the flame logo at the top of the webview, next to the Ember wordmark, above the office canvas and the right rail.

#### Scenario: Logo sits above the office

- **WHEN** the office is visible
- **THEN** a header at the top shows the flame logo
- **AND** the word Ember appears beside that logo

### Requirement: Flame brand token

The office stylesheet SHALL expose the Flame primary orange as a brand token for product chrome. Pixel office drawing MUST remain the existing pixel look; the token MUST NOT force a rounded SaaS restyle of the canvas.

#### Scenario: Brand color is available

- **WHEN** product chrome needs the Flame primary color
- **THEN** it uses the shared brand token
- **AND** the office canvas still uses the existing pixel palette
