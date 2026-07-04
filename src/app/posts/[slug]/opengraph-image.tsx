/* eslint-disable react-refresh/only-export-components -- Next.js metadata
 * file convention requires exporting size/contentType alongside the image */
import { ImageResponse } from 'next/og'
import { apiClient } from '@/lib/api'
import { formatPostDate } from '@/lib/dates'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type ImageProps = {
  params: Promise<{ slug: string }>
}

export default async function OpengraphImage({ params }: ImageProps) {
  const { slug } = await params

  let title = 'tianwei.io'
  let description = ''
  let dateLabel = ''
  try {
    const post = await apiClient.post.getBySlug(slug)
    title = post.title
    description = post.description ?? ''
    dateLabel = formatPostDate(post.createdAt)
  }
  catch {
    // fall back to the site card rather than failing the build
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          backgroundColor: '#09090b', // zinc-950
          color: '#fafafa', // zinc-50
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              backgroundColor: '#0f766e', // teal-700
            }}
          />
          <div style={{ fontSize: 32, color: '#a1a1aa' }}>tianwei.io</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: title.length > 48 ? 56 : 68,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          {description !== '' && (
            <div style={{ fontSize: 30, color: '#a1a1aa', lineHeight: 1.4 }}>
              {description.length > 120 ? `${description.slice(0, 117)}...` : description}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: '#71717a' }}>
          <div>Tianwei Zhang</div>
          <div>{dateLabel}</div>
        </div>
      </div>
    ),
    size,
  )
}
