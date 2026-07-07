import type { PostSummary } from '@/lib/api'
import Link from 'next/link'
import { formatPostDate } from '@/lib/dates'

type PostListProps = {
  posts: PostSummary[]
}

/** Shared post listing used by /posts and /categories/[category]. */
export function PostList({ posts }: PostListProps) {
  return (
    <ul className="space-y-6">
      {posts.map(post => (
        <li key={post.id} className="group relative">

          {/* clickable cell */}
          <Link href={`/posts/${post.slug}`} className="block">
            <article className="flex flex-col gap-1">

              {/* row 1: time + category */}
              <div className="flex items-center text-sm text-zinc-400 dark:text-zinc-600">
                <time dateTime={post.createdAt.toISOString()}>
                  {formatPostDate(post.createdAt)}
                </time>
              </div>

              {/* row 2: title */}
              <h2 className="text-xl font-bold text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-600 transition-colors duration-200">
                {post.title}
              </h2>

              {/* (optional) row 3: description */}
              {post.description !== null && post.description !== '' && (
                <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {post.description}
                </p>
              )}

              {/* row 4: click prompt */}
              <div className="text-sm font-medium text-teal-600 dark:text-teal-500 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                {'->'}
              </div>
            </article>
          </Link>
        </li>
      ))}
    </ul>
  )
}
