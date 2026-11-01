import { beforeEach, describe, expect, it, vi } from 'vitest'

const listAll = vi.fn()

vi.mock('@/lib/api', () => ({ getPosts: listAll }))

const { GET } = await import('./route')

function post(overrides: Record<string, unknown>) {
  return {
    slug: 'alpha',
    title: 'Alpha',
    description: null,
    category: 'articles',
    createdAt: new Date('2025-10-23T04:00:00.000Z'),
    updatedAt: null,
    ...overrides,
  }
}

async function feedXml(): Promise<string> {
  return (await GET()).text()
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('/feed.xml', () => {
  it('serves RSS 2.0 with one item per post and canonical absolute links', async () => {
    listAll.mockResolvedValue([
      post({}),
      post({
        slug: 'beta',
        title: 'Beta',
        createdAt: new Date('2024-04-15T04:00:00.000Z'),
      }),
    ])

    const response = await GET()
    expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8')

    const xml = await response.text()
    expect(xml).toContain('<rss version="2.0"')
    expect(xml.match(/<item>/g)).toHaveLength(2)
    expect(xml).toContain('<link>https://tianwei.io/posts/alpha</link>')
    expect(xml).toContain('<guid isPermaLink="true">https://tianwei.io/posts/beta</guid>')
    expect(xml).toContain('<pubDate>Thu, 23 Oct 2025 04:00:00 GMT</pubDate>')
    expect(xml).toContain('<atom:link href="https://tianwei.io/feed.xml" rel="self"')
  })

  it('escapes the five XML special characters in text nodes', async () => {
    listAll.mockResolvedValue([
      post({ title: 'Tom & Jerry <"\'>', description: 'a < b' }),
    ])

    const xml = await feedXml()
    expect(xml).toContain('<title>Tom &amp; Jerry &lt;&quot;&apos;&gt;</title>')
    expect(xml).toContain('<description>a &lt; b</description>')
  })

  it('omits the item <description> when a post has none', async () => {
    listAll.mockResolvedValue([
      post({ description: null }),
    ])

    const xml = await feedXml()
    // only the channel-level description remains
    expect(xml.match(/<description>/g)).toHaveLength(1)
  })

  it('sets lastBuildDate to the newest createdAt or updatedAt across all posts', async () => {
    // an OLD post with a NEW updatedAt must bump it, so readers re-poll
    listAll.mockResolvedValue([
      post({
        slug: 'old',
        createdAt: new Date('2024-04-15T04:00:00.000Z'),
        updatedAt: new Date('2025-12-01T05:00:00.000Z'),
      }),
      post({
        slug: 'new',
        createdAt: new Date('2025-10-23T04:00:00.000Z'),
      }),
    ])

    const xml = await feedXml()
    expect(xml).toContain('<lastBuildDate>Mon, 01 Dec 2025 05:00:00 GMT</lastBuildDate>')
  })
})
