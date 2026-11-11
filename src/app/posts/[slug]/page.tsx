import type { Metadata } from 'next'
import type { Post } from '@/lib/api'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { twitterAccounts } from '@/app/metadata'
import { JsonLd } from '@/components/JsonLd'
import { MdxContent } from '@/components/mdx/MdxContent'
import { TextLink } from '@/components/TextLink'
import { findPost, getDraftPost, getPosts, isNotFoundError } from '@/lib/api'
import { categoryLabel } from '@/lib/categories'
import { formatPostDate } from '@/lib/dates'
import { absoluteUrl, categoryPath, postPath, SITE_URL } from '@/lib/paths'
import { POST_BODY_HASH_META, postBodyHash } from '@/lib/postBodyHash'
import { readingMinutes } from '@/lib/readingTime'
import { site } from '@/lib/site'

type PageProps = {
  params: Promise<{ slug: string }>
}

const metaSeparator = <span className="mx-2" aria-hidden>·</span>

// One read per render, shared by the metadata and the page: the body hash
// in the metadata must describe the body on the page, and a draft's tab
// must show its title. Draft mode (the author's preview) reads through the
// API's preview endpoint, which also returns unpublished posts, and skips
// the list. Only a slug that names no post becomes a not-found page; any
// other failure (network hiccup, 500, schema drift) propagates, since
// during a build a swallowed error would silently drop the page from the
// prerendered set.
const loadPost = cache(async (slug: string): Promise<Post> => {
  const { isEnabled } = await draftMode()
  if (!isEnabled)
    return await findPost(slug) ?? notFound()

  try {
    return await getDraftPost(slug)
  }
  catch (error) {
    if (isNotFoundError(error))
      notFound()
    throw error
  }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await loadPost((await params).slug)
  const description = post.description ?? undefined
  return {
    title: post.title, // root template appends '· tianwei.io'
    description,
    // no images here: the route's opengraph-image.tsx supplies the card
    openGraph: {
      type: 'article',
      siteName: site.domain,
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
    other: {
      [POST_BODY_HASH_META]: postBodyHash(post.content),
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
  const post = await loadPost((await params).slug)
  const { isEnabled: isDraftPreview } = await draftMode()

  const url = absoluteUrl(postPath(post.slug))

  return (
    <article className="pb-8">
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
          <time dateTime={post.createdAt.toISOString()} className="whitespace-nowrap">
            {formatPostDate(post.createdAt)}
          </time>
          {post.updatedAt !== null && (
            <>
              {metaSeparator}
              <span className="whitespace-nowrap">
                {'Updated '}
                <time dateTime={post.updatedAt.toISOString()}>
                  {formatPostDate(post.updatedAt)}
                </time>
              </span>
            </>
          )}
          {metaSeparator}
          <span className="whitespace-nowrap">{`${readingMinutes(post.content)} min read`}</span>
          {metaSeparator}
          <TextLink href={categoryPath(post.category)} className="whitespace-nowrap">
            {categoryLabel(post.category)}
          </TextLink>
        </div>
      </header>

      {/* content */}
      <MdxContent source={post.content} />

    </article>
  )
}
