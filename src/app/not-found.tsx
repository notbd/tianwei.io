import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Not Found', // root template appends '· tianwei.io'
}

// Root not-found boundary: serves notFound() from the post and category
// pages as well as every unmatched URL, inside the root layout (header,
// footer, theme scripts). Without it those 404s fell through to Next's
// bare error shell, which renders nothing server-side.
export default function NotFound() {
  return (
    <div className="max-w-3xl pb-8">
      <header className="mb-12 pb-4 border-b border-gray-200/30 dark:border-gray-800/30">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          Not Found
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-200">
          {'This page does not exist · '}
          <Link href="/posts" className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700 dark:decoration-zinc-700 dark:hover:text-zinc-300">
            all posts
          </Link>
        </p>
      </header>
    </div>
  )
}
