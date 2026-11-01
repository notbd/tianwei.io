import type { FetchOptions } from './fetcher'
import type { Post, PostSummary } from './schemas'
import { z } from 'zod'
import { apiUrl, fetchList, fetchOne } from './fetcher'
import { postSchema, postSummarySchema } from './schemas'

export { ApiError, isNotFoundError } from './fetcher'
export type { Post, PostSummary } from './schemas'

const POST_TAG_PREFIX = 'post-'

/**
 * Tags on the Next.js data cache, the site's only cache layer. Every
 * published-content fetch carries `posts`, so expiring it refreshes the
 * whole site after a content sync; a single post's fetch also carries its
 * own tag.
 */
export const cacheTags = {
  posts: 'posts',
  post: (slug: string) => `${POST_TAG_PREFIX}${slug}`,
  /** The slug a post tag was built from; undefined for any other tag. */
  slugOf: (tag: string) => tag.startsWith(POST_TAG_PREFIX)
    ? tag.slice(POST_TAG_PREFIX.length)
    : undefined,
}

// Cached until a tag is revalidated: content changes only through the
// content engine's deploy, which calls /api/revalidate, never on a timer.
function cachedUnder(...tags: string[]): FetchOptions {
  return {
    next: { revalidate: false, tags },
  }
}

/** Published posts, newest first, without their content. */
export async function getPosts(): Promise<PostSummary[]> {
  return fetchList('/api/posts', postSummarySchema, cachedUnder(cacheTags.posts))
}

/** One published post with its MDX source. Rejects with a 404/400 ApiError (see isNotFoundError) when the slug names no post. */
export async function getPost(slug: string): Promise<Post> {
  // encoded so a crafted URL segment (`a?b`, `a/b`) reaches the API as one
  // invalid slug instead of a different path or query
  return fetchOne(`/api/post/${encodeURIComponent(slug)}`, postSchema, cachedUnder(cacheTags.posts, cacheTags.post(slug)))
}

/** Categories of published posts, alphabetical. Derived from posts, so it shares their tag. */
export async function getCategories(): Promise<string[]> {
  return fetchList('/api/categories', z.string(), cachedUnder(cacheTags.posts))
}

/** Any post, published or not, for draft mode. Never cached; requires PREVIEW_SECRET. */
export async function getDraftPost(slug: string): Promise<Post> {
  const previewSecret = process.env.PREVIEW_SECRET
  if (previewSecret === undefined || previewSecret === '')
    throw new Error('PREVIEW_SECRET is not configured')

  return fetchOne(`/api/__preview/post/${encodeURIComponent(slug)}`, postSchema, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${previewSecret}` },
  })
}

/**
 * Best-effort request that wakes a suspended Neon compute before a human
 * waits on it (the draft-preview flow, docs/adr/0005). Never throws: the
 * real fetch that follows has its own retries.
 */
export async function wakeDatabase(): Promise<void> {
  try {
    await fetch(apiUrl('/api/categories'), { cache: 'no-store' })
  }
  catch {}
}
