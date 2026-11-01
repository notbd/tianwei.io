import type { Metadata } from 'next'
import Link from 'next/link'
import { metadata as rootMetadata } from '@/app/metadata'
import { PostList } from '@/components/PostList'
import { apiClient } from '@/lib/api'
import { categoryPath } from '@/lib/paths'

const description = 'Writings on topics that interest me and things I\'m proud of.'

export const metadata: Metadata = {
  title: 'Posts', // root template appends '· tianwei.io'
  description,
  // a child openGraph/twitter replaces the root's whole object, hence the spreads
  openGraph: { ...rootMetadata.openGraph, title: 'Posts', description },
  twitter: { ...rootMetadata.twitter, title: 'Posts • tianwei.io', description },
}

export default async function PostsPage() {
  const [posts, categories] = await Promise.all([
    apiClient.post.listAll(),
    apiClient.category.listAll(),
  ])

  return (
    <div className="max-w-3xl pb-8">

      {/* header */}
      <header className="mb-12 pb-4 border-b border-gray-200/30 dark:border-gray-800/30">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          Posts
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-200">
          Writings on topics that interest me and things I'm proud of.
        </p>

        {/* category filters */}
        {categories.length > 1 && (
          <nav aria-label="Categories" className="mt-4 flex flex-wrap gap-2">
            {categories.map(category => (
              <Link
                key={category}
                href={categoryPath(category)}
                className="rounded-full border border-zinc-200 px-3 py-0.5 text-sm text-zinc-600 hover:border-teal-600 hover:text-teal-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-teal-600 dark:hover:text-teal-500 transition-colors"
              >
                {category}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <PostList posts={posts} />
    </div>
  )
}
