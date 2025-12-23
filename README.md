<!-- markdownlint-disable MD007 MD033 MD041 -->
<samp>
<h1>tianwei.io</h1>

The frontend layer of my personal website [tianwei.io](https://tianwei.io).

<h2>Stack</h2>

- **Framework**: [Next.js](https://nextjs.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **MDX Processing**: [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote)
- **Data Validation**: [Zod](https://zod.dev)
- **Image Optimization**: [Cloudinary](https://cloudinary.com)
- **Deployment**: [Vercel](https://vercel.com)

<h2>Site Architecture</h2>

- **[Frontend](https://github.com/notbd/tianwei.io)**: a Next.js application rendering content from the API dynamically using SSR with optimized caching strategies.
- **[API Layer](https://github.com/notbd/tianwei-io-api)**: a Hono service (Node.js) that serves content data from the content engine via REST endpoints.
- **[Content Engine](https://github.com/notbd/tianwei-io-content)**: a dedicated repo that stores, parses and syncs MDX to a remote PostgreSQL database.

Note: previously this site incorporated [Contentlayer](https://contentlayer.dev) to manage frontend and content data in a single repo. I have since moved to a decoupled architecture that separates the frontend and backend which allows for better flexibility and scalability.

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
> 2. Typography and code highlighting are handled by custom React components within `src/components/mdx` and via the `rehype-pretty-code` package respectively.

<h2>License</h2>

Source code is licensed under <a href='./LICENSE'>AGPLv3</a>,<br>
The content is licensed under <a href='https://creativecommons.org/licenses/by-nc-sa/4.0/'>CC BY-NC-SA 4.0</a>.
</samp>
