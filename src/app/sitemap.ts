import type { MetadataRoute } from 'next'
import { getCategories, getPosts } from '@/lib/api'
import { absoluteUrl, categoryPath, postPath } from '@/lib/paths'

// No fallback on API failure, on purpose. At build time a throw fails the
// build, like every other page does on a non-404 fetch error. During an
// on-demand regeneration the request that hits the failure errors, and the
// last good sitemap stays cached for the retries that follow
// (https://nextjs.org/docs/app/guides/incremental-static-regeneration#handling-uncaught-exceptions),
// whereas returning a reduced list would cache a sitemap without any post
// until the next content sync.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([
    getPosts(),
    getCategories(),
  ])

  return [
    {
      url: absoluteUrl('/'),
    },
    {
      url: absoluteUrl('/posts'),
    },
    ...categories.map(category => ({
      url: absoluteUrl(categoryPath(category)),
    })),
    ...posts.map(post => ({
      url: absoluteUrl(postPath(post.slug)),
      lastModified: post.updatedAt ?? post.createdAt,
    })),
  ]
}
