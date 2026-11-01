import type { Metadata } from 'next'
import type { Post } from '@/lib/api'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { openGraphSiteName, twitterAccounts } from '@/app/metadata'
import { JsonLd } from '@/components/JsonLd'
import { MdxContent } from '@/components/mdx/MdxContent'
import { TextLink } from '@/components/TextLink'
import { getDraftPost, getPost, getPosts, isNotFoundError } from '@/lib/api'
import { formatPostDate } from '@/lib/dates'
import { absoluteUrl, categoryPath, postPath, SITE_URL } from '@/lib/paths'
import { readingMinutes } from '@/lib/readingTime'

type PageProps = {
  params: Promise<{ slug: string }>
}

// Draft mode (the author's preview) reads through the API's preview
// endpoint, which also returns unpublished posts; the metadata and the page
// must read the same post, or a draft's tab shows the site name.
async function loadPost(slug: string): Promise<Post> {
  const { isEnabled } = await draftMode()
  return isEnabled
    ? getDraftPost(slug)
    : getPost(slug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  let post: Post
  try {
    post = await loadPost(slug)
  }
  catch (error) {
    // unknown or malformed slug: the page itself will render notFound()
    if (isNotFoundError(error))
      return {}
    throw error
  }

  const description = post.description ?? undefined
  return {
    title: post.title, // root template appends '· tianwei.io'
    description,
    // no images here: the route's opengraph-image.tsx supplies the card
    openGraph: {
      type: 'article',
      siteName: openGraphSiteName,
      url: absoluteUrl(postPath(post.slug)),
      title: post.title,
      description,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: (post.updatedAt ?? post.createdAt).toISOString(),
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      ...twitterAccounts,
      title: post.title,
      description,
    },
  }
}

export async function generateStaticParams() {
  const posts = await getPosts()

  // Fail the build loudly rather than silently shipping zero prerendered
  // pages (which would degrade every post visit to on-demand rendering).
  if (posts.length === 0)
    throw new Error('generateStaticParams: API returned 0 posts; refusing to build an empty catalog')

  return posts.map(post => ({ slug: post.slug }))
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const { isEnabled: isDraftPreview } = await draftMode()

  let post: Post
  try {
    post = await loadPost(slug)
  }
  catch (error) {
    // Only a slug that names no post (404, or the API's 400 for a malformed
    // slug) becomes a not-found page. Anything else (network hiccup, 500,
    // schema drift) must propagate: during a build a swallowed error would
    // silently drop the page from the prerendered set.
    if (isNotFoundError(error))
      notFound()
    throw error
  }

  const url = absoluteUrl(postPath(post.slug))

  return (
    <article className="max-w-3xl pb-8">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': post.title,
        'description': post.description ?? undefined,
        'datePublished': post.createdAt.toISOString(),
        'dateModified': (post.updatedAt ?? post.createdAt).toISOString(),
        'author': { '@type': 'Person', 'name': post.author, 'url': SITE_URL },
        'url': url,
        'mainEntityOfPage': url,
        'image': `${url}/opengraph-image`,
        'articleSection': post.category,
      }}
      />

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
      <header className="mb-16 border-b border-zinc-200/30 pb-4 dark:border-zinc-800/30">

        {/* title */}
        <h1 className="text-2xl font-bold">{post.title}</h1>

        {/* (optional) description */}
        {post.description !== null && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{post.description}</p>
        )}

        {/* other attributes */}
        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          <time dateTime={post.createdAt.toISOString()}>
            {formatPostDate(post.createdAt, 'short')}
          </time>
          {post.updatedAt !== null && (
            <>
              <span className="mx-2" aria-hidden>·</span>
              <span>
                {'Updated '}
                <time dateTime={post.updatedAt.toISOString()}>
                  {formatPostDate(post.updatedAt, 'short')}
                </time>
              </span>
            </>
          )}
          <span className="mx-2" aria-hidden>·</span>
          <span>{`${readingMinutes(post.content)} min read`}</span>
          <span className="mx-2" aria-hidden>·</span>
          <TextLink href={categoryPath(post.category)}>
            {post.category}
          </TextLink>
        </div>
      </header>

      {/* content */}
      <MdxContent source={post.content} />

    </article>
  )
}
