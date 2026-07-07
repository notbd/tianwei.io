# ADR-0003: Cookie-free theming to keep every route static

- **Status**: Accepted (2026-07)
- **Repos affected**: tianwei.io

## Context

The original theme system persisted the user's choice in a cookie and read
it in the root layout (`cookies()`) so the server could render the correct
toggle icon on the first paint. Reading cookies in the root layout opts
**every route** into dynamic rendering. Measured effect: the entire site
served `x-vercel-cache: MISS` with `private, no-store`; each post visit
re-ran SSR + Shiki highlighting (~3s cold TTFB, ~0.5s warm). One icon's
anti-flash bought the loss of all static rendering.

## Decision

Move theme state fully client-side; the server renders theme-agnostic
markup:

- next-themes' inline script keeps applying the `dark` class before paint
  (unchanged).
- A second tiny inline script — first element in `<body>` — mirrors the
  stored choice from localStorage into `data-theme-choice` on `<html>`
  before first paint.
- The toggle renders **all three icons**; CSS shows exactly one based on
  `data-theme-choice`. No hydration gate, no cookie, no flash.
- The toggle's click handler updates both next-themes state and the
  attribute.

## Consequences

- `/`, `/posts`, and every post page are prerendered again (post TTFB
  ~3s → ~30ms locally; edge-cached globally on Vercel).
- Guarded against regression: `generateStaticParams` refuses an empty
  catalog, post pages only swallow true 404s, and a Playwright test pins
  the toggle cycle + persistence across reload.
- Users without JavaScript see the system-theme icon and no toggle
  behavior — acceptable, since theming itself requires JS.
- The pattern generalizes: any per-user state read during server render
  of shared layouts silently destroys static rendering. Keep per-user
  state client-side or behind dynamic islands.
