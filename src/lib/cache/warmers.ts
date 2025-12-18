import { apiClient } from '@/lib/api'

type CacheWarmer = () => Promise<void>
type PrefixWarmer = (id: string) => Promise<void>

/**
 * Registry of cache warmers for exact tag matches
 * Add new entries as more cacheable resources are added
 */
export const tagWarmers: Record<string, CacheWarmer> = {
  posts: async () => {
    const posts = await apiClient.post.listAll()
    await Promise.all(posts.map(p => apiClient.post.getBySlug(p.slug)))
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
