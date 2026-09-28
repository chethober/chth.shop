# CHTH frontend

Next.js 16 (App Router), React 19, Tailwind CSS v4, Three.js via React Three Fiber.

```bash
cp .env.example .env.local   # BACKEND_URL (default http://localhost:5000); /api is proxied there
npm run dev                  # http://localhost:3000
npm run build
```

## Layout

```
app/                 Routes only: metadata + render one feature view. No UI logic here.
features/<name>/     Everything for one page: views, sections, local helpers and content.
  account/  auth/  cart/  collab/  design/  landing/  storefront/  terms/
components/
  ui/                Design-system primitives (shadcn-style): Button, Card, Input, Dialog, …
  shared/            Reusable app pieces: PageHeader, EmptyState, ProductImage, ConfirmButton, …
  layout/            Site header, footer, page container, toast provider.
  three/             Shared React Three Fiber pieces (e.g. offline studio lighting).
  custom/            Self-styled components with their own look (notch, wheel, sonar grid,
                     slide/inline confirm, text-type, …). Keep their styles as they are.
hooks/               useHydrated, useRequireAuth.
lib/                 api client, config, formatting, product helpers, social links, theme.
store/               Zustand stores (auth, cart).
types/               API data types.
styles/              Third-party CSS (HeroUI toasts).
```

Import direction: `app → features → components/lib/store`. Features don't import each other,
except for shared constants (e.g. `features/design/constants`).

## UI conventions

- **Use the primitives.** Buttons are `<Button variant size>`, form fields are `Input` /
  `Textarea` / `Select` / `Label`, containers are `Card` (+ `CardHeader`, `CardTitle`, …).
  Don't hand-roll button or input classes.
- **Theme tokens only.** Colours come from CSS variables in `app/globals.css`:
  `background, foreground, card, muted, primary, secondary, accent, border, ring,
  destructive, success, warning, info, brand`. Use them as Tailwind classes
  (`bg-card`, `text-muted-foreground`, `text-success`, `bg-brand/10`). Avoid raw hex and
  palette colours (`emerald-500`) in app code; they break light/dark consistency.
- **Shape scale:** controls `rounded-lg`, cards and panels `rounded-2xl`, pills `rounded-full`.
- **Type scale:** page title `text-2xl sm:text-3xl font-extrabold`, card title
  `text-base sm:text-lg font-bold`, body `text-sm`, captions `text-xs text-muted-foreground`.
- **Status colours** go through `Badge` variants (`success`, `warning`, `info`, `destructive`, `brand`).
- **Feedback:** toasts via `toast` from `@heroui/react`; confirmations via `ConfirmButton`
  (never `window.confirm`).
- **Client-only state** (auth, cart) is persisted in localStorage; gate on `useHydrated` /
  `useRequireAuth` before rendering it.
