# Implementation Plan: Rewrite UI Components with shadcn/ui

**Branch**: `001-rewrite-ui-components` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-rewrite-ui-components/spec.md`

## Summary

Modernize the platform's UI architecture by adopting canonical shadcn/ui patterns and components as documented in `https://ui.shadcn.com/llms.txt`. We will configure `components.json`, establish type-safe, accessible Radix UI and CVA primitives under `frontend/components/ui/` (Button, Input, Textarea, Label, Card, Dialog, Sheet, DropdownMenu, Tabs, Switch, Slider, Badge, Separator, Avatar, Tooltip, and Carousel), and refactor core pages (`Header`, `Footer`, `CookiePreferencesModal`, `collab`, `cart`, `auth`, `account`) to use these primitives consistently while preserving existing custom 3D interactions.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js 16.0.6 (App Router)

**Primary Dependencies**:
- `@radix-ui/react-slot`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-switch`, `@radix-ui/react-slider`, `@radix-ui/react-label`, `@radix-ui/react-separator`, `@radix-ui/react-avatar`, `@radix-ui/react-tooltip`
- `class-variance-authority` (0.7.x)
- `clsx` (2.x), `tailwind-merge` (3.x)
- `lucide-react` (0.555.x)
- `embla-carousel-react`

**Storage**: N/A (Client UI library and presentation layer)

**Testing**:
- Static typing check via `tsc --noEmit`
- Next.js Webpack production build check via `yarn build`
- Manual and browser-based accessibility and interaction verification

**Target Platform**: Modern Web Browsers (Desktop, Tablet, Mobile responsive)

**Project Type**: Full-stack Web Application (Next.js App Router frontend)

**Performance Goals**:
- Zero additional render lag; all components are unstyled or lightweight CSS utility wrappers
- Zero Cumulative Layout Shift (CLS = 0)
- Fast modal and drawer transitions (< 200ms ease-out)

**Constraints**:
- Must preserve React 19 compatibility across all peer dependencies
- Must integrate seamlessly with Tailwind CSS v4 and the existing HSL token system in `frontend/app/globals.css`
- Must preserve custom 3D hero carousel features and canvas effects (`notch.tsx`, `sonar-grid.tsx`)

**Scale/Scope**:
- 15+ UI component primitives in `frontend/components/ui/`
- Configuration file `frontend/components.json`
- 7 core pages and layout components modernized

## Constitution Check

*GATE: Passed. All requirements comply with project principles.*

- **Simplicity**: No heavyweight third-party UI framework runtimes; modular, copy-pasteable primitives directly in source code.
- **Accessibility**: Full WCAG 2.1 AA keyboard navigation and screen-reader semantics via Radix primitives.
- **Compatibility**: Verified peer dependency compatibility for React 19 and Tailwind v4.

## Project Structure

### Documentation (this feature)

```text
specs/001-rewrite-ui-components/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── ui-components.md # TypeScript interfaces and contracts
├── checklists/
│   └── requirements.md  # Quality validation checklist
└── tasks.md             # Phase 2 output (/speckit-tasks command - to be created)
```

### Source Code (repository root)

```text
frontend/
├── components.json                      # [NEW] shadcn CLI & ecosystem configuration
├── app/
│   ├── globals.css                      # HSL design tokens & Tailwind v4 config
│   ├── layout.tsx                       # Root layout & providers
│   ├── page.tsx                         # Home page (refactored to use Card/Button)
│   ├── collab/page.tsx                  # Collab page (refactored with Input/Button/Card)
│   ├── cart/page.tsx                    # Cart page (refactored with Card/Button)
│   ├── auth/page.tsx                    # Auth page (refactored with Tabs/Input/Button)
│   └── account/page.tsx                 # Account page (refactored with Tabs/Card/Input)
├── components/
│   ├── Header.tsx                       # Header (refactored with Sheet/DropdownMenu/Button)
│   ├── Footer.tsx                       # Footer (refactored with Button/Separator)
│   ├── CookiePreferencesModal.tsx       # Cookie modal (refactored with Dialog/Switch/Tabs)
│   └── ui/
│       ├── button.tsx                   # [NEW] shadcn Button with CVA
│       ├── input.tsx                    # [NEW] shadcn Input
│       ├── textarea.tsx                 # [NEW] shadcn Textarea
│       ├── label.tsx                    # [NEW] shadcn Label
│       ├── badge.tsx                    # [NEW] shadcn Badge
│       ├── card.tsx                     # [NEW] shadcn Card suite
│       ├── dialog.tsx                   # [NEW] shadcn Dialog suite
│       ├── sheet.tsx                    # [NEW] shadcn Sheet (Drawer) suite
│       ├── dropdown-menu.tsx            # [NEW] shadcn Dropdown Menu suite
│       ├── tabs.tsx                     # [NEW] shadcn Tabs suite
│       ├── switch.tsx                   # [NEW] shadcn Switch
│       ├── slider.tsx                   # [NEW] shadcn Slider
│       ├── separator.tsx                # [NEW] shadcn Separator
│       ├── avatar.tsx                   # [NEW] shadcn Avatar
│       ├── tooltip.tsx                  # [NEW] shadcn Tooltip
│       ├── carousel.tsx                 # Standard shadcn Carousel + 3D Tilt integration
│       ├── notch.tsx                    # Preserved & modernized
│       ├── resizable-navbar.tsx         # Preserved & modernized
│       └── sonar-grid.tsx               # Preserved background grid
├── lib/
│   └── utils.ts                         # cn helper function
└── package.json                         # Dependencies
```

**Structure Decision**: Web application layout under `frontend/`. Primitives are strictly organized inside `frontend/components/ui/` with path alias `@/components/ui/*`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Radix UI primitive packages | Guaranteed keyboard focus trapping, ARIA roles, and accessible dialogs | Writing custom dialog/dropdown logic from scratch is error-prone and misses edge cases |
