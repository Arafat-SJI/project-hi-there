
## Goal

Author a Control Tower design-token spec (modeled after the attached Cal.com `DESIGN-cal.md`) and surface it inside the admin panel as a new **Documentation** section with a first page at `/admin/design-tokens`.

## Deliverables

1. **`docs/design/control-tower-design-tokens.md`** — full Control Tower design-token spec following the Cal.md structure (metadata, colors, typography, spacing, radii, shadows, motion, components, layout, accessibility, voice). Tokens derived from the existing Control Tower brand (HSL 199 primary / HSL 187 accent, white "agentic" canvas, pulsing indicators) — not a copy of Cal's black/white system.

2. **`/admin/design-tokens` page** (`src/pages/admin/DesignTokens.tsx`) — a living, in-app reference that renders the token spec visually:
   - Color swatches grouped by role (brand, surface, text, status, badge) with hex + CSS-var name + copy-to-clipboard.
   - Typography scale rendered live (display-xl → caption) with font-family / size / weight / line-height shown.
   - Spacing scale, radius scale, shadow scale shown as visual chips.
   - Motion tokens (durations + easings) listed.
   - "Source spec" tab/link that opens the raw `.md` for download.
   - Read-only — no edit UI in this pass.

3. **Admin nav: new "Documentation" section** in `src/components/layout/AdminSidebar.tsx` with one child item "Design Tokens" → `/admin/design-tokens`. Icon: `BookOpen` (section) / `Palette` (item). Section collapses like existing groups and persists open state via localStorage.

4. **Route wiring** in the admin routes file (under `src/modules/admin/` or wherever `adminNavigation` resolves routes) so `/admin/design-tokens` renders inside `AdminLayout` behind `AdminRoute`.

## Technical notes

- Pure frontend / presentation. No DB tables, no edge functions, no migrations.
- Tokens shown on the page are sourced from a single TS constant (`src/shared/design/tokens.ts`) so the `.md` and the page stay aligned — page imports the constant; `.md` is the human-readable mirror.
- Reuse existing shadcn `Card`, `Tabs`, `Badge`, `Button`, `ScrollArea`, `useToast` (for copy feedback). No new deps.
- All colors expressed as HSL tokens consistent with `index.css` conventions; no hardcoded Tailwind color classes in components on the page (uses semantic classes + inline style for swatch fills only).
- Gated by `AdminRoute` (admin role required).

## Out of scope

- Rewriting `index.css` / `tailwind.config.ts` to adopt new tokens.
- Editing or theming any other admin/user pages.
- Versioning, diff view, or import/export of tokens.
- Multiple doc pages — only "Design Tokens" lands in this pass; the section is structured so more docs can be added later.
