<!-- markdownlint-disable MD007 MD033 MD041 -->
<samp>
<h1>tianwei.io</h1>

My personal website.

This repository serves as the frontend presentation layer, fetching content dynamically from a decoupled Hono API.

<h2>Stack</h2>

- **Framework**: [Next.js](https://nextjs.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **MDX Processing**: [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote)
- **Data Validation**: [Zod](https://zod.dev)
- **Image Optimization**: [Cloudinary](https://cloudinary.com)
- **Deployment**: [Vercel](https://vercel.com)

<h2>Site Architecture</h2>

This site has been refactored from a static Contentlayer-based setup to a dynamic three-tier architecture. The main motivation behind this change was to improve scalability and maintainability. Also, Contentlayer has stopped being actively maintained.

- **Content Engine**: A dedicated repo that stores, parses and syncs MDX to a PostgreSQL database.
- **API Layer**: A [Hono](https://hono.dev) service (Node.js) that serves data via REST endpoints.
- **Frontend**: This Next.js application, which consumes the API and renders content dynamically using SSR with optimized caching strategies.

<h2>Local Run</h2>

```shell
git clone git@github.com:notbd/tianwei.io.git
cd tianwei.io
pnpm install

# Set up the `.env.local` according to the instructions in `.env.example`
# start local dev server
pnpm run dev

# lint
pnpm run lint

# build
pnpm run build
```

> **Notes**:
>
> 1. Cloudinary env variables need to be configured following the [instructions](https://next.cloudinary.dev/installation) for images to show properly.
> 2. This frontend requires the API service to be active to fetch post data. Contentlayer has been completely removed.
> 3. Typography and code highlighting are handled by custom React components within `src/components/mdx` and via the `rehype-pretty-code` package respectively.

<h2>License</h2>

Source code is licensed under <a href='./LICENSE'>AGPLv3</a>,<br>
The content is licensed under <a href='https://creativecommons.org/licenses/by-nc-sa/4.0/'>CC BY-NC-SA 4.0</a>.
</samp>
