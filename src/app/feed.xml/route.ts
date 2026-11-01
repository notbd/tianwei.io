import { getPosts } from '@/lib/api'
import { absoluteUrl, postPath, SITE_URL } from '@/lib/paths'
import { site } from '@/lib/site'

// Static + tagged data: the feed regenerates through the same on-demand
// revalidation flow as the pages (content sync -> revalidateTag('posts')).
export const dynamic = 'force-static'

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

export async function GET(): Promise<Response> {
  const posts = await getPosts()

  const items = posts.map((post) => {
    const url = absoluteUrl(postPath(post.slug))
    const descriptionTag = post.description !== null
      ? `\n      <description>${escapeXml(post.description)}</description>`
      : ''
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${post.createdAt.toUTCString()}</pubDate>${descriptionTag}
      <category>${escapeXml(post.category)}</category>
    </item>`
  }).join('\n')

  // max over every post's effective date: an OLD post with a NEW
  // updatedAt must bump this too, so readers re-poll
  const lastBuildDate = posts.length > 0
    ? new Date(Math.max(...posts.map(post => (post.updatedAt ?? post.createdAt).getTime()))).toUTCString()
    : new Date(0).toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${site.domain}</title>
    <link>${SITE_URL}</link>
    <description>Writings by ${site.name}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${absoluteUrl('/feed.xml')}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
