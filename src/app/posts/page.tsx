import Link from 'next/link'
import { pageMetadata } from '@/app/metadata'
import { PageHeader } from '@/components/PageHeader'
import { PostList } from '@/components/PostList'
import { getCategories, getPosts } from '@/lib/api'
import { categoryLabel } from '@/lib/categories'
import { categoryPath } from '@/lib/paths'

const description = 'Writings on topics that interest me and things I\'m proud of.'

export const metadata = pageMetadata('Posts', description)

export default async function PostsPage() {
  const [posts, categories] = await Promise.all([
    getPosts(),
    getCategories(),
  ])

  return (
    <div className="pb-8">
      <PageHeader title="Posts" description={description}>
        {/* category filters */}
        {categories.length > 1 && (
          <nav aria-label="Categories" className="mt-4 flex flex-wrap gap-2">
            {categories.map(category => (
              <Link
                key={category}
                href={categoryPath(category)}
                className="rounded-md border border-zinc-200 px-3 py-0.5 text-sm text-zinc-600 hover:border-teal-600 hover:text-teal-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-teal-600 dark:hover:text-teal-500 transition-colors"
              >
                {categoryLabel(category)}
              </Link>
            ))}
          </nav>
        )}
      </PageHeader>

      <PostList posts={posts} />
    </div>
  )
}
