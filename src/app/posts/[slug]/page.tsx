import type { Post } from 'contentlayer/generated'
import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { Mdx } from '@/components/Mdx'
import { cn } from '@/lib/utils'

type PostArticleProps = {
  params: Promise<{
    slug: string
  }>
}

export function generateStaticParams() {
  return allPosts.map(post => ({
    slug: post._raw.flattenedPath,
  }))
}

export default async function PostArticle(props: PostArticleProps) {
  const params = await props.params
  const post = allPosts.find(post => post.slugAsParams === params.slug)

  if (!post) {
    notFound()
  }

  return (
    post && (
      <article>
        <PostHeader post={post} />
        <Mdx code={post.body.code} />
      </article>
    )
  )
}

type PostHeaderProps = {
  post: Post
}

function PostHeader({ post }: PostHeaderProps) {
  return (
    <header
      className="mb-10"
    >
      <h1
        className={cn(
          'mt-2 scroll-m-20 text-3xl font-bold tracking-tight',
        )}
      >
        {post.title}
      </h1>

      {post.description && (
        <p
          className={cn(
            'mt-2',
            'text-zinc-600 dark:text-zinc-300',
          )}
        >
          {post.description}
        </p>
      )}

      {/* date display */}
      {post.date && (
        <p className={cn(
          'mt-2',
          'text-zinc-500 dark:text-zinc-400',
          'text-sm',
        )}
        >
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}

      <hr className="my-6 border-zinc-200/50 dark:border-zinc-700/50" />
    </header>
  )
}
