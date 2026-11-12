import { revalidateTag } from 'next/cache'
import { getCategories, getPost, getPosts, POSTS_TAG } from '@/lib/api'

// One route invocation reads every post; more at once would stampede the
// API as the catalog grows. The categories read counts toward the limit.
const READ_CONCURRENCY = 4

/**
 * Expires the `posts` tag, but only after reading everything it covers
 * straight from the API (the list, every post on it, the categories)
 * through the same schemas the pages use. A failed read expires nothing:
 * the site keeps serving what it has instead of rendering pages against an
 * API that cannot answer them.
 *
 * `{ expire: 0 }` expires the tagged entries outright once the route
 * handler returns, so the next request renders fresh content instead of
 * being served the previous version once ('max' is stale-while-revalidate).
 * That is the documented choice for invalidations arriving through a
 * webhook-style Route Handler:
 * https://nextjs.org/docs/app/api-reference/functions/revalidateTag
 */
export async function revalidatePosts(): Promise<{ ok: true } | { ok: false, message: string }> {
  try {
    await readEverything()
  }
  catch (error) {
    const message = messageOf(error)
    console.error(`[revalidate] nothing expired: ${message}`)
    return { ok: false, message }
  }

  revalidateTag(POSTS_TAG, { expire: 0 })
  return { ok: true }
}

async function readEverything(): Promise<void> {
  const posts = await getPosts('uncached')
  const reads = [
    async () => reading('the categories', getCategories('uncached')),
    ...posts.map(post => async () => reading(`post "${post.slug}"`, getPost(post.slug, 'uncached'))),
  ]
  // a batch at a time: a failed read rejects its batch at once, and no later batch starts
  for (let first = 0; first < reads.length; first += READ_CONCURRENCY)
    await Promise.all(reads.slice(first, first + READ_CONCURRENCY).map(async start => start()))
  console.info(`[revalidate] read the list, ${posts.length} posts and the categories`)
}

/** Waits for a read under way; its failure says what was being read. */
async function reading(what: string, pending: Promise<unknown>): Promise<void> {
  try {
    await pending
  }
  catch (error) {
    throw new Error(`reading ${what}: ${messageOf(error)}`, { cause: error })
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error)
}
