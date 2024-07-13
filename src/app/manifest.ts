import type { MetadataRoute } from 'next'
import { SITE_BASE_URL } from '@/constants/constants'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tianwei Zhang',
    short_name: 'Tianwei.io',
    description: 'Tianwei Zhang\'s personal website',
    start_url: `${SITE_BASE_URL}/`,
    display: 'minimal-ui',
    icons: [
      {
        src: '/logo/icon-squircle-512.png',
        type: 'image/png',
        sizes: '512x512',
      },
      {
        src: '/logo/icon-squircle-192.png',
        type: 'image/png',
        sizes: '192x192',
      },
    ],
  }
}
