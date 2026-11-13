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

- Frontend fetches use `revalidate: false` and one tag, `posts`; content
  never expires by TTL.
- After every sync, the content engine's deploy calls
  `POST /api/revalidate` (bearer-authenticated), which expires the tag
  with `revalidateTag('posts', { expire: 0 })`. It reads the API before it
  expires anything, and the deploy then reconciles every page with the
  synced content. ADR-0006 says why; the deploy's steps are in
  [tianwei-io-content's README](https://github.com/notbd/tianwei-io-content/blob/main/README.md)
  (Deploy).
- `{ expire: 0 }` expires the entries outright, so the next request to
  each page blocks on a fresh render; `'max'` would have served that
  visitor the previous version once (stale-while-revalidate;
  [Next.js docs, revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)).
- The API sets `Cache-Control: no-store` on `/api/*`, deliberately
  forbidding edge/browser caching so this decision is enforced, not just
  hoped for.

## Consequences

- Invalidations have one target; "is it stale?" has one answer.
- The API pays a database round trip on the first visit to each page
  after a sync, and one request per post (plus the list and the
  categories) for the read before each expiry. That is fine: every other
  visit is served from prerendered pages.
- If API-level caching is ever added for latency, this ADR must be
  superseded first, with an invalidation path for every layer.
- The read before the expiry bypasses the data cache
  (`cache: 'no-store'`), so it writes nothing the expiry would have to
  race.
- What a visitor sees when a page's render fails after the expiry
  depends on the platform. Measured on a Vercel preview deployment in
  2026-11 (Next 16.4.3, a page that throws while rendering, one run per
  case, watched for 45 s):

  | After the expiry | The render succeeds | The render fails |
  | --- | --- | --- |
  | A page generated before | The first request gets the new page (`x-vercel-cache: REVALIDATED`) | The last good version, with a 200 (`STALE`) |
  | A page never generated | Not measured (an ordinary on-demand render) | 500 |

  So on Vercel a post that cannot render keeps showing its previous
  version, and only the deploy's reconcile, which compares each post
  body's hash, tells that apart from success (ADR-0006). Vercel is moving
  its Data Cache to its Runtime Cache
  ([Vercel changelog, 2026-10-30](https://vercel.com/changelog/data-cache-is-moving-to-runtime-cache)); these results predate that move and should be measured
  again after it.
- The same expiry makes a race possible: a page that was rendering when
  the sync committed can read the old rows and store its result after
  the expiry, and it would stay until the next sync (reproduced against
  `next start` in 2026-11). Such a render ends within about 40 s of the
  sync: a page reads the API in two steps at most (a post page reads the
  list, then the post), the read in flight when the sync commits returns
  within its 10 s attempt, and the step after it gives up after about
  30 s (the fetcher's deadlines). So the deploy's second revalidation a
  minute later removes any such write.
