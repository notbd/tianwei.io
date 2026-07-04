import { describe, expect, it } from 'vitest'
import { postSchema, postSummarySchema } from './schemas'

// Contract lock: this canonical fixture mirrors exactly what the API
// serves (columns of the `posts` table, camelCased, Date as ISO string).
// If parsing this ever fails, the API contract has drifted.
const CANONICAL_POST = {
  id: 1,
  slug: '1password-git-workflow',
  category: 'articles',
  title: 'Integrating 1Password into My Git Workflow',
  description: 'How I use 1Password ssh agent.',
  author: 'Tianwei Zhang',
  createdAt: '2025-10-23T00:00:00.000Z',
  isPublished: true,
  content: '# Hello\n\nBody.\n',
}

describe('postSchema', () => {
  it('parses the canonical API payload', () => {
    const post = postSchema.parse(CANONICAL_POST)
    expect(post.createdAt).toBeInstanceOf(Date)
    expect(post.createdAt.getTime()).toBe(Date.UTC(2025, 9, 23))
    expect(post.isPublished).toBe(true)
    expect(post.content).toBe('# Hello\n\nBody.\n')
  })

  it('accepts a null description', () => {
    const post = postSchema.parse({ ...CANONICAL_POST, description: null })
    expect(post.description).toBeNull()
  })

  it('parses updatedAt as a Date, passes null through, tolerates absence', () => {
    const withDate = postSchema.parse({ ...CANONICAL_POST, updatedAt: '2025-11-05T00:00:00.000Z' })
    expect(withDate.updatedAt).toBeInstanceOf(Date)
    expect(withDate.updatedAt?.getTime()).toBe(Date.UTC(2025, 10, 5))

    // null must stay null — never coerce to Date(0)
    const withNull = postSchema.parse({ ...CANONICAL_POST, updatedAt: null })
    expect(withNull.updatedAt).toBeNull()

    // absent (API predating the field) must still parse
    const absent = postSchema.parse(CANONICAL_POST)
    expect(absent.updatedAt).toBeUndefined()
  })

  it('rejects a missing or null content (DB nullability must never leak)', () => {
    const { content: _content, ...withoutContent } = CANONICAL_POST
    expect(() => postSchema.parse(withoutContent)).toThrow()
    expect(() => postSchema.parse({ ...CANONICAL_POST, content: null })).toThrow()
  })

  it('rejects a missing or null isPublished', () => {
    const { isPublished: _isPublished, ...withoutFlag } = CANONICAL_POST
    expect(() => postSchema.parse(withoutFlag)).toThrow()
    expect(() => postSchema.parse({ ...CANONICAL_POST, isPublished: null })).toThrow()
  })

  it('accepts any string slug (format enforcement lives in the API layer)', () => {
    expect(() => postSchema.parse({ ...CANONICAL_POST, slug: 'Anything Goes' })).not.toThrow()
    expect(() => postSchema.parse({ ...CANONICAL_POST, slug: 42 })).toThrow()
  })

  it('rejects a non-date createdAt', () => {
    expect(() => postSchema.parse({ ...CANONICAL_POST, createdAt: 'yesterday' })).toThrow()
  })
})

describe('postSummarySchema', () => {
  const CANONICAL_SUMMARY = {
    id: 1,
    slug: '1password-git-workflow',
    category: 'articles',
    title: 'Integrating 1Password into My Git Workflow',
    description: null,
    author: 'Tianwei Zhang',
    createdAt: '2024-04-15T00:00:00.000Z',
  }

  it('parses the canonical list payload', () => {
    const summary = postSummarySchema.parse(CANONICAL_SUMMARY)
    expect(summary.createdAt.getTime()).toBe(Date.UTC(2024, 3, 15))
  })

  it('does not require content or isPublished', () => {
    expect(() => postSummarySchema.parse(CANONICAL_SUMMARY)).not.toThrow()
  })

  it('strips content when present (omit semantics)', () => {
    const summary = postSummarySchema.parse({ ...CANONICAL_SUMMARY, content: 'x' })
    expect(summary).not.toHaveProperty('content')
  })
})
