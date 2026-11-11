import type { Post } from '@/lib/api'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateMetadata } from './page'

const { draftMode, getDraftPost, getPost } = vi.hoisted(() => ({
  draftMode: vi.fn(),
  getDraftPost: vi.fn(),
  getPost: vi.fn(),
}))
vi.mock('next/headers', () => ({ draftMode }))
vi.mock('@/lib/api', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/api')>(),
  getDraftPost,
  getPost,
}))

const alpha: Post = {
  id: 1,
  slug: 'alpha',
  category: 'articles',
  title: 'Alpha',
  description: null,
  author: 'Tianwei Zhang',
  createdAt: new Date('2025-10-23T04:00:00.000Z'),
  updatedAt: null,
  isPublished: true,
  content: '# Alpha\n\nBody.\n',
}

function props(slug: string) {
  return {
    params: Promise.resolve({ slug }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  draftMode.mockResolvedValue({ isEnabled: false })
  getPost.mockResolvedValue(alpha)
})

describe('post page metadata', () => {
  it('reports the SHA-256 of the post body in the post-body-sha256 meta tag', async () => {
    const metadata = await generateMetadata(props('alpha'))
    expect(metadata.other).toEqual({
      'post-body-sha256': '3c57f811de53a11a4341201a1927be6cca8210507f79ea7e7a6b4c15969f995e',
    })
  })

  it('reads a draft through the preview endpoint in draft mode', async () => {
    draftMode.mockResolvedValue({ isEnabled: true })
    getDraftPost.mockResolvedValue({ ...alpha, isPublished: false })

    expect(await generateMetadata(props('alpha'))).toMatchObject({ title: 'Alpha' })
    expect(getDraftPost).toHaveBeenCalledWith('alpha')
    expect(getPost).not.toHaveBeenCalled()
  })
})
