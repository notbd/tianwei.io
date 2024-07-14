import type { MetadataRoute } from 'next'
import { BasePaths } from '@/lib/paths'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: `${BasePaths.url}/`,
    },
  ]
}
