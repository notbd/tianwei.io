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
    // a transient API outage must not fail the whole build
    console.error('sitemap: falling back to static entries:', error)
    return staticEntries
  }
}
