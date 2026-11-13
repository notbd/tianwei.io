import type { FetchOptions } from './fetcher'
import type { Post, PostSummary } from './schemas'
import { z } from 'zod'
import { apiUrl, fetchList, fetchOne, isNotFoundError } from './fetcher'
import { postSchema, postSummarySchema } from './schemas'

export { ApiError, isNotFoundError } from './fetcher'
export type { Post, PostSummary } from './schemas'

/**
 * The one tag on the Next.js data cache, the site's only cache layer: every
 * published-content fetch carries it, so expiring it refreshes the whole
 * site after a content sync.
 */
export const POSTS_TAG = 'posts'

// The two ways to read published content. The read functions take one of
// these names, not fetch options, so a page's read cannot miss the tag.
const READS = {
  // Cached until the tag is expired: content changes only through the
  // content engine's deploy, which calls /api/revalidate, never on a timer.
  cached: {
    next: {
      revalidate: false,
      tags: [POSTS_TAG],
    },
  },
  // Straight from the API, past the data cache: how /api/revalidate checks
  // the API before expiring anything. Plain no-store, nothing else: Next
  // drops both settings, with a warning, when it meets one next to
  // `next.revalidate`.
  uncached: { cache: 'no-store' },
} satisfies Record<string, FetchOptions>
type Read = keyof typeof READS

/** Published posts, newest first, without their content. */
export async function getPosts(read: Read = 'cached'): Promise<PostSummary[]> {
  return fetchList('/api/posts', postSummarySchema, READS[read])
}

/** One published post with its MDX source. Rejects with a 404/400 ApiError (see isNotFoundError) when the slug names no post. */
export async function getPost(slug: string, read: Read = 'cached'): Promise<Post> {
  // encoded so a crafted URL segment (`a?b`, `a/b`) reaches the API as one
  // invalid slug instead of a different path or query
  return fetchOne(`/api/post/${encodeURIComponent(slug)}`, postSchema, READS[read])
}

/**
 * The published post a page shows, or undefined when the slug names none.
 * The cached list is the door: a slug missing from it never reaches the
 * API, so made-up URLs cost no API call and no database query, and a new
 * post joins the list in the same revalidation that publishes it. A list
 * that cannot be read throws, like any other failed read.
 */
export async function findPost(slug: string): Promise<Post | undefined> {
  if (!(await getPosts()).some(post => post.slug === slug))
    return undefined
  try {
    return await getPost(slug)
  }
  catch (error) {
    // listed, but gone from the API since the list was cached
    if (isNotFoundError(error))
      return undefined
    throw error
  }
}

/** Categories of published posts, alphabetical. Derived from posts, so it shares their tag. */
export async function getCategories(read: Read = 'cached'): Promise<string[]> {
  return fetchList('/api/categories', z.string(), READS[read])
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
