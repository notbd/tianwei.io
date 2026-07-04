import { apiClient } from '@/lib/api'
import { BasePaths } from '@/lib/paths'

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
  const posts = await apiClient.post.listAll()

  const items = posts.map((post) => {
    const url = `${BasePaths.url}/posts/${post.slug}`
    const descriptionTag = post.description !== null && post.description !== ''
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

  const lastBuildDate = posts.length > 0
    ? (posts[0].updatedAt ?? posts[0].createdAt).toUTCString()
    : new Date(0).toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>tianwei.io</title>
    <link>${BasePaths.url}</link>
    <description>Writings by Tianwei Zhang</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BasePaths.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
