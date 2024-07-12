import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tianwei Zhang',
    short_name: 'Tianwei.io',
    description: 'Tianwei Zhang\'s personal website',
    start_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    display: 'minimal-ui',
    background_color: '#09090B',
    theme_color: '#2F5651',
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
