import { describe, expect, it } from 'vitest'
import { metadata, pageMetadata } from './metadata'

describe('pageMetadata', () => {
  it('repeats a page\'s title and description in its social cards, over the root\'s', () => {
    // Next merges metadata shallowly: without this a page's cards keep the root's title
    const page = pageMetadata('Posts', 'Every post.')
    expect(page).toMatchObject({ title: 'Posts', description: 'Every post.' })
    expect(page.openGraph).toEqual({ ...metadata.openGraph, title: 'Posts', description: 'Every post.' })
    expect(page.twitter).toEqual({ ...metadata.twitter, title: 'Posts', description: 'Every post.' })
  })
})
