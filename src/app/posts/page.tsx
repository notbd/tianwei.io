import { allPosts } from 'contentlayer/generated'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function Posts() {
  return (
    <ul
      className="flex flex-col gap-y-6"
    >
      {allPosts.map(post => (
        <li
          key={post._id}
        >
          <Link href={post.slug}>
            <h3
              className={cn(
                'inline-block',
                'text-xl font-medium underline',
                'text-zinc-600 hover:text-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100',
                'transition-[color] duration-300',
              )}
            >
              {post.title}
            </h3>
          </Link>

          {
            post.description && (
              <p className="mt-2 text-sm">
                {post.description}
              </p>
            )
          }
        </li>
      ))}
    </ul>
  )
}
