import { revalidateTag } from 'next/cache'
import { cacheTags, getPost, getPosts, isNotFoundError } from '@/lib/api'

export type RevalidateResult = {
  success: boolean
  revalidated: string[]
  warmed: string[]
  error?: string
}

// Warming runs inside one revalidate-route invocation; firing every post
// fetch at once would stampede the API and race the function timeout as
// the catalog grows.
const WARM_CONCURRENCY = 4

/**
 * Expires the tags, then re-fetches their data through the API.
 *
 * `{ expire: 0 }` expires the tagged entries outright once the route
 * handler returns, so the next request renders fresh content instead of
 * being served the previous version once ('max' is stale-while-revalidate).
 * That is the documented choice for invalidations arriving through a
 * webhook-style Route Handler:
 * https://nextjs.org/docs/app/api-reference/functions/revalidateTag
 *
 * The re-fetch ("warm") is the end-to-end check that the API serves the
 * synced content. It verifies rather than refills: Next applies the expiry
 * when this handler returns, so a warm write that lands earlier expires
 * and one that lands later stays, both holding the synced data
 * (docs/adr/0002). A failed warm is reported, not thrown: the route answers
 * 207 and the content deploy fails on it.
 */
export async function revalidateAndWarmTags(tags: string[]): Promise<RevalidateResult> {
  for (const tag of tags)
    revalidateTag(tag, { expire: 0 })

  // settled in request order, so `warmed` and the errors list the tags as given
  const outcomes = await Promise.allSettled(tags.map(warm))
  const warmed = tags.filter((_tag, i) => outcomes[i]?.status === 'fulfilled' && outcomes[i].value)
  const errors = outcomes.flatMap((outcome, i) => {
    if (outcome.status === 'fulfilled')
      return []
    const reason = outcome.reason instanceof Error
      ? outcome.reason.message
      : String(outcome.reason)
    return [`Failed to warm tag "${tags[i]}": ${reason}`]
  })

  if (errors.length > 0)
    console.error(errors.join('; '))

  return {
    success: errors.length === 0,
    revalidated: tags,
    warmed,
    ...(errors.length > 0 && {
      error: errors.join('; '),
    }),
  }
}

/** Re-fetches the data behind a tag. Resolves false for a tag no fetch carries. */
async function warm(tag: string): Promise<boolean> {
  if (tag === cacheTags.posts) {
    const posts = await getPosts()
    await forEachConcurrently(posts, WARM_CONCURRENCY, async (post) => {
      await getPost(post.slug)
    })
    console.info(`[warm] posts: list and ${posts.length} posts`)
    return true
  }

  const slug = cacheTags.slugOf(tag)
  if (slug !== undefined) {
    try {
      await getPost(slug)
    }
    catch (error) {
      // revalidating an unpublished or deleted post is how it disappears;
      // its absence is the expected answer, not a failed warm
      if (!isNotFoundError(error))
        throw error
    }
    return true
  }

  return false
}

/** Runs `task` over `items` with at most `limit` in flight; rejects on the first failure. */
async function forEachConcurrently<T>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<unknown>,
): Promise<void> {
  const queue = [...items]
  const worker = async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift())
      await task(item)
  }
  await Promise.all(Array.from({
    length: Math.min(limit, queue.length),
  }, worker))
}
