import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: 'Tianwei.io',
    description: `${site.name}'s personal website`,
    start_url: '/',
    display: 'minimal-ui',
    icons: [
      {
        src: '/assets/icon-squircle-512.png',
        type: 'image/png',
        sizes: '512x512',
      },
      {
        src: '/assets/icon-squircle-192.png',
        type: 'image/png',
        sizes: '192x192',
      },
    ],
  }
}
