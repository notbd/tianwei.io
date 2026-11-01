# ADR-0005: No speculative database pre-warming

- **Status**: Accepted (2026-07, amended 2026-10-31)
- **Repos affected**: tianwei.io, tianwei-io-api (Neon usage pattern)

## Context

Neon's free-tier compute suspends after ~5 idle minutes; the first query
after suspension pays a ~0.5–1s wake. Several mitigations were considered,
including a beacon fired on homepage load so the database is warm "by the
time it's needed."

The deciding fact: **visitors almost never need it**. Every visitor-facing
route is prerendered (ADR-0003); the database is only touched by CI builds,
post-sync cache warming (where the sync itself has already woken the
compute), the first visit to each page after a content sync (ADR-0002,
amended 2026-10-31), and the author's draft preview. Cold start is a real
latency, but almost nobody stands in front of it.

## Decision

Rejected:

- **Homepage warm beacon**: warms the database for visitors who will
  never query it; each wake keeps compute billed for ≥5 minutes, so
  sporadic traffic approaches always-on usage (about 183 CU-hours a
  month at the 0.25 CU minimum, against the Free plan's 100 CU-hours per
  project, https://neon.com/pricing, checked 2026-11-01) with zero
  visitor-visible gain; and an
  unauthenticated "wake my database" endpoint is a cost-amplification
  lever of the same class as the fail-open warming bug fixed in the
  audit.
- **Cron keep-alive ping**: always-on with extra steps: the same usage,
  which exceeds the free allowance (a project that uses it up is
  suspended until the next month), and it defeats
  scale-to-zero by deception. If always-warm is ever genuinely needed,
  pay to disable autosuspend instead.
- **API-level caching**: already forbidden by ADR-0002 (single cache
  layer).

Accepted (the one targeted exception):

- **Preview-flow pre-warm**: `/api/preview` fires a best-effort,
  post-response (`after()`) fetch of the cheapest API query once, and
  only once, authentication has passed. This is the single path where
  a human actively waits on a possibly-cold compute, the redirect +
  render window gives the wake a head start, and the trigger is
  secret-gated so there is no public wake surface.

## Consequences

- Visitor latency is governed by the CDN, except on the first visit to each
  page after a content sync (see the amendment below).
- The author's first draft preview after idle gets most of the wake
  hidden inside the redirect; subsequent previews are warm anyway.
- If a future feature puts the database on a visitor-facing path, this
  ADR must be revisited: the correct order is "make the path static or
  cached first, pre-warm only if a human still waits."
- Amended 2026-10-31: ADR-0002 now expires tags with `{ expire: 0 }`, so
  the first visit to each page after a sync renders on demand and reaches
  the database through the API. A visitor who arrives after the compute
  has suspended pays the wake on top of that render. Accepted as the price
  of freshness; warming for it would take a beacon or a keep-alive, which
  stay rejected for the reasons above.
