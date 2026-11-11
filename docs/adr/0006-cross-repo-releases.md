# ADR-0006: Cross-repo releases: compatibility order and the deploy handshake

- **Status**: Accepted (2026-11)
- **Repos affected**: all three

## Context

The three repos deploy on their own (ADR-0001), so every release is a
moment when one side runs new code against the live code of the other
two. Before this decision:

- Downstream changes were checked by machine: every frontend build reads
  the production API through its schemas and renders every published
  post. Upstream changes were not: nothing in a content deploy (a post, a
  migration) or an API deploy tried the live downstream before acting.
- The checks proved that pages answered 200, not that they showed what
  was just synced. Measured on a Vercel preview deployment in 2026-11
  (ADR-0002): after `revalidateTag(tag, { expire: 0 })`, a page whose
  render fails keeps serving its last good version with a 200. So a
  post edited into something the frontend cannot render would pass the
  content deploy's page check while the change never went live.
- `/api/revalidate` expired the cache first and read the API afterwards,
  so an API that was down at sync time was found only after the cache
  had been expired.
- The documented release order (content, then API, then frontend,
  additive first) fits adding a column and little else: a new MDX
  component has to reach the frontend first, and dropping a column is
  the reverse.

## Decision 1: the deploy handshake

One rule: **prove to the downstream that the new state works before
changing anything, and reconcile after.** The checks sit in the calls the
content deploy makes to the frontend; the deploy's steps, in order, are
in [tianwei-io-content's README](https://github.com/notbd/tianwei-io-content/blob/main/README.md)
(Deploy).

### Contract gate: `GET /contract.json`

The frontend serves [`https://tianwei.io/contract.json`](https://tianwei.io/contract.json),
generated at build time, without the API, from the table of components a
post may use (`authorComponents` in `src/components/mdx/MdxComponents.tsx`):

- `timeZone`: the display time zone, which must equal the content
  engine's `CONTENT_TIME_ZONE` (ADR-0004).
- `mdx.components`: each component a post may use, with its attributes
  as JSON Schema (`z.toJSONSchema` of a `z.strictObject`, so an attribute
  the schema does not list fails) and whether it takes content between
  its tags.

The content engine turns each schema back into a validator with
`z.fromJSONSchema` and reads only the keys it knows, so keys may be added
to the contract but never changed. `pnpm check:contract` holds every post
to it, drafts included (they are synced, and draft preview renders them).
The deploy runs it with `--require` before the migration: a post the
frontend cannot take, or a frontend with no contract to give, stops the
deploy with the database untouched. A pull request runs it without
`--require`, which only warns when the frontend has no contract to give
(a 404 or a network error).

Both ends parse a body with the same syntax (MDX with GFM) and check every
JSX element the author wrote, on the syntax tree, in the same five steps:

1. No JavaScript: no `{expression}` or spread attribute, no fragment
   (`<>`), no member name (`<A.B>`). Imports, exports and `{expressions}`
   anywhere in the body are refused too.
2. The name is a component the contract lists.
3. Every attribute has a value (`<MdxImage priority />` has none).
4. No attribute is written twice, and all of them, as written, pass the
   component's schema as one object, so `children="x"` and `key="x"`
   fail like any other attribute the schema does not list.
5. A component that takes no content has none.

So a post body is Markdown plus the listed components, with string
attributes their schemas accept: no JavaScript and no other JSX. Every
sync runs the syntax check and steps 1 and 3; steps 2, 4 and 5 need the
contract. Both repos test the same list of inputs against these steps.

### Read before expiry: `POST /api/revalidate`

The frontend reads the post list, every post on it and the categories
straight from the API (`cache: 'no-store'`), through the schemas its
pages use, four requests at a time and within 25 s in all, retries
included. Only when every read works does it expire the `posts` tag
(ADR-0002); otherwise it expires nothing. Its statuses and bodies are in
[this repo's README](../../README.md) (Revalidation API).

Expiring first would leave every page to render against an API that may
not answer. On Vercel an existing page then keeps its previous version,
but a new post has none and answers 500. Reading first keeps the site as
it was and turns the deploy red.

### Reconcile: every page, and each post body by its hash

Each `/posts/<slug>` page carries
`<meta name="post-body-sha256" content="...">`: the SHA-256, in lowercase
hex, of the post's `content` exactly as the API returned it (UTF-8, not
trimmed). The metadata and the page share one read (`React.cache`), so
the hash describes the body on the page. Static regeneration stores a
page only when its whole render succeeds, so a body that fails to render
leaves the previous page, and its previous hash, in place.

After its second revalidation the content deploy reconciles: it requests
every page the sitemap lists and compares each post page's hash with the
body it just synced. The full list of checks, with their timeouts and
retries, is in [tianwei-io-content's README](https://github.com/notbd/tianwei-io-content/blob/main/README.md)
(Deploy).

The hash covers only the body: the body is the part that can fail to
render, while the title and description differ between the files and
the pages in ways that do not matter (the frontend reads an empty
description as `null`) and would raise false alarms. The reconcile never
uses draft mode, whose responses stream: there, a render that fails late
cannot change a 200 already sent.

### The exception: the API deploy

The API's deploy makes the new Worker version live first, then verifies
it, and restores the version that was live before when the verification
fails (steps in [tianwei-io-api's README](https://github.com/notbd/tianwei-io-api/blob/main/README.md),
Deploy). When the commands end normally, a bad version is live for about
two minutes: the 90 s verification budget plus the rollback (an estimate;
the job's limit is 15 minutes). In that window the calls that reach the
API are the frontend's builds, the read before expiry (which then expires
nothing), the renders right after a content deploy's expiry, and draft
preview. The static pages visitors get do not call the API.

Considered and deferred: upload the version at 0% of traffic
(`wrangler versions upload`), verify it through the
`Cloudflare-Workers-Version-Overrides` header, then move it to 100%. It
needs no rollback, but an uploaded version does not carry triggers and
the other settings that are not versioned, so it would need a separate
`wrangler triggers deploy` to keep `wrangler.jsonc` the one source of
configuration. It is the larger change, and it cannot be rehearsed
locally either.

## Decision 2: which repo ships first

Invariant: **at every moment, the reading side accepts whatever the
writing side produces.** It holds on every edge between the repos:

- the table schema: the content engine writes, the API reads;
- the wire format: the API writes, the frontend reads;
- the MDX contract: posts are written in the content engine, the
  frontend renders them;
- what the frontend gives the content deploy: `/contract.json`, the
  revalidate body and its `revalidated` answer, `post-body-sha256`, and
  the addresses the reconcile reads (`/sitemap.xml` and every page it
  lists, with post pages at `/posts/<slug>`, `/feed.xml`, each post's
  `/opengraph-image`, a 404 for a draft).

The test for a change has two questions. Once this side's change is
live, can every other live side its data flows to (not only the next
one) keep working with what this side produces, now and later? And can
this side keep working with what the live sides it reads from (directly
or through another side) can produce today? If both are yes, this side
ships first. If either is no, the other side changes first. A rename or
a type change is two releases: add the new one, then remove the old one.

| Change | Ships first | If the order is wrong, who notices and when |
| --- | --- | --- |
| Add a column the API then reads | Content engine, then API | API first: its deploy verification reads a full row, fails, and restores the previous version |
| Add a wire field the frontend then uses | API, then frontend | Frontend first: its pull request's build, which reads the production API, fails |
| Add an MDX component posts then use | Frontend, then content | Content first: the content pull request's `check:contract` fails, and the deploy stops at the contract gate before writing |
| Drop a column | The API stops reading it, then the content engine drops it | Content first: right after the migration, the same deploy's read before expiry fails (502), with the database already changed and the API failing until it is fixed |
| Drop a wire field | The frontend stops reading it, then the API drops it | API first: its own deploy verification passes; the next content deploy's read before expiry (502) or the next frontend build fails |
| Remove an MDX component, or tighten its attributes | The posts stop using it or meet the new rule, then the frontend changes | Frontend first: its own pull request's build fails, since it renders every published post. When only a draft uses it, that build is green (it does not render drafts), and the next content deploy stops at the contract gate with the database untouched |
| Widen a value's range (a field may be null, an enum gains a value) | The reader accepts it, then the writer produces it | Writer first. Table: the same content deploy's read before expiry fails (502), with the database written and the site unchanged. Wire: the API deploy is green; the next content deploy's read before expiry (502) or the next frontend build fails. MDX attribute: the content pull request's `check:contract` fails, and the deploy is refused before writing |
| Narrow a value's range (no longer null, one enum value fewer; table or wire) | The writer stops producing the old values and clears the stored ones, then the reader tightens | Reader first. If a stored value is already old, a frontend that tightens fails at once, in its own pull request's build against the production API. Otherwise the reader stays green until the writer next produces an old value; then the read before expiry fails (502) or a frontend build fails. The API does not validate the rows it reads, so narrowing only the table is never caught. Only this rule prevents it |
| Rename or change anything the frontend gives the content deploy (the last item of the list above) | Before their first release, both sides together; after it, as a rename | The content deploy's contract gate, the revalidation (a 400, or a 200 without `posts` in `revalidated`) or the reconcile fails |

### Rolling the frontend back

The content deploy reads the live frontend's `/contract.json`, so rolling
the frontend back to a version without one stops every later content
deploy before it migrates. To recover:

- Rolled back with `git revert`: merge a fix that restores the contract;
  Vercel deploys it as usual.
- Rolled back with Vercel's Instant Rollback: Vercel stops assigning the
  production domain to new deployments, so a merged fix builds but does
  not go live. Once the fix's production build is Ready, promote that
  deployment (the Manage button on the project's production deployment,
  or `vercel promote <deployment URL>`), which turns that assignment back
  on. Do not pick the deployment that was rolled back.
  (https://vercel.com/docs/instant-rollback)

Either way, once `https://tianwei.io/contract.json` answers 200, run the
content deploy by hand on `main` (Actions > Deploy Content to Neon > Run
workflow): the changes it stopped reach the database only that way.

## Accepted gaps

1. The reconcile proves "new" only for post bodies. The home page,
   `/posts`, the category pages, the feed, the Open Graph images and the
   sitemap are proven to answer 200 (and the sitemap to list exactly the
   published posts), not to be current; a deploy that changes only a
   title or a description is one case of this.
2. Nothing proves, before the migration, that it suits the live API.
   When it does not, the API fails until its next deploy, and the cache
   stays as it is because the read before expiry fails.
3. A render failure the contract cannot express (a remark or rehype
   plugin that throws) is found after the write, by the reconcile: an
   existing post stays at its previous version, a new post answers 500.
4. A frontend deploy that overlaps a content deploy can go live with
   content from before the sync, after the content deploy has
   revalidated. Until the next revalidation a new post is then a 404,
   because the cached list is the door to post pages.
5. If the API stops answering after the read and before the pages
   render again (an overlapping API deploy, a Neon outage), existing
   posts stay at their previous version, a new post answers 500, and the
   reconcile fails; run the deploy again once the API is back.
6. A breaking API change turns red only at the next content deploy or
   frontend build.
7. The two Drizzle schemas (the content engine's and the API's copy) are
   kept identical by hand. Between the two releases of a column change
   (adding or dropping one, table above) they differ on purpose.
8. The API deploy is the exception above. If the restore step fails (it
   cannot read the live version, or the rollback does not take), the
   runner dies, or the job is cancelled by force, the bad version stays
   live, as before this decision. The log names the version that was
   live before the deploy and, if the restore step failed, the command
   that restores it by hand.
9. The reconcile does not request the page of a post whose file was
   deleted. The sitemap no longer lists it, but the page's own 404 is not
   checked by that deploy.
10. The parts of the five steps the contract cannot carry (steps 1 and 3,
    how step 4 treats `children` and `key`, what step 5 means) are
    written once in each repo, and the shared test inputs are copied into
    both; no machine checks that the copies agree. Each repo upgrades its
    own `@mdx-js/mdx` and `remark-gfm`, and one side could add a syntax
    plugin without the other. A drift fails safe: a stricter content
    engine refuses more, a stricter frontend is caught by the reconcile.
    A draft passes only the contract gate: the reconcile checks only that
    its page is a 404, and the frontend's build does not render it.
11. A manual `DATABASE_URL=... pnpm sync:prod` skips the contract gate,
    the revalidation and the reconcile. That manual path is deliberate.

## Consequences

- A new restriction for posts: a tag such as `<kbd>`, `<sup>` or
  `<details>` cannot be written until it is added to the frontend's
  component table with a strict attribute schema, and the frontend ships
  first (table above).
- The content repo's pull-request check reads the production frontend,
  and only warns when the frontend has no contract to give (a 404 or a
  network error, Decision 1); any other failure fails it. Its deploy needs
  the frontend, as it did before.
- The content deploy's frontend is a constant (`https://tianwei.io`), not
  a secret, so it cannot be pointed at another environment by mistake.
- This decision itself ships frontend first: the content deploy's gate
  reads the frontend's `/contract.json`.
- Not chosen: a shared package (ADR-0001 says why), and running all
  three repos together in each pull request, which is deferred; it would
  not cover failures at production time.
