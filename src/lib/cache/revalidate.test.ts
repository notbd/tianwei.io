import { beforeEach, describe, expect, it, vi } from 'vitest'

const revalidateTag = vi.fn()
const listAll = vi.fn()
const getBySlug = vi.fn()

vi.mock('next/cache', () => ({ revalidateTag }))
vi.mock('@/lib/api', () => ({
  apiClient: { post: { listAll, getBySlug } },
}))

const { revalidateAndWarmPost, revalidateAndWarmTags } = await import('./revalidate')

beforeEach(() => {
  vi.clearAllMocks()
  listAll.mockResolvedValue([{ slug: 'alpha' }, { slug: 'beta' }])
  getBySlug.mockResolvedValue({ slug: 'alpha' })
})

describe('revalidateAndWarmTags', () => {
  it('revalidates every tag and warms the posts warmer', async () => {
    const result = await revalidateAndWarmTags(['posts'])

    expect(revalidateTag).toHaveBeenCalledWith('posts', 'max')
    expect(listAll).toHaveBeenCalledOnce()
    // the posts warmer re-fetches every individual post
    expect(getBySlug).toHaveBeenCalledWith('alpha')
    expect(getBySlug).toHaveBeenCalledWith('beta')
    expect(result).toEqual({ success: true, revalidated: ['posts'], warmed: ['posts'] })
  })

  it('routes post-<slug> tags to the prefix warmer with the stripped slug', async () => {
    const result = await revalidateAndWarmTags(['post-hello-world'])

    expect(revalidateTag).toHaveBeenCalledWith('post-hello-world', 'max')
    expect(getBySlug).toHaveBeenCalledWith('hello-world')
    expect(listAll).not.toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(result.warmed).toEqual(['post-hello-world'])
  })

  it('revalidates unknown tags without warming, still succeeding', async () => {
    const result = await revalidateAndWarmTags(['mystery'])

    expect(revalidateTag).toHaveBeenCalledWith('mystery', 'max')
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

describe('revalidateAndWarmPost', () => {
  it('revalidates both the post tag and the list tag', async () => {
    await revalidateAndWarmPost('hello')

    expect(revalidateTag).toHaveBeenCalledWith('post-hello', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('posts', 'max')
  })
})
