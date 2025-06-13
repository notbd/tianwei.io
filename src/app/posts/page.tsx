import type { Post } from 'contentlayer/generated'
import { allPosts } from 'contentlayer/generated'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function Posts() {
  const publishedPosts = allPosts.filter(post => post.published)

  // order posts by date (descending), then by title (ascending)
  // posts without a date come last
  publishedPosts.sort((a, b) => {
    if (a.date && b.date) {
      if (a.date > b.date)
        return -1
      if (a.date < b.date)
        return 1
      return a.title.localeCompare(b.title)
    }
    if (a.date && !b.date)
      return -1
    if (!a.date && b.date)
      return 1
    return a.title.localeCompare(b.title)
  })

  return (
    <ul className="flex flex-col gap-y-6">
      {publishedPosts.map(post => (
        <PostPreview key={post._id} post={post} />
      ))}
    </ul>
  )
}

type PostPreviewProps = {
  post: Post
}

function PostPreview({ post }: PostPreviewProps) {
  return (
    <li
      key={post._id}
    >
      {/* title */}
      <Link href={post.slug}>
        <h3
          className={cn(
            'text-xl font-medium underline',
            'text-zinc-700 hover:text-zinc-500 dark:text-zinc-300 dark:hover:text-zinc-100',
            'transition-[color] duration-300',
          )}
        >
          {post.title}
        </h3>
      </Link>

      {/* description */}
      {
        post.description && (
          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {post.description}
          </p>
        )
      }
    </li>
  )
}
