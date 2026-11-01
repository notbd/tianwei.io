import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidateTag, listAll, getBySlug } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  listAll: vi.fn(),
  getBySlug: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidateTag }))
vi.mock('@/lib/api', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/api')>(),
  getPosts: listAll,
  getPost: getBySlug,
}))

const { revalidateAndWarmTags } = await import('./cache')

beforeEach(() => {
  vi.clearAllMocks()
  listAll.mockResolvedValue([
    { slug: 'alpha' },
    { slug: 'beta' },
  ])
  getBySlug.mockResolvedValue({ slug: 'alpha' })
})

describe('revalidateAndWarmTags', () => {
  it('revalidates every tag and warms the posts warmer', async () => {
    const result = await revalidateAndWarmTags(['posts'])

    expect(revalidateTag).toHaveBeenCalledWith('posts', { expire: 0 })
    expect(listAll).toHaveBeenCalledOnce()
    // the posts warmer re-fetches every individual post
    expect(getBySlug).toHaveBeenCalledWith('alpha')
    expect(getBySlug).toHaveBeenCalledWith('beta')
    expect(result).toEqual({
      success: true,
      revalidated: ['posts'],
      warmed: ['posts'],
    })
  })

  it('warms post-<slug> tags by re-fetching that post', async () => {
    const result = await revalidateAndWarmTags(['post-hello-world'])

    expect(revalidateTag).toHaveBeenCalledWith('post-hello-world', { expire: 0 })
    expect(getBySlug).toHaveBeenCalledWith('hello-world')
    expect(listAll).not.toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(result.warmed).toEqual(['post-hello-world'])
  })

  it('treats a post tag whose post is gone (unpublished, deleted) as warmed', async () => {
    const { ApiError } = await import('@/lib/api')
    getBySlug.mockRejectedValue(new ApiError(404, 'Post not found.'))

    const result = await revalidateAndWarmTags(['post-gone'])

    expect(result).toEqual({
      success: true,
      revalidated: ['post-gone'],
      warmed: ['post-gone'],
    })
  })

  it('revalidates unknown tags without warming, still succeeding', async () => {
    const result = await revalidateAndWarmTags(['mystery'])

    expect(revalidateTag).toHaveBeenCalledWith('mystery', { expire: 0 })
    expect(result.success).toBe(true)
    expect(result.warmed).toEqual([])
  })

  it('reports success: false with an aggregated error when a warmer throws', async () => {
    // the deploy pipeline depends on this NOT being silently swallowed
    listAll.mockRejectedValue(new Error('api down'))

    const result = await revalidateAndWarmTags(['posts'])

    expect(result.success).toBe(false)
    expect(result.revalidated).toEqual(['posts'])
    expect(result.error).toContain('posts')
    expect(result.error).toContain('api down')
  })

  it('warms independent tags even when one fails', async () => {
    listAll.mockRejectedValue(new Error('api down'))

    const result = await revalidateAndWarmTags(['posts', 'post-hello'])

    expect(result.success).toBe(false)
    expect(result.warmed).toEqual(['post-hello'])
  })
})
