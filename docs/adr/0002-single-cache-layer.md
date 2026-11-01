# ADR-0002: Exactly one cache layer, owned by the frontend

- **Status**: Accepted (2026-07; revised 2026-10 and 2026-11)
- **Repos affected**: all three

## Context

Content changes rarely (git pushes) but must propagate promptly when it
does. Three places could plausibly cache: Postgres-side, the API edge
(Cloudflare), and the Next.js data cache. Every additional cache layer
multiplies invalidation complexity: a sync would need to invalidate all of
them, in order, atomically-ish, and any missed layer serves stale data
with no error anywhere.

## Decision

The **Next.js data cache is the only cache**:

- Frontend fetches use `revalidate: false` + tags (`posts`, `post-<slug>`);
  content never expires by TTL.
- The content engine's deploy pipeline calls `POST /api/revalidate`
  (bearer-authenticated) after every sync; the frontend expires the tags
  (`revalidateTag(tag, { expire: 0 })`) and re-fetches them through the
  API in the same request (the "warm"). The next request to each affected
  page blocks on a fresh render; `'max'` would have served that visitor
  the previous version once (stale-while-revalidate,
  https://nextjs.org/docs/app/api-reference/functions/revalidateTag).
- The deploy revalidates a second time a minute later, then requests every
  page in the sitemap and fails unless each answers 200.
- The API sets `Cache-Control: no-store` on `/api/*`, deliberately
  forbidding edge/browser caching so this decision is enforced, not just
  hoped for.
- A partial warm returns HTTP 207 and **fails the content deploy**: the
  warm is the end-to-end proof that the API serves the synced content.

## Consequences

- Invalidations have one target; "is it stale?" has one answer.
- The API pays a DB round trip on every cache-warming request and on the
  first visit to each page after a sync (see below). That
  is fine: every other visit is served from prerendered pages, and the
  warming fleet is tiny.
- If API-level caching is ever added for latency, this ADR must be
  superseded first, with an invalidation path for every layer.
- The warm is a check, not a refill. Next applies the expiry when the
  route handler returns and treats any cache write that lands later as
  fresh, so some of the warm's writes survive and some expire, depending
  on which finishes first; both hold the synced data. The first visit to
  a page whose entry expired renders fresh and needs the API to be up
  (the fetcher retries transient failures). Choosing `{ expire: 0 }`
  over `'max'` trades that one API-dependent render per page per sync
  for never showing the previous version.
- The same rule makes a race possible: a page that was rendering when
  the sync committed can read the old rows and store its result after
  the expiry, and it would stay until the next sync (reproduced against
  `next start` in the 2026-11 audit). Renders give up after about 30 s
  (the fetcher's deadlines), so the deploy's second revalidation a minute
  later removes any such write. The final page check also renders every
  page once with the new content, so a post the frontend cannot render
  fails the deploy instead of a visitor's request.
