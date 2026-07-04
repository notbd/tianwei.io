import type { Post, PostSummary } from '@/lib/api'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MdxContent } from '@/components/mdx/MdxContent'
import { apiClient, NetworkRequestError } from '@/lib/api'
import { formatPostDate } from '@/lib/dates'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts: PostSummary[] = await apiClient.post.listAll()

  // Fail the build loudly rather than silently shipping zero prerendered
  // pages (which would degrade every post visit to on-demand rendering).
  if (posts.length === 0)
    throw new Error('generateStaticParams: API returned 0 posts — refusing to build an empty catalog')

  return posts.map(post => ({ slug: post.slug }))
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const { isEnabled: isDraftPreview } = await draftMode()

  let post: Post
  try {
    post = isDraftPreview
      ? await apiClient.post.getPreviewBySlug(slug)
      : await apiClient.post.getBySlug(slug)
  }
  catch (error) {
    // Only a true 404 becomes a not-found page. Anything else (network
    // hiccup, 500, schema drift) must propagate — during a build a swallowed
    // error would silently drop the page from the prerendered set.
    if (error instanceof NetworkRequestError && error.status === 404)
      notFound()
    throw error
  }

  return (
    <main className="max-w-3xl pb-8">

      {/* draft preview banner */}
      {isDraftPreview && (
        <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          Draft preview
          {!post.isPublished && ' (unpublished)'}
          {' · '}
          <a href="/api/preview/disable" className="underline">Exit</a>
        </div>
      )}

      {/* header */}
      <header className="mb-16 pb-4 border-b border-gray-200/30 dark:border-gray-800/30">

        {/* title */}
        <h1 className="text-2xl font-bold">{post.title}</h1>

        {/* (optional) description */}
        {post.description !== null && post.description !== '' && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{post.description}</p>
        )}

        {/* other attributes */}
        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          <time dateTime={post.createdAt.toISOString()}>
            {formatPostDate(post.createdAt, 'short')}
          </time>
          {post.updatedAt != null && (
            <>
              <span className="mx-2">·</span>
              <span>
                {'Updated '}
                <time dateTime={post.updatedAt.toISOString()}>
                  {formatPostDate(post.updatedAt, 'short')}
                </time>
              </span>
            </>
          )}
          <span className="mx-2">·</span>
          <Link
            href={`/categories/${post.category}`}
            className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700 dark:decoration-zinc-700 dark:hover:text-zinc-300"
          >
            {post.category}
          </Link>
        </div>
      </header>

      {/* content */}
      <MdxContent source={post.content} />

    </main>
  )
}
