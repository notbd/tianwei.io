import type { ReactElement, ReactNode } from 'react'
import type { Post } from '@/lib/api'
import { isValidElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PostPage, { generateMetadata } from './page'

const { draftMode, findPost, getDraftPost } = vi.hoisted(() => ({
  draftMode: vi.fn(),
  findPost: vi.fn(),
  getDraftPost: vi.fn(),
}))
// next/font only exists inside Next's compiler
vi.mock('@/styles/fonts/mono', () => ({
  berkeleyMono: { variable: 'font-berkeley-mono' },
}))
vi.mock('next/headers', () => ({ draftMode }))
vi.mock('@/lib/api', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/api')>(),
  findPost,
  getDraftPost,
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

type ElementProps = { children?: ReactNode, name?: unknown, content?: unknown }

/** Every element of a tree as returned, without calling a component in it. */
function elementsIn(node: ReactNode): ReactElement<ElementProps>[] {
  if (isValidElement<ElementProps>(node))
    return [node].concat(elementsIn(node.props.children))
  if (typeof node === 'object' && node !== null && Symbol.iterator in node)
    return Array.from(node).flatMap(child => elementsIn(child))
  return []
}

beforeEach(() => {
  vi.clearAllMocks()
  draftMode.mockResolvedValue({ isEnabled: false })
  findPost.mockResolvedValue(alpha)
})

describe('post page', () => {
  it('renders exactly one post-body-sha256 meta tag, the SHA-256 of the post body', async () => {
    const hashTags = elementsIn(await PostPage(props('alpha')))
      .filter(element => element.type === 'meta' && element.props.name === 'post-body-sha256')

    expect(hashTags.map(tag => tag.props.content)).toEqual([
      '3c57f811de53a11a4341201a1927be6cca8210507f79ea7e7a6b4c15969f995e',
    ])
  })
})

describe('post page metadata', () => {
  it('is a not-found page for a slug that names no published post', async () => {
    findPost.mockResolvedValue(undefined)
    await expect(generateMetadata(props('nope'))).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' })
  })

  it('reads a draft through the preview endpoint in draft mode, without the list', async () => {
    draftMode.mockResolvedValue({ isEnabled: true })
    getDraftPost.mockResolvedValue({ ...alpha, isPublished: false })

    expect(await generateMetadata(props('alpha'))).toMatchObject({ title: 'Alpha' })
    expect(getDraftPost).toHaveBeenCalledWith('alpha')
    expect(findPost).not.toHaveBeenCalled()
  })
})
