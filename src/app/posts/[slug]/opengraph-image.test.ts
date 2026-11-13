import { beforeEach, describe, expect, it, vi } from 'vitest'
import OpengraphImage from './opengraph-image'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('CONTENT_API_URL', 'https://api.example.test')
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('post OG image', () => {
  it('404s a slug the cached list lacks without asking the API for that post', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'success', count: 0, data: [] })))

    const response = await OpengraphImage({
      params: Promise.resolve({ slug: 'made-up' }),
    })

    expect(response.status).toBe(404)
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual(['https://api.example.test/api/posts'])
  })
})
