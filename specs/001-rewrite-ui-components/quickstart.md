# Quickstart: UI Component Modernization Validation Guide

**Feature**: Rewrite UI Components with shadcn/ui
**Status**: Ready for Verification

---

## 1. Prerequisites & Setup

Ensure the workspace dependencies are cleanly resolved:

```bash
# From repository root
cd frontend

# Install necessary shadcn & Radix dependencies
yarn add class-variance-authority @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-switch @radix-ui/react-slider @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-avatar @radix-ui/react-tooltip embla-carousel-react
```

Verify that `frontend/components.json` exists with correct aliases pointing to `@/components` and `@/components/ui`.

---

## 2. Automated Type-check and Build

Run full TypeScript compilation and Next.js production build:

```bash
# Run TypeScript compilation check
cd frontend
npx tsc --noEmit

# Run Next.js build validation
yarn build
```

Expected output:
- `tsc --noEmit` exits with status `0` (no type errors).
- `yarn build` produces production static/dynamic routes successfully without build errors.

---

## 3. Visual & Interaction Verification Scenarios

### Scenario A: Button Variants & Focus States
1. Navigate to `/collab` or `/design`.
2. Inspect primary, secondary, outline, and ghost buttons.
3. Use the `Tab` key to navigate between buttons:
   - **Verification**: Ensure a distinct, high-contrast ring appears around the active button.
   - **Verification**: Press `Enter` or `Space` to activate.

### Scenario B: Dialog & Overlay Focus Trap
1. Click "Customize Cookies" in the cookie banner or footer to open `CookiePreferencesModal`.
2. **Verification**:
   - Focus is automatically placed inside the dialog.
   - Pressing `Tab` repeatedly cycles only through focusable elements inside the dialog (does not leak to the background).
   - Pressing `Escape` or clicking outside the modal content dismisses the dialog cleanly.
   - Background body scroll is locked while the dialog is open.

### Scenario C: Mobile Navigation Sheet
1. Set viewport to mobile dimensions (< 768px).
2. Click the Hamburger menu icon in the `Header`.
3. **Verification**:
   - The navigation drawer slides in smoothly from the side.
   - Navigation links (`Home`, `Collab`, `Design`, `Cart`) are accessible and click-friendly.
   - Clicking the close button or backdrop dismisses the drawer smoothly.

### Scenario D: Dark / Light Mode Theming
1. Click the theme toggle icon in the header.
2. **Verification**:
   - Background transitions from light (`hsl(40, 20%, 98%)`) to dark (`hsl(240, 10%, 3.9%)`).
   - Cards, dialogs, buttons, inputs, and text adjust their foreground and border colors automatically with no illegible text.

---

## 4. Regression Testing
Test existing business routes:
- `/` (Home page with hero & 3D card carousel)
- `/collab` (Artist application form)
- `/design` (3D merchandise customizer)
- `/cart` (Cart items & checkout summary)
- `/auth` (Login and registration forms)
- `/account` (User profile dashboard)
