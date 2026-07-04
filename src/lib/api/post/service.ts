import type { Post, PostSummary } from './schemas'
import { fetchList, fetchOne } from '../fetcher'
import { postSchema, postSummarySchema } from './schemas'

export const post = {
  /**
   * Get list of all published posts (summary view)
   */
  listAll: async (): Promise<PostSummary[]> => {
    return fetchList(
      '/api/posts',
      postSummarySchema,
      {
        next: {
          revalidate: false,
          tags: ['posts'],
        },
      },
    )
  },

  /**
   * Get a single post by slug (full view)
   */
  getBySlug: async (slug: string): Promise<Post> => {
    return fetchOne(
      `/api/post/${slug}`,
      postSchema,
      {
        next: {
          revalidate: false,
          tags: [
            'posts',
            `post-${slug}`,
          ],
        },
      },
    )
  },

  /**
   * Get a single post regardless of publish status (draftMode only).
   * Requires PREVIEW_SECRET; never cached.
   */
  getPreviewBySlug: async (slug: string): Promise<Post> => {
    const previewSecret = process.env.PREVIEW_SECRET
    if (previewSecret === undefined || previewSecret === '')
      throw new Error('PREVIEW_SECRET is not configured')

    return fetchOne(
      `/api/__preview/post/${slug}`,
      postSchema,
      {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${previewSecret}` },
      },
    )
  },
}
