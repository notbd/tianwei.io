import type { PostSummary } from '@/lib/api/post/schemas'
import Link from 'next/link'
import { apiClient } from '@/lib/api'

export default async function PostsPage() {
  const posts: PostSummary[] = await apiClient.post.listAll()

  return (
    <main className="max-w-3xl py-8">

      {/* header */}
      <header className="mb-12 border-b border-gray-200 pb-8 dark:border-gray-800">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          Posts
        </h1>
        <p className="mt-4 text-zinc-500 dark:text-zinc-200">
          Writings on topics that interest me and things I'm proud of.
        </p>
      </header>

      <ul className="space-y-10">
        {posts.map(post => (
          <li key={post.id} className="group relative">

            {/* clickable cell */}
            <Link href={`/posts/${post.slug}`} className="block">
              <article className="flex flex-col gap-2">

                {/* row 1: time + category */}
                <div className="flex items-center gap-3 text-sm text-zinc-400 dark:text-zinc-600">
                  <time dateTime={post.createdAt.toISOString()}>
                    {post.createdAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span>·</span>
                  <span className="uppercase tracking-wider font-medium text-xs">
                    {post.category}
                  </span>
                </div>

                {/* row 2: title */}
                <h2 className="text-xl font-bold text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-600 transition-colors duration-200">
                  {post.title}
                </h2>

                {/* (optional) row 3: description */}
                {post.description && (
                  <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {post.description}
                  </p>
                )}

                {/* row 4: click prompt */}
                <div className="mt-1 text-sm font-medium text-teal-600 dark:text-teal-500 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  Read
                  {' ->'}
                </div>
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
