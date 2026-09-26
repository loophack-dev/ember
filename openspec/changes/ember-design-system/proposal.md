## Why

The office still reads as a generic pixel webview (Vite favicon, no Ember mark, a 20% right rail with 11–13px task text). The Flame Design System and the flame/`<>` logos exist and should become the product chrome, and the Tasks Pane needs to stay readable in a 30% right rail.

## What Changes

- Use the flame logo as the document favicon and as a header mark at the top of the office.
- Title the standalone page **Ember**.
- Add Flame brand tokens (primary orange) without replacing the pixel office with a rounded SaaS kit.
- Make the right rail (Embers list + Tasks Pane) **30%** of the viewport width; office canvas **70%**.
- Increase Tasks Pane and Embers-list type so events, composer, and row labels are readable.
- Keep applying Flame button/size/badge language where it fits existing pixel chrome (Hire, Send, status chips) without a full visual rewrite.

## Capabilities

### New Capabilities

- `ember-brand`: Favicon, top header logo, page title, and Flame brand color tokens.

### Modified Capabilities

- `embers-sidebar`: The right rail is 30% of the screen and uses larger type on the Embers list.
- `tasks-pane`: Task log, hints, and composer use larger type and a taller input so the pane is usable at that width.

## Impact

- `webview-ui/index.html` favicon and title.
- `webview-ui/public/favicon.png` and `ember-logo.png`.
- New `BrandHeader` on `App.tsx`; office/sidebar split 70/30.
- `EmbersSidebar`, `TasksPane`, `EmberPortrait` type and spacing.
- CSS tokens (`--pixel-brand`).
- No new npm dependencies. Apply MUST NOT start Vite or the office server.
