import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cacheTags } from '@/lib/api'
import { revalidateAndWarmTags } from '@/lib/cache'
import { secureEquals } from '@/lib/secureCompare'

// `{ slug }` refreshes that post plus the list; `{ tags }` and `{ tag }`
// name cache tags directly. The content engine's deploy sends `{ tags: ['posts'] }`.
const revalidateBodySchema = z.object({
  slug: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).min(1).optional(),
  tag: z.string().min(1).optional(),
})

function tagsToRevalidate({ slug, tags, tag }: z.infer<typeof revalidateBodySchema>): string[] | undefined {
  if (slug !== undefined) {
    return [
      cacheTags.post(slug),
      cacheTags.posts,
    ]
  }
  if (tags !== undefined)
    return tags
  return tag === undefined
    ? undefined
    : [tag]
}

export async function POST(request: NextRequest) {
  // Fail CLOSED on missing configuration: the old interpolated comparison
  // made an unset secret match the literal header "Bearer undefined".
  const secret = process.env.REVALIDATION_SECRET
  if (secret === undefined || secret === '') {
    console.error('REVALIDATION_SECRET is not configured — rejecting revalidation request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = request.headers.get('authorization') ?? ''
  if (!secureEquals(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // an unparsable or invalid body is the caller's error
  const body = revalidateBodySchema.safeParse(await request.json().catch(() => undefined))
  const tags = body.success
    ? tagsToRevalidate(body.data)
    : undefined
  if (tags === undefined) {
    return NextResponse.json(
      { error: 'Missing tag, tags, or slug' },
      { status: 400 },
    )
  }

  try {
    const result = await revalidateAndWarmTags(tags)
    // 207 Multi-Status: tags were revalidated but warming did not fully succeed
    return NextResponse.json(result, {
      status: result.success ? 200 : 207,
    })
  }
  catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error
          ? error.message
          : String(error),
      },
      { status: 500 },
    )
  }
}
