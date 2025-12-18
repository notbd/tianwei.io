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
      return NextResponse.json(result)
    }

    // Option 2: Revalidate multiple tags
    if (tags && Array.isArray(tags)) {
      const result = await revalidateAndWarmTags(tags)
      return NextResponse.json(result)
    }

    // Option 3: Revalidate a single tag
    if (tag) {
      const result = await revalidateAndWarmTags([tag])
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
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
