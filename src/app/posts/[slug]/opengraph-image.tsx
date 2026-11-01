/* eslint-disable react-refresh/only-export-components -- Next.js metadata
 * file convention requires exporting size/contentType alongside the image */
import type { Post } from '@/lib/api'
import { ImageResponse } from 'next/og'
import { getPost, getPosts, isNotFoundError } from '@/lib/api'
import { formatPostDate } from '@/lib/dates'
import { site } from '@/lib/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type ImageProps = {
  params: Promise<{ slug: string }>
}

// Prerender one image per post. The page's generateStaticParams does not
// carry over to this route, which left every social unfurl paying a cold
// satori render; a slug outside this list still renders on demand.
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map(post => ({ slug: post.slug }))
}

export default async function OpengraphImage({ params }: ImageProps) {
  const { slug } = await params

  let post: Post
  try {
    post = await getPost(slug)
  }
  catch (error) {
    // a slug that names no post should not get a 200 default card
    if (isNotFoundError(error))
      return new Response('Not Found', { status: 404 })
    // Anything else propagates, like the page does: this route is
    // prerendered, so a site card drawn on a transient failure would be
    // cached until the next content sync. A throw fails the build instead,
    // and an on-demand render errors for that request and is retried on
    // the next one.
    throw error
  }

  const title = post.title
  const description = post.description ?? ''
  const dateLabel = formatPostDate(post.createdAt)

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
          <div style={{ fontSize: 32, color: '#a1a1aa' }}>{site.domain}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: title.length > 48
                ? 56
                : 68,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          {description !== '' && (
            <div style={{ fontSize: 30, color: '#a1a1aa', lineHeight: 1.4 }}>
              {description.length > 120
                ? `${description.slice(0, 117)}...`
                : description}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 26,
          color: '#71717a',
        }}
        >
          <div>{post.author}</div>
          <div>{dateLabel}</div>
        </div>
      </div>
    ),
    size,
  )
}
