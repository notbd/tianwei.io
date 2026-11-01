import type { MetadataRoute } from 'next'
import { apiClient } from '@/lib/api'
import { BasePaths, categoryPath, postPath } from '@/lib/paths'

// No fallback on API failure, on purpose. At build time a throw fails the
// build, like every other page does on a non-404 fetch error. During an
// on-demand regeneration a throw keeps the last good sitemap in the cache
// (https://nextjs.org/docs/app/guides/incremental-static-regeneration#handling-uncaught-exceptions),
// whereas returning a reduced list would cache a sitemap without any post
// until the next content sync.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([
    apiClient.post.listAll(),
    apiClient.category.listAll(),
  ])

  return [
    { url: `${BasePaths.url}/` },
    { url: `${BasePaths.url}/posts` },
    ...categories.map(category => ({
      url: `${BasePaths.url}${categoryPath(category)}`,
    })),
    ...posts.map(post => ({
      url: `${BasePaths.url}${postPath(post.slug)}`,
      lastModified: post.updatedAt ?? post.createdAt,
    })),
  ]
}
