<!-- markdownlint-disable MD007 MD033 MD041 -->
<samp>
<h1>tianwei.io</h1>

[![CI](https://github.com/notbd/tianwei.io/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/notbd/tianwei.io/actions/workflows/ci.yml)

The frontend layer of my personal website [tianwei.io](https://tianwei.io).

<h2>Stack</h2>

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **MDX Processing**: [MDX](https://mdxjs.com) (`@mdx-js/mdx`) with remark/rehype plugins and [rehype-pretty-code](https://rehype-pretty.pages.dev)
- **Data Validation**: [Zod](https://zod.dev)
- **Image Optimization**: [Cloudinary](https://cloudinary.com)
- **Testing**: [Vitest](https://vitest.dev) (unit/contract) + [Playwright](https://playwright.dev) (browser smoke)
- **Deployment**: [Vercel](https://vercel.com)

<h2>Site Architecture</h2>

The site is split into three repos, each deployed on its own:

- **[Frontend](https://github.com/notbd/tianwei.io)** (this repo): a Next.js app that renders every page as static HTML from data it fetches through the API.
- **[API Layer](https://github.com/notbd/tianwei-io-api)**: a read-only REST API on Cloudflare Workers that serves the published posts from Postgres.
- **[Content Engine](https://github.com/notbd/tianwei-io-content)**: the posts themselves, written in MDX, validated and synced into Postgres on Neon.

A post goes live in three steps:

1. A push to `main` in the content engine syncs every post into Postgres in one transaction.
2. The same deploy calls this repo's `/api/revalidate`.
3. The frontend expires its cached data and renders the pages again through the API.

The frontend's data cache is the only cache in the system (the API does not cache), so step 2 is the one place where new content takes effect. Three services is more than a personal site needs; I split it on purpose, to practice what only exists between services: API contracts, independent deploys and cache invalidation across repos ([ADR-0001](./docs/adr/0001-three-tier-architecture.md)).

<h2>How It Works</h2>

- **Static pages, refreshed on demand**: the home page, the post list, every post and category page, the RSS feed, the sitemap and each post's Open Graph image are generated at build time. Their API fetches are cached under tags (`posts`, `post-<slug>`) that never expire on a timer; only a revalidation refreshes them ([ADR-0002](./docs/adr/0002-single-cache-layer.md)).
- **Resilient fetching**: every API request has a 10 s deadline and is retried on network errors, timeouts and 5xx (3 attempts with backoff), so a brief API failure delays a render instead of breaking it, and a hung API fails it in about 30 s instead of never. A build refuses an empty post list, and a post page only 404s when the API says the post does not exist.
- **MDX without code**: posts are compiled on the server with `@mdx-js/mdx`. Imports, exports and `{expressions}` are refused, so a post can never run code on the server; the content engine rejects the same at sync time.
- **Cookie-free theme**: an inline script applies the saved light or dark theme before the first paint, so no page has to render per request ([ADR-0003](./docs/adr/0003-cookie-free-theme.md)).
- **One time zone**: dates display in `America/New_York`, the zone the content engine anchors them to ([ADR-0004](./docs/adr/0004-display-time-zone.md)).
- **Draft preview**: `/api/preview?secret=<PREVIEW_SECRET>&slug=<slug>` turns on Next.js draft mode and renders an unpublished post through the API's preview endpoint; `/api/preview/disable` turns it off.

<h2>Revalidation API</h2>

`POST /api/revalidate` expires cached data, then fetches it back through the API to prove the API serves the new content. The content engine calls it after every sync:

```shell
curl -X POST https://tianwei.io/api/revalidate \
  -H "Authorization: Bearer $REVALIDATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["posts"]}'
```

- **Body**: `{"tags": [...]}`, `{"tag": "..."}` or `{"slug": "..."}` (which expires `post-<slug>` and `posts`). Every fetch carries the `posts` tag, so expiring `posts` refreshes the whole site.
- **Response**: `200` when the tags were expired and their data fetched back; `207` when the tags were expired but a fetch failed (the content deploy fails on it); `401` without the right secret; `400` for a body without `tags`, `tag` or `slug`.

<h2>Local Run</h2>

Prerequisites: **Node.js 26** (see `.nvmrc`) and **pnpm 10**.

```shell
git clone git@github.com:notbd/tianwei.io.git
cd tianwei.io
pnpm install
cp .env.example .env.local   # the defaults work as-is against the production API
pnpm dev
```

> **Notes**:
>
> 1. Typography and code highlighting are handled by custom React components within `src/components/mdx` and via the `rehype-pretty-code` package respectively.
> 2. Post images are served from Cloudinary by their public id through `src/lib/cloudinaryLoader.ts`, so `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` must be set or the build fails.

<h2>Configuration</h2>

| Variable | Purpose |
| --- | --- |
| `CONTENT_API_URL` | The API's base URL (`https://tio.twz.app`, public and read-only) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | The Cloudinary account that hosts post images |
| `REVALIDATION_SECRET` | Bearer token for `/api/revalidate`; must match the content engine's |
| `PREVIEW_SECRET` (optional) | Enables draft preview; must match the API's |

<h2>Quality Gates</h2>

```shell
pnpm lint        # type-aware ESLint
pnpm typecheck
pnpm test        # Vitest: API contract, fetcher, cache and revalidation, MDX, feed, sitemap
pnpm build
pnpm test:e2e    # Playwright smoke tests against the production build
```

`pnpm test:e2e` needs Chromium once per Playwright version: `pnpm exec playwright install chromium`. CI (`.github/workflows/ci.yml`) runs all five on every pull request and on pushes to `main`, with no secrets: the two values the build needs are public and inlined in the workflow.

<h2>Deploy</h2>

Vercel deploys `main` to production and every other branch to a preview URL. Content changes never need a frontend deploy; they arrive through `/api/revalidate`. A change that spans repos ships content → API → frontend, additive first; the release checklist is [`docs/release-verification.md`](./docs/release-verification.md), and design records are in [`docs/adr/`](./docs/adr/).

<h2>License</h2>

Source code is licensed under <a href='./LICENSE'>AGPLv3</a>.<br>
The content is licensed under <a href='https://creativecommons.org/licenses/by-nc-sa/4.0/'>CC BY-NC-SA 4.0</a>.
</samp>
