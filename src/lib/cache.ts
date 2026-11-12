import type { UncachedRead } from '@/lib/api'
import { revalidateTag } from 'next/cache'
import { getCategories, getPost, getPosts, POSTS_TAG } from '@/lib/api'

// One route invocation reads every post; more at once would stampede the
// API as the catalog grows. The categories read counts toward the limit.
const READ_CONCURRENCY = 4
// The whole read, retries and the waits between them included. Well inside
// the route's maxDuration (60 s) and the content engine's 60 s timeout.
const READ_BUDGET_MS = 25_000

/**
 * Expires the `posts` tag, but only after reading everything it covers
 * straight from the API (the list, every post on it, the categories)
 * through the same schemas the pages use. A failed read, or the budget
 * running out, expires nothing: the site keeps serving what it has instead
 * of rendering pages against an API that cannot answer them.
 *
 * The budget is a deadline on the performance.now() clock. The fetcher
 * starts no request past it and cuts the ones in flight short, but a
 * response that arrived in time can still be parsed and validated past
 * it, so the clock is read once more when the reads are over: that check
 * is what makes "over the budget, nothing expired" hold. `budgetMs` is for
 * the tests; the route passes nothing.
 *
 * `{ expire: 0 }` expires the tagged entries outright once the route
 * handler returns, so the next request renders fresh content instead of
 * being served the previous version once ('max' is stale-while-revalidate).
 * That is the documented choice for invalidations arriving through a
 * webhook-style Route Handler:
 * https://nextjs.org/docs/app/api-reference/functions/revalidateTag
 */
export async function revalidatePosts({ budgetMs = READ_BUDGET_MS } = {}): Promise<{ ok: true } | { ok: false, message: string }> {
  const deadline = performance.now() + budgetMs
  let failure: string | undefined
  try {
    await readEverything({ deadline })
  }
  catch (error) {
    failure = messageOf(error)
  }
  // at the deadline counts as over it, whatever else went wrong
  if (performance.now() >= deadline)
    failure = `reading the content API took longer than ${budgetMs} ms`
  if (failure !== undefined) {
    console.error(`[revalidate] nothing expired: ${failure}`)
    return { ok: false, message: failure }
  }

  revalidateTag(POSTS_TAG, { expire: 0 })
  return { ok: true }
}

async function readEverything(uncached: UncachedRead): Promise<void> {
  const posts = await getPosts(uncached)
  await forEachConcurrently([
    {
      what: 'the categories',
      read: async () => getCategories(uncached),
    },
    ...posts.map(post => ({
      what: `post "${post.slug}"`,
      read: async () => getPost(post.slug, uncached),
    })),
  ], READ_CONCURRENCY, async ({ what, read }) => {
    try {
      await read()
    }
    catch (error) {
      throw new Error(`reading ${what}: ${messageOf(error)}`, { cause: error })
    }
  })
  console.info(`[revalidate] read the list, ${posts.length} posts and the categories`)
}

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error)
}

/**
 * Runs `task` over `items` with at most `limit` in flight. After the first
 * failure no further item starts; the tasks already running are waited
 * for, then that failure is thrown.
 */
async function forEachConcurrently<T>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items]
  const failures: unknown[] = []
  const worker = async () => {
    for (let item = queue.shift(); item !== undefined && failures.length === 0; item = queue.shift()) {
      try {
        await task(item)
      }
      catch (error) {
        failures.push(error)
      }
    }
  }
  await Promise.all(Array.from({
    length: Math.min(limit, queue.length),
  }, worker))
  if (failures.length > 0)
    throw failures[0]
}
