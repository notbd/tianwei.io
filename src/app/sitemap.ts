import type { MetadataRoute } from 'next'
import { apiClient } from '@/lib/api'
import { BasePaths } from '@/lib/paths'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BasePaths.url}/` },
    { url: `${BasePaths.url}/posts` },
  ]

  try {
    const [posts, categories] = await Promise.all([
      apiClient.post.listAll(),
      apiClient.category.listAll(),
    ])
    return [
      ...staticEntries,
      ...categories.map(category => ({
        url: `${BasePaths.url}/categories/${category}`,
      })),
      ...posts.map(post => ({
        url: `${BasePaths.url}/posts/${post.slug}`,
        lastModified: post.updatedAt ?? post.createdAt,
      })),
    ]
  }
  catch (error) {
    // A transient API outage must not fail the build. Tradeoff: if this
    // fires during an on-demand regeneration (post-revalidation), the
    // degraded sitemap stays cached until the NEXT content sync — accepted,
    // since the fetcher already retries transient failures with backoff.
    console.error('sitemap: falling back to static entries:', error)
    return staticEntries
  }
}
