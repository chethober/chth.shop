# Feature Specification: Rewrite UI Components with shadcn/ui

**Feature Branch**: `001-rewrite-ui-components`

**Created**: 2026-09-20

**Status**: Ready for Planning

**Input**: User description: "rewrite ui components with https://ui.shadcn.com/llms.txt ."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Standardized Interactive Controls (Priority: P1)

Users interacting with buttons, inputs, switches, and sliders across all storefront and customization pages experience consistent visual feedback (hover, focus, active, disabled), robust keyboard navigation, and full screen-reader accessibility.

**Why this priority**: Interactive form controls and call-to-actions are the fundamental building blocks of customer actions (browsing, customizing merchandise, cart management, and checkout).

**Independent Test**: Can be verified by rendering each control variant (primary, secondary, outline, destructive, ghost), interacting via mouse/keyboard/screen-reader, and confirming expected visual and semantic states.

**Acceptance Scenarios**:

1. **Given** a user navigates interactive buttons or inputs with keyboard (Tab / Shift+Tab), **When** a component receives focus, **Then** an accessible focus ring is clearly visible and complies with WCAG contrast standards.
2. **Given** a button or input is in a disabled or loading state, **When** a user clicks or presses Enter/Space, **Then** no action is dispatched and the control visually communicates the disabled/loading state.
3. **Given** a form with text inputs, **When** users enter data or clear fields, **Then** inputs reflect appropriate styling, placeholders, and error/validation states.

---

### User Story 2 - Overlay, Dialog, & Sheet Navigation (Priority: P1)

Users opening modals (cookie preferences, product quick-view, confirmation dialogs) or mobile navigation sheets experience accessible focus management (trapping focus inside the dialog, closing on Escape or backdrop click, restoring focus upon close) without jarring layout shifts.

**Why this priority**: Crucial for mobile menu navigation, cookie preferences management, authentication popups, and user confirmation workflows.

**Independent Test**: Can be tested independently by triggering dialogs and sheets, testing keyboard Esc/Tab navigation, verifying backdrop dismissal, and checking focus return.

**Acceptance Scenarios**:

1. **Given** a dialog or sheet is opened, **When** it animates into view, **Then** keyboard focus is constrained within the overlay, and background scrolling is locked.
2. **Given** an open overlay dialog, **When** the user presses Escape or clicks the backdrop/close button, **Then** the overlay closes cleanly and focus returns to the triggering element.

---

### User Story 3 - Visual Presentation & Grouping Containers (Priority: P2)

Users viewing product listings, creator showcase cards, cart line items, and account panels experience clean, elevated card layouts with coherent borders, padding, headers, footers, and badges.

**Why this priority**: Elevates visual hierarchy and brand consistency across both light and dark themes.

**Independent Test**: Can be verified across the home page, creator profile page, and cart page by checking layout consistency, typography scale, and responsive padding.

**Acceptance Scenarios**:

1. **Given** product or creator information displayed in a card container, **When** the viewport resizes from desktop to mobile, **Then** cards adapt responsively while maintaining consistent internal spacing and typography.
2. **Given** dark mode is toggled, **When** viewing cards, separators, and badges, **Then** all background, border, and foreground colors seamlessly transition using design tokens.

---

### User Story 4 - Seamless Modernization of Existing Frontend Pages (Priority: P2)

Existing storefront pages (Header navigation, Footer, Collab form, Cart view, Auth pages, Account dashboard) use the unified UI primitive library rather than ad-hoc, inconsistent inline styles or raw elements.

**Why this priority**: Ensures zero regressions for existing features while creating a cohesive, maintainable codebase that follows shadcn/ui principles.

**Independent Test**: Can be tested by navigating the main application flows (visiting Home, Cart, Collab, Account, Auth) and verifying that all actions function without behavioral regressions.

**Acceptance Scenarios**:

1. **Given** any standard page in the application, **When** inspected or interacted with, **Then** all buttons, inputs, cards, and dialogs are sourced from the unified `@/components/ui` library.

---

### Edge Cases

- **Theme Transition**: What happens when switching between light and dark modes while a modal or dropdown is open? All colors and borders must transition smoothly without contrast artifacts.
- **Mobile Touch vs. Desktop Pointer**: On touch devices, interactive targets must be at least 44x44 CSS pixels to avoid mis-taps.
- **Scroll Lock Invariance**: When multiple layers of overlays (e.g. cookie banner over a sheet or modal) occur, closing one must not prematurely unlock background scroll if another is still open.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide unified, accessible interactive primitives including Button, Input, Textarea, Label, Switch, Slider, and Badge.
- **FR-002**: System MUST provide accessible overlay and disclosure primitives including Dialog, Alert Dialog, Sheet, Dropdown Menu, Tooltip, and Tabs.
- **FR-003**: System MUST provide structural presentation primitives including Card, Separator, and Avatar.
- **FR-004**: All UI components MUST support semantic styling variants, sizes, and composable subcomponents following standard shadcn/ui architectural conventions.
- **FR-005**: All UI components MUST integrate with the project's CSS design system tokens and support both light and dark modes seamlessly.
- **FR-006**: Existing components and pages (`Header`, `Footer`, `CookiePreferencesModal`, `collab`, `cart`, `auth`, `account`) MUST be updated to consume the unified UI component library without breaking existing features.

### Key Entities

- **UI Component Definition**: The reusable, unstyled or lightly styled accessible component exposing polymorphic and variant props (e.g., variant, size, asChild).
- **Theme Token Specification**: The design token definitions (background, foreground, primary, secondary, border, ring, muted, accent) governing the styling of all UI components.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of standard interactive controls (buttons, inputs, dialogs, cards) in the core layout and pages consume the centralized `@/components/ui` components.
- **SC-002**: All interactive components pass WCAG 2.1 AA keyboard accessibility criteria (tabbing, focus indicators, Enter/Space activation, Esc closing).
- **SC-003**: Frontend builds with 0 TypeScript or lint errors and dev server loads all pages without runtime console errors.
- **SC-004**: No visual or functional regressions in existing flows (browsing, cart management, collaboration submission, account details).

## Assumptions

- The project uses Next.js with React 19 and Tailwind CSS v4, so components must be compatible with React 19 peer dependencies and CSS variable theming.
- Components will be installed or created locally under `frontend/components/ui/` with configuration in `frontend/components.json` to allow ongoing management with the shadcn ecosystem.
- Existing custom 3D canvas and dynamic island components (`notch.tsx`, `sonar-grid.tsx`, custom 3D slide effects) will be preserved and harmonized with the new UI library.
