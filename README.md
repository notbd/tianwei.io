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

- **[Frontend](https://github.com/notbd/tianwei.io)**: this repo, a Next.js application rendering content from the API with static generation and on-demand revalidation.
- **[API Layer](https://github.com/notbd/tianwei-io-api)**: a Hono service on Cloudflare Workers that serves content data from the content engine via REST endpoints.
- **[Content Engine](https://github.com/notbd/tianwei-io-content)**: a dedicated repo that stores, parses and syncs MDX to a remote PostgreSQL database.

Note: previously this site incorporated [Contentlayer](https://contentlayer.dev) to manage frontend and content data in a single repo. I have since moved to a decoupled architecture that separates the frontend and backend which allows for better flexibility and scalability.

<h2>Rendering & Caching Model</h2>

Every route is **fully static**:

- Post pages are prerendered at build time (`generateStaticParams`); the posts list and home page are static too.
- Data fetches use the Next.js data cache with `revalidate: false` + tags: content only changes through **on-demand revalidation** (see below), never by TTL. Revalidation expires the tags outright (`{ expire: 0 }`), so the first request after a content sync renders fresh content instead of a stale copy.
- The theme system is deliberately cookie-free: an inline pre-paint script reads the choice from localStorage and drives both the `dark` class (next-themes) and the toggle icon (CSS on a `data-theme-choice` attribute). No server-side theme state means no dynamic rendering.
- All dates render in **`DISPLAY_TIME_ZONE`** (`America/New_York`) through the single `formatPostDate()` helper; storage stays UTC instants. Must match the content engine's `CONTENT_TIME_ZONE` (see [ADR-0004](./docs/adr/0004-display-time-zone.md)).
- `generateStaticParams` refuses to build an empty catalog, and a post page only 404s when the API says the slug names no post (404, or 400 for a malformed slug); any other fetch failure fails the build loudly instead of silently dropping pages. The fetcher (`src/lib/api/fetcher.ts`) retries transient failures (network errors, timeouts, 5xx) with backoff and gives every attempt a 10 s deadline, so a hung API fails a build or render in about 30 s instead of never. The per-attempt signal also opts each retry out of Next's request memoization, without which a retry inside a render would get the first attempt's failure back without a request.
- `/feed.xml` (RSS), `/categories/[category]` pages, and per-post OG images (`opengraph-image.tsx` has its own `generateStaticParams`) are all statically generated from the same tagged data, so one revalidation refreshes everything.
- Posts compile with `@mdx-js/mdx` on the server. A post's JavaScript would run there, so `src/lib/mdx.tsx` refuses imports, exports, `{expressions}` and expression props (components take string props); the content engine rejects the same at sync time.
- **Draft preview**: `/api/preview?secret=<PREVIEW_SECRET>&slug=<slug>` enables Next.js draftMode and renders unpublished posts through the API's secret-protected preview endpoint; `/api/preview/disable` exits.

Design records live in [`docs/adr/`](./docs/adr/).

<h2>Local Run</h2>

Prerequisites: **Node.js 26** (see `.nvmrc`) and **pnpm 10**.

```shell
git clone git@github.com:notbd/tianwei.io.git
cd tianwei.io
pnpm install

# Set up the `.env.local` according to the instructions in `.env.example`
# start local dev server
pnpm dev
```

> **Notes**:
>
> 1. `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (see `.env.example`) must be set: `next/image` builds the MDX images' Cloudinary URLs through `src/lib/cloudinaryLoader.ts`, which throws without it, so any post with an `<MdxImage>` fails to render and `pnpm build` fails.
> 2. Typography and code highlighting are handled by custom React components within `src/components/mdx` and via the `rehype-pretty-code` package respectively.

<h2>Quality Gates</h2>

```shell
pnpm lint        # type-aware ESLint
pnpm typecheck
pnpm test        # vitest: API contract and client, fetcher, paths, dates, reading time, MDX, JSON-LD, cache/revalidate, route auth, sitemap, feed
pnpm build
pnpm exec playwright install chromium   # once per Playwright version
pnpm test:e2e    # Playwright browser smoke against the production build
```

CI (`.github/workflows/ci.yml`) runs all of these on every pull request and on pushes to `main`. The build and smoke steps use the two public values inlined in the workflow (`CONTENT_API_URL=https://tio.twz.app`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`), so no Actions secrets are involved and Dependabot and fork pull requests build too. The vitest suite pins the API contract (exact JSON shapes the frontend parses), the revalidation route's auth and status codes, the cache-warming dispatch logic, the canonical host and the feed; the Playwright suite covers navigation, the theme toggle cycle, the 404 pages, the feed/sitemap outputs, and the code blocks' copy button.

The manual pre-merge checklist for cross-repo releases lives in [`docs/release-verification.md`](./docs/release-verification.md).

<h2>Cache Revalidation & Warming</h2>

The application exposes a revalidation API endpoint at `/api/revalidate` that expires Next.js cache tags and re-fetches the affected data through the API to verify it (the "warm").

<h3>Authentication</h3>

Requests must include a `Bearer` token matching `REVALIDATION_SECRET` in the `Authorization` header.

<h3>Usage</h3>

- **Revalidate a specific post**:

  ```shell
  POST /api/revalidate
  ```

  ```json
  {
    "slug": "post-slug"
  }
  ```

  Invalidates `post-{slug}` and `posts`. Every post fetch also carries `posts`, so this expires every page, then re-fetches the list and every post.

- **Revalidate by tag(s)**:

  ```shell
  POST /api/revalidate
  ```

  Single tag:

  ```json
  {
    "tag": "tag-name"
  }
  ```

  Multiple tags:

  ```json
  {
    "tags": ["tag1", "tag2"]
  }
  ```

  Expires the given tags and re-fetches the data of every tag that has a warmer (`posts`, `post-*`); other tags are only expired.

<h3>Warming Behavior</h3>

Tags are expired with `revalidateTag(tag, { expire: 0 })`, so the first request after a sync renders fresh content instead of the previous version. In the same request the route re-fetches the tags' data through the API (`posts`: the list and every post, four at a time; `post-{slug}`: that post, where a post that is gone counts as warmed). That re-fetch is the end-to-end check that the API serves the synced content: a failure answers `207` with `success: false`, which fails the content deploy. The cache tags are built in one place, `cacheTags` in `src/lib/api/index.ts`.

The content deploy then revalidates once more a minute later, for any render that read the old rows and stored its result after the first expiry, and requests every page in the sitemap, failing on anything but a 200. The reasoning is in [ADR-0002](./docs/adr/0002-single-cache-layer.md).

<h2>License</h2>

Source code is licensed under <a href='./LICENSE'>AGPLv3</a>,<br>
The content is licensed under <a href='https://creativecommons.org/licenses/by-nc-sa/4.0/'>CC BY-NC-SA 4.0</a>.
</samp>
