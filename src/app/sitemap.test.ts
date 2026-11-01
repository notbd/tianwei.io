import { beforeEach, describe, expect, it, vi } from 'vitest'

const listAll = vi.fn()
const listCategories = vi.fn()

vi.mock('@/lib/api', () => ({
  apiClient: {
    post: { listAll },
    category: { listAll: listCategories },
  },
}))

const sitemap = (await import('./sitemap')).default

beforeEach(() => {
  vi.clearAllMocks()
  listCategories.mockResolvedValue(['articles'])
})

describe('sitemap', () => {
  it('lists the homepage, the posts index, categories, and every post', async () => {
    listAll.mockResolvedValue([
      {
        slug: 'alpha',
        createdAt: new Date('2025-10-23T04:00:00.000Z'),
        updatedAt: new Date('2025-11-05T05:00:00.000Z'),
      },
      { slug: 'beta', createdAt: new Date('2024-04-15T04:00:00.000Z'), updatedAt: null },
    ])

    const entries = await sitemap()
    const urls = entries.map(entry => entry.url)

    expect(urls[0]).toMatch(/\/$/)
    expect(urls).toContainEqual(expect.stringContaining('/posts'))
    expect(urls).toContainEqual(expect.stringContaining('/categories/articles'))
    expect(urls).toContainEqual(expect.stringContaining('/posts/alpha'))
    expect(urls).toContainEqual(expect.stringContaining('/posts/beta'))

    // lastModified prefers updatedAt, falls back to createdAt
    expect(entries.find(entry => entry.url.endsWith('/posts/alpha'))?.lastModified)
      .toEqual(new Date('2025-11-05T05:00:00.000Z'))
    expect(entries.find(entry => entry.url.endsWith('/posts/beta'))?.lastModified)
      .toEqual(new Date('2024-04-15T04:00:00.000Z'))
  })

  it('propagates an API failure instead of producing a sitemap without posts', async () => {
    // a reduced sitemap would be cached until the next content sync;
    // a throw fails the build or keeps the last good sitemap served
    listAll.mockRejectedValue(new Error('api down'))

    await expect(sitemap()).rejects.toThrow('api down')
  })
})
