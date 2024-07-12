import type { MetadataRoute } from 'next'
import { userAgent } from 'next/server'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ('*'),
        allow: ['/'],
        disallow: [
          '/private/',
          '/no-crawl/',
          '/api/',
        ],
      },
      {
        userAgent: ('Googlebot'),
        disallow: ['/no-googlebot/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
  }
}
