import { beforeEach, describe, expect, it, vi } from 'vitest'
import sitemap from './sitemap'

const { getCategories, getPosts } = vi.hoisted(() => ({
  getCategories: vi.fn(),
  getPosts: vi.fn(),
}))
vi.mock('@/lib/api', () => ({ getCategories, getPosts }))

beforeEach(() => {
  vi.clearAllMocks()
  getCategories.mockResolvedValue(['articles'])
})

describe('sitemap', () => {
  it('lists the homepage, the posts index, categories, and every post', async () => {
    getPosts.mockResolvedValue([
      {
        slug: 'alpha',
        createdAt: new Date('2025-10-23T04:00:00.000Z'),
        updatedAt: new Date('2025-11-05T05:00:00.000Z'),
      },
      {
        slug: 'beta',
        createdAt: new Date('2024-04-15T04:00:00.000Z'),
        updatedAt: null,
      },
    ])

    const entries = await sitemap()
    const urls = entries.map(entry => entry.url)

    expect(urls).toEqual([
      'https://tianwei.io/',
      'https://tianwei.io/posts',
      'https://tianwei.io/categories/articles',
      'https://tianwei.io/posts/alpha',
      'https://tianwei.io/posts/beta',
    ])

    // lastModified prefers updatedAt, falls back to createdAt
    expect(entries.find(entry => entry.url.endsWith('/posts/alpha'))?.lastModified)
      .toEqual(new Date('2025-11-05T05:00:00.000Z'))
    expect(entries.find(entry => entry.url.endsWith('/posts/beta'))?.lastModified)
      .toEqual(new Date('2024-04-15T04:00:00.000Z'))
  })

  it('propagates an API failure instead of producing a sitemap without posts', async () => {
    // a reduced sitemap would be cached until the next content sync;
    // a throw fails the build or keeps the last good sitemap served
    getPosts.mockRejectedValue(new Error('api down'))

    await expect(sitemap()).rejects.toThrow('api down')
  })
})
