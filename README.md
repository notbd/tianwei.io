<!-- markdownlint-disable MD007 MD033 MD041 -->
<samp>
<h1>tianwei.io</h1>

My personal website.

<h2>Stack</h2>

- **Framework**: [Next.js](https://nextjs.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Content Management**: [Contentlayer](https://contentlayer.dev)
- **Image Optimization**: [Cloudinary](https://cloudinary.com)
- **Deployment**: [Vercel](https://vercel.com)

<h2>Local Run</h2>

```shell
git clone git@github.com:notbd/tianwei.io.git
cd tianwei.io
pnpm install

# start local dev server
pnpm run dev

# lint
pnpm run lint:next

# build
pnpm run build
```

> **Notes**:
>
> 1. Make sure to configure env variables for Cloudinary following the [instructions](https://next.cloudinary.dev/installation).
> 2. The original [contentlayer](https://github.com/contentlayerdev/contentlayer) project was stopped being maintained, and I switched to a [community fork](https://github.com/timlrx/contentlayer2) as an alternative. Things are mostly working fine except HMR is not working for Next.js 15 turbopack. Webpack is still required for dev.

<h2>License</h2>

Source code is licensed under <a href='./LICENSE'>AGPLv3</a>,<br>
The content is licensed under <a href='https://creativecommons.org/licenses/by-nc-sa/4.0/'>CC BY-NC-SA 4.0</a>.
</samp>
