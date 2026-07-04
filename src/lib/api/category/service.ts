import { z } from 'zod'
import { fetchList } from '../fetcher'

export const category = {
  /**
   * Get distinct categories across published posts.
   * Tagged 'posts': categories are derived from posts, so a content sync
   * that revalidates posts must refresh this too.
   */
  listAll: async (): Promise<string[]> => {
    return fetchList(
      '/api/categories',
      z.string(),
      {
        next: {
          revalidate: false,
          tags: ['posts'],
        },
      },
    )
  },
}
