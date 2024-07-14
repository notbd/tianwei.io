import type { MetadataRoute } from 'next'
import { AssetPaths } from '@/lib/paths'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tianwei Zhang',
    short_name: 'Tianwei.io',
    description: 'Tianwei Zhang\'s personal website',
    start_url: '/',
    display: 'minimal-ui',
    icons: [
      {
        src: AssetPaths.manifestIcon512,
        type: 'image/png',
        sizes: '512x512',
      },
      {
        src: AssetPaths.manifestIcon192,
        type: 'image/png',
        sizes: '192x192',
      },
    ],
  }
}
