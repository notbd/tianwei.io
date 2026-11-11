# ADR-0005: No speculative database pre-warming

- **Status**: Accepted (2026-07, amended 2026-10-31)
- **Repos affected**: tianwei.io, tianwei-io-api (Neon usage pattern)

## Context

Neon's free-tier compute suspends after ~5 idle minutes; the first query
after suspension pays a wake of ~0.5 to 1 s. Several mitigations were
considered, including a beacon fired on homepage load so the database is
warm "by the time it's needed."

The deciding fact: **visitors almost never need it**. Every visitor-facing
route is prerendered (ADR-0003); the database is only touched by builds,
the API deploy's verification, the API read the frontend makes before it
expires its cache after a sync (where the sync itself has already woken
the compute), the renders right after that expiry (ADR-0002; the content
deploy's reconcile requests every page, see Consequences), and the
author's draft preview.
Cold start is a real latency, but almost nobody stands in front of it.

## Decision

Rejected:

- **Homepage warm beacon**: warms the database for visitors who will
  never query it; each wake keeps compute billed for ≥5 minutes, so
  sporadic traffic approaches always-on usage (about 183 CU-hours a
  month at the 0.25 CU minimum, against the Free plan's 100 CU-hours per
  project, https://neon.com/pricing, checked 2026-11-01) with zero
  visitor-visible gain; and an unauthenticated "wake my database"
  endpoint is a cost-amplification lever of the same class as the
  2026-07 bug that let anyone call `/api/revalidate` while its secret was
  unset.
- **Cron keep-alive ping**: the same always-on usage, which exceeds the
  free allowance (a project that uses it up is suspended until the next
  month). If always-warm is ever genuinely needed, pay to disable
  autosuspend instead.
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

- Visitor latency is governed by the CDN. After a content sync, ADR-0002
  expires the cache with `{ expire: 0 }` (since 2026-10-31), so each page
  renders once more, through the API. The content deploy's reconcile
  requests every page right after its second revalidation, while the sync
  and the reads before expiry have the compute awake, so its requests,
  not visitors, pay for those renders. Only a visitor who opens a page
  between the first revalidation and the reconcile's request for it
  renders that page on demand, with the compute already awake. Accepted
  as the price of freshness.
- The author's first draft preview after idle gets most of the wake
  hidden inside the redirect; subsequent previews are warm anyway.
- If a future feature puts the database on a visitor-facing path, this
  ADR must be revisited: the correct order is "make the path static or
  cached first, pre-warm only if a human still waits."
