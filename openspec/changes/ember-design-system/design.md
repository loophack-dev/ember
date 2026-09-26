## Context

See proposal.md for why. `index.html` still pointed at Vite’s icon and title `webview-ui`. The layout was 80/20 (`App.tsx` + `EmbersSidebar`). Tasks Pane body type was 11–13px. The Flame board is a visual PDF (no extractable text): orange primary, black/white secondaries, danger red, size chips, badges. The office is a pixel canvas; a full rounded-kit restyle would fight existing chrome.

Logo files live at `webview-ui/public/ember-logo.png` and `favicon.png` (flame with `<>`).

## Goals / Non-Goals

**Goals:**

- Static brand files served from Vite `public/`.
- One header row above a 70/30 office/sidebar split.
- Shared `--pixel-brand` (`#f54e00`) for Flame primary.
- Larger Tasks Pane / Embers list type at that width.
- Apply Flame primary/danger/size only on existing pixel buttons (Hire, Send, Fire), not a new component library.

**Non-Goals:**

- Replacing FS Pixel Sans or the canvas renderer.
- Rounded SaaS buttons, badge rows, or a code-editor mock from the PDF.
- Starting Vite or the office server during apply.

## Decisions

1. **PNG favicon and header img, not a traced SVG**  
   Use the supplied remove-bg PNG in `public/`. `index.html` uses `./favicon.png` because Vite `base` is `./`.  
   *Alternative:* hand-trace SVG — rejected; the user attached the PNG logos.

2. **Header is a full-width row, not a sidebar title**  
   `BrandHeader` sits above the 70/30 row so the mark is always visible.  
   *Alternative:* logo only in the Embers column — rejected; “parte de arriba” is the app, not the list.

3. **30% is the right rail, 70% is the office**  
   After trying 70% on the Tasks/Embers column, the user asked to shrink that rail to 30% of the screen.  
   *Alternative:* keep 70% on the right — rejected; they asked to reduce it.

4. **Pixel chrome stays; Flame is tokens + logo**  
   Do not restyle the office to the PDF’s rounded kit. Later apply can tint Hire/Send with `--pixel-brand` if it still looks on-brand.  
   *Alternative:* adopt the full board — rejected; it would discard the pixel office.

## Risks / Trade-offs

- [Office at 30% is tight] → zoom/pan stay; Hire/Layout stay in the left pane.
- [PNG logo on dark header] → remove-bg file; keep header `var(--pixel-bg)`.
- [Optimistic type sizes] → specs set floors (18px body / 22px titles), not a type scale system.

## Migration Plan

Ship with the webview. Rollback is revert of header, public logos, and the 70/30 split.

## Open Questions

None.
