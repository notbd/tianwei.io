# ADR-0002: Exactly one cache layer, owned by the frontend

- **Status**: Accepted (2026-07, warming rationale revised 2026-10)
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
  (bearer-authenticated) after every sync; the frontend expires the tags
  (`revalidateTag(tag, { expire: 0 })`) and re-fetches them through the
  API in the same request (the "warm"). The next request to each affected
  page blocks on a fresh render.
- The API sets `Cache-Control: no-store` on `/api/*` — deliberately
  forbidding edge/browser caching so this decision is enforced, not just
  hoped for.
- A partial warm returns HTTP 207 and **fails the content deploy**: the
  warm is the end-to-end proof that the API serves the synced content.

## Consequences

- Invalidations have one target; "is it stale?" has one answer.
- The API pays a DB round trip on every cache-warming request — fine,
  because real visitors are served from prerendered pages, and the warming
  fleet is tiny.
- If API-level caching is ever added for latency, this ADR must be
  superseded first, with an invalidation path for every layer.
- Amended 2026-10-31: `{ expire: 0 }` replaced the `'max'` profile, and
  the warm is a check, not a refill: Next applies the expiry after the
  route handler returns, so the warm's own cache writes expire with the
  rest, and the first visit to each affected page after a sync renders
  fresh and needs the API to be up (the fetcher retries transient
  failures). `'max'` would have served that visitor the previous version
  once (stale-while-revalidate, see
  https://nextjs.org/docs/app/api-reference/functions/revalidateTag) and
  never errored; this decision is after freshness, so it takes one
  API-dependent render per page per sync instead.
