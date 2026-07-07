import { apiClient } from '@/lib/api'

type CacheWarmer = () => Promise<void>
type PrefixWarmer = (id: string) => Promise<void>

// Warming runs inside one revalidate-route invocation; unbounded
// Promise.all would fire N concurrent origin fetches and race the
// function timeout as the catalog grows. Any worker failure still
// rejects the whole warm (the deploy pipeline keys off that).
const WARM_CONCURRENCY = 4

async function forEachWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift())
      await fn(item)
  })
  await Promise.all(workers)
}

/**
 * Registry of cache warmers for exact tag matches
 * Add new entries as more cacheable resources are added
 */
export const tagWarmers: Record<string, CacheWarmer> = {
  posts: async () => {
    console.info('[warmer] posts: start')
    const posts = await apiClient.post.listAll()
    console.info('[warmer] posts: fetched list', posts.length)

    await forEachWithConcurrency(posts, WARM_CONCURRENCY, async (post) => {
      await apiClient.post.getBySlug(post.slug)
      console.info('[warmer] post:', post.slug, 'done')
    })

    console.info('[warmer] posts: done')
  },
}

/**
 * Registry of cache warmers for prefixed tags (e.g., 'post-hello-world')
 * Key is the prefix, value is a function that receives the id after the prefix
 */
export const prefixWarmers: Record<string, PrefixWarmer> = {
  'post-': async (slug) => {
    await apiClient.post.getBySlug(slug)
  },
}
