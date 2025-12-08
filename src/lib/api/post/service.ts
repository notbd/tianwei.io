import type { Post, PostSummary } from './schemas'
import { fetchList, fetchOne } from '../fetcher'
import { postSchema, postSummarySchema } from './schemas'

export const post = {
  /**
   * Get list of all published posts (summary view)
   */
  listAll: async (): Promise<PostSummary[]> => {
    return fetchList('/api/posts', postSummarySchema, {
      next: { revalidate: 60, tags: ['posts'] },
    })
  },

  /**
   * Get a single post by slug (full view)
   */
  getBySlug: async (slug: string): Promise<Post> => {
    return fetchOne(`/api/post/${slug}`, postSchema, {
      next: { revalidate: 60, tags: ['posts', `post-${slug}`] },
    })
  },
}
