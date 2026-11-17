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
- **One system** (the CHTH kit's shapes, checked with the taste skill's `consistency.mjs`):
  - *Buttons* are pills: `Button` at 44px (`default`) for actions, 36px (`sm`) inside rows and
    cards. One filled button marks the main action of a view; everything else is outline.
    Filter chips (`FilterChip`) are the small button's shape; segmented controls and steppers
    use `segmented` / `stepperTrack` from `components/shared/segmented`.
  - *Fields* are 44px with 16px text (phones don't zoom in).
  - *Boxes*: a card is `Card` or a `tile` (`components/shared/tile`, for linked product and
    design tiles: lifts 2px, picture zooms 3%); inside a card, info sits in an inset
    (`rounded-xl bg-muted/50`, no border). Never a box in a box in a box.
  - *Labels* are `text-label` (13px, sentence case), never tracked capitals.
  - *Width*: every page sits on one 64rem column (`PageContainer`), the navbar's and footer's.
  - *Motion*: buttons step up on hover and press on click; only a hero enters on load (CSS,
    so it shows without scripts); nothing fades in as it is scrolled to; nothing loops forever.
  - *Touch and contrast*: 44px targets on touch screens; text people read at 7:1, labels and
    badges at 4.5:1 in both themes.
- **Shape scale:** fields `--chth-field-radius`, inner panels `rounded-xl`, cards `rounded-2xl`,
  buttons, chips and segmented controls `rounded-full`.
- **Fonts:** the CHTH kit's faces, self-hosted in `app/layout.tsx`: Plus Jakarta Sans for text
  (`font-sans`), Outfit for `h1`–`h3` (`font-display`), JetBrains Mono for code (`font-mono`).
  Don't add other families; `font-serif` isn't defined.
- **Type scale:** page title `text-2xl sm:text-3xl font-extrabold`, card title
  `text-base sm:text-lg font-bold`, product tile title `text-base`, body `text-sm`, captions
  `text-xs text-muted-foreground`. A figure is never set larger than the page's headings.
- **Numbers** in panels use `Stat` (`card` or `inset`); single-outcome screens (payment status,
  sign-in callback, verify) use `StatusCard`; anything empty uses `EmptyState`.
- **Brand colours** for third parties are tokens too: `text-ton`, `bg-telegram`.
- **Status colours** go through `Badge` variants (`success`, `warning`, `info`, `destructive`, `brand`).
- **Feedback:** toasts via `toast` from `@heroui/react`; confirmations via `ConfirmButton`
  (never `window.confirm`).
- **Client-only state** (auth, cart) is persisted in localStorage; gate on `useHydrated` /
  `useRequireAuth` before rendering it.
