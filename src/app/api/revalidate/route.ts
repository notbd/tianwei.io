import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { revalidateAndWarmPost, revalidateAndWarmTags } from '@/lib/cache'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.REVALIDATION_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tag, tags, slug } = await request.json()

    // Option 1: Revalidate a specific post
    if (slug) {
      const result = await revalidateAndWarmPost(slug)

      // Return appropriate status based on success
      if (!result.success) {
        return NextResponse.json(result, { status: 207 }) // 207 Multi-Status for partial success
      }

      return NextResponse.json(result)
    }

    // Option 2: Revalidate multiple tags
    if (tags && Array.isArray(tags)) {
      const result = await revalidateAndWarmTags(tags)

      if (!result.success) {
        return NextResponse.json(result, { status: 207 })
      }

      return NextResponse.json(result)
    }

    // Option 3: Revalidate a single tag
    if (tag) {
      const result = await revalidateAndWarmTags([tag])

      if (!result.success) {
        return NextResponse.json(result, { status: 207 })
      }

      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Missing tag, tags, or slug' },
      { status: 400 },
    )
  }
  catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
