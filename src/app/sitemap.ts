import type { MetadataRoute } from 'next'
import { SITE_BASE_URL } from '@/constants/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: `${SITE_BASE_URL}/`,
    },
  ]
}
