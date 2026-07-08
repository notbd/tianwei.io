<!-- markdownlint-disable MD007 MD033 MD041 -->
<samp>
<h1>tianwei.io</h1>

[![CI](https://github.com/notbd/tianwei.io/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/notbd/tianwei.io/actions/workflows/ci.yml)

The frontend layer of my personal website [tianwei.io](https://tianwei.io).

<h2>Stack</h2>

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **MDX Processing**: [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote)
- **Data Validation**: [Zod](https://zod.dev)
- **Image Optimization**: [Cloudinary](https://cloudinary.com)
- **Testing**: [Vitest](https://vitest.dev) (unit/contract) + [Playwright](https://playwright.dev) (browser smoke)
- **Deployment**: [Vercel](https://vercel.com)

<h2>Site Architecture</h2>

- **[Frontend](https://github.com/notbd/tianwei.io)**: this repo — a Next.js application rendering content from the API with static generation and on-demand revalidation.
- **[API Layer](https://github.com/notbd/tianwei-io-api)**: a Hono service on Cloudflare Workers that serves content data from the content engine via REST endpoints.
- **[Content Engine](https://github.com/notbd/tianwei-io-content)**: a dedicated repo that stores, parses and syncs MDX to a remote PostgreSQL database.

Note: previously this site incorporated [Contentlayer](https://contentlayer.dev) to manage frontend and content data in a single repo. I have since moved to a decoupled architecture that separates the frontend and backend which allows for better flexibility and scalability.

<h2>Rendering & Caching Model</h2>

Every route is **fully static**:

- Post pages are prerendered at build time (`generateStaticParams`); the posts list and home page are static too.
- Data fetches use the Next.js data cache with `revalidate: false` + tags — content only changes through **on-demand revalidation** (see below), never by TTL.
- The theme system is deliberately cookie-free: an inline pre-paint script reads the choice from localStorage and drives both the `dark` class (next-themes) and the toggle icon (CSS on a `data-theme-choice` attribute). No server-side theme state means no dynamic rendering.
- All dates render in **`DISPLAY_TIME_ZONE`** (`America/New_York`) through the single `formatPostDate()` helper; storage stays UTC instants. Must match the content engine's `CONTENT_TIME_ZONE` — see [ADR-0004](./docs/adr/0004-display-time-zone.md).
- `generateStaticParams` refuses to build an empty catalog, and a post page only 404s on a true API 404 — any other fetch failure fails the build loudly instead of silently dropping pages. Transient 5xx/network failures are retried with backoff in the fetcher.
- `/feed.xml` (RSS), `/categories/[category]` pages, and per-post OG images are all statically generated from the same tagged data, so one revalidation refreshes everything.
- **Draft preview**: `/api/preview?secret=<PREVIEW_SECRET>&slug=<slug>` enables Next.js draftMode and renders unpublished posts through the API's secret-protected preview endpoint; `/api/preview/disable` exits.

Design records live in [`docs/adr/`](./docs/adr/).

<h2>Local Run</h2>

Prerequisites: **Node.js ≥ 22** and **pnpm 10**.

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
> 1. Cloudinary env variables need to be configured following the [instructions](https://next.cloudinary.dev/installation) for images to show properly.
> 2. Typography and code highlighting are handled by custom React components within `src/components/mdx` and via the `rehype-pretty-code` package respectively.

<h2>Quality Gates</h2>

```shell
pnpm lint        # type-aware ESLint
pnpm typecheck
pnpm test        # vitest: API contract locks, fetcher, cache/revalidate, route auth, sitemap
pnpm build
pnpm test:e2e    # Playwright browser smoke against the production build
```

CI (`.github/workflows/ci.yml`) runs all of these on every pull request and on pushes to `main`. The vitest suite pins the API contract (exact JSON shapes the frontend parses), the revalidation route's auth and status codes, and the cache-warming dispatch logic; the Playwright suite covers navigation, the theme toggle cycle, and the feed/sitemap outputs.

The manual pre-merge checklist for cross-repo releases lives in [`docs/release-verification.md`](./docs/release-verification.md).

<h2>Cache Revalidation & Warming</h2>

The application exposes a revalidation API endpoint at `/api/revalidate` that invalidates Next.js cache tags and warms the cache by pre-fetching fresh data.

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

  Invalidates both the post cache tag (`post-{slug}`) and the posts list tag, then warms both.

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

  Invalidates the specified cache tags and warms matching routes.

<h3>Warming Behavior</h3>

After revalidation, the system automatically warms the cache by pre-fetching data for matching routes. This ensures fresh content is available immediately after invalidation:

- **`posts` tag**: Fetches the posts list and all individual post pages
- **`post-{slug}` tags**: Fetches the specific post page
- **Bounded concurrency**: individual post warms run through a small worker pool (4 at a time), so warming can't stampede the origin API or race the function timeout as the catalog grows

Warming failures surface as a `207` response with `success: false` — the content engine's deploy pipeline treats that as a failed deploy rather than silently shipping a cold cache.

<h2>License</h2>

Source code is licensed under <a href='./LICENSE'>AGPLv3</a>,<br>
The content is licensed under <a href='https://creativecommons.org/licenses/by-nc-sa/4.0/'>CC BY-NC-SA 4.0</a>.
</samp>
