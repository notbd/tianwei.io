import type { PostSummary } from '@/lib/api'
import Link from 'next/link'
import { formatPostDate } from '@/lib/dates'
import { postPath } from '@/lib/paths'

type PostListProps = {
  posts: PostSummary[]
}

/** Shared post listing used by /posts and /categories/[category]. */
export function PostList({ posts }: PostListProps) {
  return (
    <ul className="space-y-6">
      {posts.map(post => (
        <li key={post.id}>

          {/* clickable cell; keyboard focus gets the same cues as hover */}
          <Link href={postPath(post.slug)} className="group block rounded-md">
            <article className="flex flex-col gap-1">

              {/* row 1: date */}
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                <time dateTime={post.createdAt.toISOString()}>
                  {formatPostDate(post.createdAt)}
                </time>
              </div>

              {/* row 2: title */}
              <h2 className="text-xl font-bold text-balance text-zinc-900 transition-[color] duration-200 group-hover:text-teal-700 group-focus-visible:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-600 dark:group-focus-visible:text-teal-600">
                {post.title}
              </h2>

              {/* (optional) row 3: description */}
              {post.description !== null && (
                <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {post.description}
                </p>
              )}

              {/* row 4: click prompt (decorative, kept out of the link's accessible name) */}
              <div aria-hidden="true" className="text-sm font-medium text-teal-600 dark:text-teal-500 opacity-0 -translate-x-2 transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0">
                {'->'}
              </div>
            </article>
          </Link>
        </li>
      ))}
    </ul>
  )
}
