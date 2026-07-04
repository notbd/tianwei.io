# ADR-0002: Exactly one cache layer, owned by the frontend

- **Status**: Accepted (2026-07)
- **Repos affected**: all three

## Context

Content changes rarely (git pushes) but must propagate promptly when it
does. Three places could plausibly cache: Postgres-side, the API edge
(Cloudflare), and the Next.js data cache. Every additional cache layer
multiplies invalidation complexity: a sync would need to invalidate all of
them, in order, atomically-ish — and any missed layer serves stale data
with no error anywhere.

## Decision

The **Next.js data cache is the only cache**:

- Frontend fetches use `revalidate: false` + tags (`posts`, `post-<slug>`);
  content never expires by TTL.
- The content engine's deploy pipeline calls `POST /api/revalidate`
  (bearer-authenticated) after every sync; the frontend invalidates tags
  and immediately **warms** them by re-fetching, so the first visitor
  never pays the refill.
- The API sets `Cache-Control: no-store` on `/api/*` — deliberately
  forbidding edge/browser caching so this decision is enforced, not just
  hoped for.
- A partial warm returns HTTP 207 and **fails the content deploy**,
  making a cold cache a visible failure instead of a silent slowdown.

## Consequences

- Invalidations have one target; "is it stale?" has one answer.
- The API pays a DB round trip on every cache-warming request — fine,
  because real visitors are served from prerendered pages, and the warming
  fleet is tiny.
- If API-level caching is ever added for latency, this ADR must be
  superseded first, with an invalidation path for every layer.
