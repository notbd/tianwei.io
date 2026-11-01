/* eslint-disable react-refresh/only-export-components -- Next.js metadata
 * file convention requires exporting size/contentType alongside the image */
import type { Post } from '@/lib/api'
import { getPost, getPosts, isNotFoundError } from '@/lib/api'
import { formatPostDate } from '@/lib/dates'
import { OG_SIZE, ogCard } from '@/lib/ogCard'

export const size = OG_SIZE
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

  return ogCard({
    title: post.title,
    description: post.description,
    footer: [
      post.author,
      formatPostDate(post.createdAt),
    ],
  })
}
