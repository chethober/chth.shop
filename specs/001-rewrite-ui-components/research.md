# Research: UI Component Modernization with shadcn/ui

**Feature**: Rewrite UI Components with shadcn/ui
**Status**: Completed

---

## 1. Component Architecture & Ecosystem Selection

### Decision
Adopt the canonical shadcn/ui architecture for Next.js 16 (App Router) and Tailwind CSS v4, backed by Radix UI primitives and `class-variance-authority` (CVA). Establish a local `frontend/components.json` configuration file to allow ongoing component management via the shadcn registry.

### Rationale
- **Zero Runtime Overhead**: Unlike heavy UI libraries (Mantine, Chakra, MUI), shadcn/ui components are code assets copied directly into the project (`frontend/components/ui/`). They compile to pure React and Tailwind CSS classes.
- **Accessibility by Default**: Backed by Radix UI primitives, ensuring WCAG 2.1 AA compliance (keyboard focus trapping, screen-reader ARIA semantics, dismissal keys).
- **Consistency**: Centralizes visual variants (default, destructive, outline, secondary, ghost, link) and sizes (sm, default, lg, icon) using type-safe CVA definitions.
- **Tailwind v4 Alignment**: The project already runs Next.js 16 and Tailwind CSS v4 (`@tailwindcss/postcss`). The shadcn/ui modern specification natively supports Tailwind v4 `@theme` and CSS variable pipelines.

### Alternatives Considered
- **Keep Custom Ad-hoc Components**: Current implementation has inline button classes, inconsistent modal implementations, and lack of standardized focus states across pages (`Header.tsx`, `collab/page.tsx`, `cart/page.tsx`). Rejected due to high maintenance burden and accessibility gaps.
- **Headless UI (`@headlessui/react`)**: Headless UI is installed in `frontend/package.json` but has limited component primitives (lacks Sheet, Tooltip, Sonner, Command palette, unified CVA buttons/badges). Rejected in favor of Radix UI + shadcn conventions.

---

## 2. Dependency & Peer Compatibility (React 19 + Tailwind v4)

### Decision
Install core shadcn support packages:
- `class-variance-authority`: For variant-driven component styling.
- `@radix-ui/react-slot`: For the polymorphic `asChild` pattern across Button, Card, and other trigger components.
- Radix UI primitive packages:
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-switch`
  - `@radix-ui/react-slider`
  - `@radix-ui/react-label`
  - `@radix-ui/react-separator`
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-tooltip`
- `embla-carousel-react`: For standard accessible carousels.

### Rationale
- Yarn test confirmed that modern Radix UI packages (version `1.1.x` and `1.3.x`) declare explicit peer support for `react@^19.0.0` without forcing legacy peer flags.
- `clsx` and `tailwind-merge` are already installed and exported via `frontend/lib/utils.ts` as `cn(...)`.

### Alternatives Considered
- **Full CLI automation (`npx shadcn@latest add ...`)**: While the CLI is available, Next.js 16 with React 19 in monorepo structures often experiences interactive prompt blocks or configuration path mismatches. Providing deterministic, high-quality, typed component code directly aligned with `https://ui.shadcn.com/llms.txt` guarantees exact compatibility and zero installation friction.

---

## 3. Design Tokens & Theming Harmonization

### Decision
Utilize the existing HSL token definitions in `frontend/app/globals.css`. Confirm that all new shadcn/ui components reference:
- `bg-background`, `text-foreground`
- `bg-primary`, `text-primary-foreground`
- `bg-secondary`, `text-secondary-foreground`
- `bg-muted`, `text-muted-foreground`
- `bg-accent`, `text-accent-foreground`
- `bg-destructive`, `text-destructive-foreground`
- `border-border`, `ring-ring`, `bg-card`, `text-card-foreground`

### Rationale
- `frontend/app/globals.css` already declares both `:root` (light) and `.dark` (dark) variables matching shadcn tokens.
- Using standard semantic classes ensures automatic dark mode support across the entire site without hardcoding dark mode class overrides.

### Alternatives Considered
- **Separate custom theme colors**: Using raw Tailwind colors (e.g. `bg-zinc-900`) was considered, but rejected because it breaks dynamic theme switching and leads to color drift across pages.

---

## 4. Existing Component Integration & Preservation Strategy

### Decision
1. **Preserve Bespoke 3D & Dynamic Elements**:
   - `notch.tsx`: Keep dynamic island visual styling, refactoring internal buttons and badges to use shadcn primitives.
   - `sonar-grid.tsx`: Keep background canvas effects unchanged.
   - `carousel.tsx`: Retain the 3D parallax tilt effects for featured creator merchandise while exposing standard shadcn `Carousel` primitives for general UI use.
2. **Modernize Core Overlays & Forms**:
   - Refactor `CookiePreferencesModal.tsx` to use `Dialog`, `Switch`, `Tabs`, and `Button` primitives from `@/components/ui`.
   - Modernize `Header.tsx` to use `Button`, `Sheet` (for mobile drawer), `DropdownMenu` (for user account menu), and `Badge` (for cart counter).
   - Refactor `collab/page.tsx`, `cart/page.tsx`, `auth/page.tsx`, and `account/page.tsx` forms to use `Input`, `Textarea`, `Label`, `Button`, `Card`, and `Badge`.

### Rationale
This approach eliminates code duplication, guarantees accessible focus handling and keyboard navigation, and maintains the custom brand identity of chth.shop.
